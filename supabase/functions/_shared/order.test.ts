// @vitest-environment node
// Tests for the order handler the place-order and create-guest-order functions
// share. Run with `npm test`. supabase-js is replaced by an in-memory stand-in
// (see vitest.config.ts and ./testing/fakeSupabase.ts); nothing here touches a
// real database.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { beforeAll, describe, expect, it } from 'vitest';
import { beforeNextRead, calls, clearHooks, db, setRpcResult, useOrderFunction, whileOrderFunctionWaits } from './testing/fakeSupabase';
import { calculateProductPrice } from './pricing';

const env: Record<string, string> = {
  SUPABASE_URL: 'http://fake',
  SUPABASE_ANON_KEY: 'anon',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-secret',
};
(globalThis as any).Deno = { env: { get: (key: string) => env[key] } };

let handleOrderRequest: typeof import('./order').handleOrderRequest;
let signQuote: typeof import('./order').signQuote;
let verifyQuote: typeof import('./order').verifyQuote;
beforeAll(async () => {
  ({ handleOrderRequest, signQuote, verifyQuote } = await import('./order'));
});

const P1 = "11111111-1111-4111-8111-111111111111";
const ring = { id: P1, name: "Ring", slug: "ring", images: ["https://img/ring.jpg"], category: "rings", metal_type: "gold_22k",
  metal_type_id: null, weight_grams: 5, making_charge_percent: 12, diamond_cost: 0, stone_cost: 0, specifications: {}, is_active: true, stock_quantity: 4 };
function reset() {
  db.products = [{ ...ring }];
  db.product_variations = [
    { id: "v14", product_id: P1, variation_type: "size", size_value: "14 ", size_label: "Ring Size", metal_type: null, price_adjustment: 900, weight_adjustment: 0.3, is_available: true, is_default: false, image_url: null },
    { id: "eng", product_id: P1, variation_type: "custom", size_value: null, size_label: "Engraving", metal_type: null, price_adjustment: 500, weight_adjustment: 0, is_available: true, is_default: false, image_url: null },
  ];
  db.metal_types = [{ id: "m22", slug: "gold_22k", name: "22K Gold", rate_per_gram: 0, is_active: true }];
  db.gold_rates = [{ rate_22k: 9000, rate_24k: 9818, rate_18k: 7364, is_current: true }];
  db.site_settings = [{ key: "gst_rate_percent", value: { rate: 3 } }];
  db.orders = [];
  db.order_items = [];
  calls.rpc = [];
  clearHooks();
  setRpcResult({ data: { id: "o1", order_number: "KRT261112345678", created_at: "2026-11-18T10:00:00Z", existing: false, short: [] }, error: null });
}
const cors = { "Access-Control-Allow-Origin": "https://www.krtjewellers.com" };
const req = (token?: string) => new Request("http://x", { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {} });
const address = { full_name: "Priya", phone: "+91 98430 10986", address_line1: "1154 Big Bazaar St", address_line2: "", city: "Coimbatore", state: "tamil nadu", pincode: "641001" };
const listing = () => calculateProductPrice(db.products[0], db.gold_rates[0], undefined, 3, db.metal_types);
const call = async (body: any, token?: string, legacy?: any) => { const r = await handleOrderRequest(req(token), body, cors, legacy); return { status: r.status, body: await r.json() }; };
const items = [{ product_id: P1, quantity: 1, selected_variations: {} }];

it("quote returns server totals and a signed token", async () => {
  reset();
  const { status, body } = await call({ mode: "quote", items: [{ product_id: P1, quantity: 2, selected_variations: {} }] });
  expect(status).toEqual(200);
  expect(body.quote.total_amount).toEqual(listing().total * 2);
  const payload = await verifyQuote(body.quote_token);
  expect(payload && payload.order.total_amount === listing().total * 2 && payload.rows.length === 1).toBeTruthy();
});

it("places a COD order with server prices; browser totals ignored", async () => {
  reset();
  const { status, body } = await call({
    mode: "place", items: [{ product_id: P1, quantity: 1, selected_variations: {}, unit_price: 1 }],
    shipping_address: address, payment_method: "cod", expected_total: listing().total, status: "confirmed", total_amount: 1,
    checkout_ref: "0b0e8a52-58a8-4d1c-9a67-2f6f4c1e7a11",
  });
  expect(status, JSON.stringify(body)).toEqual(200);
  expect(body.order_number).toEqual("KRT261112345678");
  const { args } = calls.rpc[0];
  expect(args.p_order.total_amount).toEqual(listing().total);
  expect(args.p_order.user_id).toEqual(null);
  expect(args.p_order.shipping_address.phone).toEqual("9843010986");
  expect(args.p_order.shipping_address.state).toEqual("Tamil Nadu");
  expect(args.p_order.allow_backorder).toEqual(false);
  expect(args.p_order.checkout_ref).toEqual("0b0e8a52-58a8-4d1c-9a67-2f6f4c1e7a11");
  expect(!("status" in args.p_order), "status is not sent; the database sets pending").toBeTruthy();
  expect(args.p_items[0].unit_price).toEqual(listing().total);
});

it("signed-in customer's order is linked to their account", async () => {
  reset();
  const { status } = await call({ mode: "place", items, shipping_address: address, payment_method: "cod" }, "user-token");
  expect(status).toEqual(200);
  expect(calls.rpc[0].args.p_order.user_id).toEqual("user-1");
});

it("COD: a total the customer did not see is refused", async () => {
  reset();
  const { status, body } = await call({ mode: "place", items, shipping_address: address, payment_method: "cod", expected_total: 100 });
  expect(status).toEqual(409);
  expect(body.code).toEqual("PRICE_CHANGED");
  expect(calls.rpc.length).toEqual(0);
});

it("UPI: the gold rate changes while the customer pays - order saved at the quoted price", async () => {
  reset();
  const quote = await call({ mode: "quote", items, shipping_address: address, payment_method: "upi", expected_total: listing().total });
  expect(quote.status, JSON.stringify(quote.body)).toEqual(200);
  const quotedTotal = quote.body.quote.total_amount;
  db.gold_rates = [{ rate_22k: 9500, rate_24k: 10300, rate_18k: 7700, is_current: true }];   // rate goes up
  db.products[0].stock_quantity = 0;                                                          // and the piece sells out
  const placed = await call({ mode: "place", items, shipping_address: address, payment_method: "upi",
    payment: { utr: "432118765432" }, expected_total: quotedTotal, quote_token: quote.body.quote_token });
  expect(placed.status, JSON.stringify(placed.body)).toEqual(200);
  const { args } = calls.rpc[0];
  expect(args.p_order.total_amount).toEqual(quotedTotal);
  expect(args.p_order.gold_rate_at_order).toEqual(9000);
  expect(args.p_order.allow_backorder).toEqual(true);
  expect(args.p_order.staff_alert).toEqual(null);
  expect(placed.body.total_amount).toEqual(quotedTotal);
  expect(placed.body.notice).toEqual(null);
});

it("UPI: stock ran out while paying - order saved and the customer is told", async () => {
  reset();
  const quote = await call({ mode: "quote", items, shipping_address: address, payment_method: "upi" });
  setRpcResult({ data: { id: "o2", order_number: "KRT261100000002", created_at: "2026-11-18T10:00:00Z", existing: false, short: ["Ring"] }, error: null });
  const placed = await call({ mode: "place", items, shipping_address: address, payment_method: "upi", payment: { utr: "432118765432" }, quote_token: quote.body.quote_token });
  expect(placed.status).toEqual(200);
  expect(placed.body.notice).toContain("no longer available");
  expect(placed.body.notice).toContain("Ring");
});

it("UPI: a forged or altered quote is ignored", async () => {
  reset();
  const quote = await call({ mode: "quote", items });
  const [payload, signature] = quote.body.quote_token.split(".");
  const cheap = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(payload.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0))));
  cheap.order.total_amount = 1; cheap.rows[0].unit_price = 1; cheap.rows[0].total_price = 1;
  const forgedPayload = btoa(JSON.stringify(cheap)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  expect(await verifyQuote(`${forgedPayload}.${signature}`)).toEqual(null);
  expect(await verifyQuote("not-a-token")).toEqual(null);
  expect(await verifyQuote(null)).toEqual(null);
  const placed = await call({ mode: "place", items, shipping_address: address, payment_method: "upi", payment: { utr: "432118765432" },
    expected_total: 1, quote_token: `${forgedPayload}.${signature}` });
  expect(placed.status).toEqual(200);
  const { args } = calls.rpc[0];
  expect(args.p_order.total_amount, "saved at the real price").toEqual(listing().total);
  expect(args.p_order.staff_alert).toContain("shown ₹1;");
  expect(placed.body.notice).toContain("price changed");
});

it("UPI: an expired quote falls back to today's price with a note for staff", async () => {
  reset();
  const expired = await signQuote({ v: 1, exp: Date.now() - 1000, order: { subtotal: 1, gst_amount: 0, total_amount: 1, gold_rate_at_order: 1, gst_rate: 3, item_count: 1 }, rows: [{ product_id: P1 } as never] });
  expect(await verifyQuote(expired)).toEqual(null);
  const shown = listing().total;
  db.gold_rates = [{ rate_22k: 9500, rate_24k: 10300, rate_18k: 7700, is_current: true }];
  const placed = await call({ mode: "place", items, shipping_address: address, payment_method: "upi", payment: { utr: "432118765432" }, expected_total: shown, quote_token: expired });
  expect(placed.status).toEqual(200);
  const { args } = calls.rpc[0];
  expect(args.p_order.total_amount).toEqual(listing().total);
  expect(args.p_order.total_amount > shown).toBeTruthy();
  expect(args.p_order.staff_alert).toContain("Check the amount received");
  expect(placed.body.notice).toContain("We will contact you about the difference");
});

it("UPI: if a paid order still cannot be saved, the customer is told what to do", async () => {
  reset();
  db.products[0].is_active = false;
  const placed = await call({ mode: "place", items, shipping_address: address, payment_method: "upi", payment: { utr: "432118765432" } });
  expect(placed.status).toEqual(409);
  expect(placed.body.error).toContain("your money is safe");
  expect(placed.body.error).toContain("98430 10986");
  reset();
  const bad = await call({ mode: "place", items, shipping_address: address, payment_method: "upi", payment: { utr: "" } });
  expect(bad.body.code).toEqual("INVALID_UTR");
  expect(!bad.body.error.includes("money is safe"), "a mistyped reference just asks for it again").toBeTruthy();
});

it("quote for UPI checks the address and order limit before a QR code is shown", async () => {
  reset();
  let r = await call({ mode: "quote", items, shipping_address: { ...address, pincode: "12" }, payment_method: "upi" });
  expect(r.body.code).toEqual("INVALID_ADDRESS");
  const now = new Date().toISOString();
  db.orders = [1, 2, 3].map((i) => ({ id: `o${i}`, created_at: now, shipping_address: { phone: "9843010986" } }));
  r = await call({ mode: "quote", items, shipping_address: address, payment_method: "upi" });
  expect(r.status).toEqual(429);
});

it("order limit: a quoted UPI order still goes through; unquoted orders are limited", async () => {
  reset();
  const quote = await call({ mode: "quote", items, shipping_address: address, payment_method: "upi" });
  const now = new Date().toISOString();
  db.orders = [1, 2, 3].map((i) => ({ id: `o${i}`, created_at: now, shipping_address: { phone: "9843010986" } }));
  const paid = await call({ mode: "place", items, shipping_address: address, payment_method: "upi", payment: { utr: "432118765432" }, quote_token: quote.body.quote_token });
  expect(paid.status).toEqual(200);
  const cod = await call({ mode: "place", items, shipping_address: address, payment_method: "cod" });
  expect(cod.status).toEqual(429);
});

it("prices the chosen size and engraving from the database, not the browser", async () => {
  reset();
  const selection = { metalType: "22K Gold", metalTypeSlug: "gold_22k", size: "14", attributes: [], addOns: ["Engraving"],
    engraving: { text: "  Forever and always, my dear  ", font: "comic-sans" },
    _optionValues: { metal: "gold_22k", size: "14", gemstones: [], carats: [], attributes: [], addOns: ["eng"] } };
  const { status, body } = await call({ mode: "place", items: [{ product_id: P1, quantity: 1, selected_variations: { ...selection, priceAdjustment: -50000 } }],
    shipping_address: address, payment_method: "cod" });
  expect(status, JSON.stringify(body)).toEqual(200);
  // 5.3 g × 9000 = 47700; making 12% = 5724; size +900; engraving +500 → 54824
  expect(body.subtotal).toEqual(54824);
  expect(body.total_amount).toEqual(54824 + Math.round(54824 * 0.03));
  const saved = calls.rpc[0].args.p_items[0].selected_variations;
  expect(saved.engraving, "engraving cut to 15 characters and a known font").toEqual({ text: "Forever and alw", font: "script" });
  expect(!("_optionValues" in saved) && !("priceAdjustment" in saved)).toBeTruthy();
});

it("odd engraving values from a modified browser do not break the order", async () => {
  reset();
  const selection = { metalType: "22K Gold", metalTypeSlug: "gold_22k", size: "14", engraving: { text: { evil: true }, font: 5 },
    _optionValues: { metal: "gold_22k", size: "14", gemstones: [], carats: [], attributes: [], addOns: ["eng"] } };
  const { status, body } = await call({ mode: "quote", items: [{ product_id: P1, quantity: 1, selected_variations: selection }] });
  expect(status, JSON.stringify(body)).toEqual(200);
});

it("refuses an option that no longer exists", async () => {
  reset();
  const selection = { metalType: "22K Gold", metalTypeSlug: "gold_22k", size: "14", _optionValues: { metal: "gold_99k", size: "14", gemstones: [], carats: [], attributes: [], addOns: [] } };
  const { status, body } = await call({ mode: "quote", items: [{ product_id: P1, quantity: 1, selected_variations: selection }] });
  expect(status).toEqual(409);
  expect(body.code).toEqual("ITEM_OPTIONS_CHANGED");
});

it("validates the address", async () => {
  reset();
  const { status, body } = await call({ mode: "place", items, shipping_address: { ...address, phone: "12345", pincode: "64100", state: "Narnia" }, payment_method: "cod" });
  expect(status).toEqual(400);
  expect(body.code).toEqual("INVALID_ADDRESS");
  expect(body.fields).toEqual(["a 10-digit mobile number", "state", "a 6-digit pincode"]);
  const ok = await call({ mode: "place", items, shipping_address: { ...address, state: "TN" }, payment_method: "cod" });
  expect(ok.status).toEqual(200);
  expect(calls.rpc[0].args.p_order.shipping_address.state).toEqual("Tamil Nadu");
});

it("stock and quantity limits (COD)", async () => {
  reset();
  let r = await call({ mode: "place", items: [{ product_id: P1, quantity: 5 }], shipping_address: address, payment_method: "cod" });
  expect(r.body.code).toEqual("OUT_OF_STOCK");
  r = await call({ mode: "quote", items: [{ product_id: P1, quantity: 0 }] });
  expect(r.body.code).toEqual("INVALID_QUANTITY");
  r = await call({ mode: "quote", items: [] });
  expect(r.body.code).toEqual("EMPTY_CART");
  r = await call({ mode: "quote", items: [{ product_id: "not-a-uuid", quantity: 1 }] });
  expect(r.body.code).toEqual("INVALID_ITEM");
  setRpcResult({ data: null, error: { message: "OUT_OF_STOCK:" + P1 } });
  r = await call({ mode: "place", items, shipping_address: address, payment_method: "cod" });
  expect(r.status).toEqual(409);
  expect(r.body.code).toEqual("OUT_OF_STOCK");
});

it("no gold rate means no orders", async () => {
  reset();
  db.gold_rates = [];
  const r = await call({ mode: "quote", items });
  expect(r.status).toEqual(503);
  expect(r.body.code).toEqual("RATE_UNAVAILABLE");
});

it("a checkout id that is not well formed is dropped", async () => {
  reset();
  await call({ mode: "place", items, shipping_address: address, payment_method: "cod", checkout_ref: "x'; DROP TABLE orders;--" });
  expect(calls.rpc[0].args.p_order.checkout_ref).toEqual(null);
});

it("old storefront code: paid UPI order without a reference is kept, at the server price", async () => {
  reset();
  const legacy = { allowMissingUtr: true, requestedOrderNumber: "KRT26110042" };
  const r = await call({ mode: "place", items, payment_method: "upi", payment: {}, expected_total: 40000, checkout_ref: "legacy:KRT26110042",
    shipping_address: { full_name: "Ravi", phone: "098430 10986", address_line1: "12 Main Rd", city: "Salem", state: "T.N", pincode: "636001" } }, undefined, legacy);
  expect(r.status, JSON.stringify(r.body)).toEqual(200);
  const { args } = calls.rpc[0];
  expect(args.p_order.payment_utr).toEqual(null);
  expect(args.p_order.total_amount).toEqual(listing().total);
  expect(args.p_order.requested_order_number).toEqual("KRT26110042");
  expect(args.p_order.checkout_ref).toEqual("legacy:KRT26110042");
  expect(args.p_order.shipping_address.state).toEqual("Tamil Nadu");
  expect(args.p_order.shipping_address.phone).toEqual("9843010986");
  expect(args.p_order.staff_alert).toContain("shown ₹40,000");
  // an address the old form allowed but the new one would not is still kept
  const odd = await call({ mode: "place", items, payment_method: "upi", payment: {},
    shipping_address: { full_name: "A", phone: "+1 415 555 0100 22", address_line1: "X", city: "Y", state: "Somewhere", pincode: "00501" } }, undefined, legacy);
  expect(odd.status, JSON.stringify(odd.body)).toEqual(200);
  expect(calls.rpc[1].args.p_order.shipping_address.state).toEqual("Somewhere");
});

// A checkout id is sent with every order so a repeat (the first reply was
// lost, the customer pressed the button again) returns the order already saved.
describe("repeated checkouts", () => {
  const ref = "5f0c7a3e-4b1d-4e6a-9c2f-7d8e9a0b1c2d";
  const cod = (extra: Record<string, unknown> = {}) => ({ mode: "place", items, shipping_address: address, payment_method: "cod", checkout_ref: ref, ...extra });

  it("returns the saved order when the first attempt took the last piece", async () => {
    reset();
    useOrderFunction();
    db.products[0].stock_quantity = 1;
    const first = await call(cod({ expected_total: listing().total }));
    expect(first.status, JSON.stringify(first.body)).toEqual(200);
    expect(db.products[0].stock_quantity).toEqual(0);

    const again = await call(cod({ expected_total: listing().total }));
    expect(again.status, JSON.stringify(again.body)).toEqual(200);
    expect(again.body.order_number).toEqual(first.body.order_number);
    expect(again.body.already_placed).toEqual(true);
    expect(again.body.total_amount).toEqual(first.body.total_amount);
    expect(again.body.notice).toEqual(null);
    expect(db.orders.length).toEqual(1);
    expect(calls.rpc.length, "the repeat never reaches the order function").toEqual(1);
  });

  // Two copies of one checkout overlap when a retry is sent while the first
  // request is still running (for example after a dropped connection).
  it("answers an overlapping copy from the order its twin saved while it waited in the database", async () => {
    reset();
    useOrderFunction();
    db.products[0].stock_quantity = 1;
    let twin: { status: number; body: any } | null = null;
    // This copy finds no saved order and still sees one piece in stock; its
    // twin commits while this copy waits for the product lock, so the database
    // refuses this copy as out of stock.
    whileOrderFunctionWaits(async () => {
      twin = await call(cod({ expected_total: listing().total }));
    });
    const second = await call(cod({ expected_total: listing().total }));
    expect(twin!.status, JSON.stringify(twin!.body)).toEqual(200);
    expect(second.status, JSON.stringify(second.body)).toEqual(200);
    expect(second.body.already_placed).toEqual(true);
    expect(second.body.order_number).toEqual(twin!.body.order_number);
    expect(db.orders.length).toEqual(1);
    expect(db.products[0].stock_quantity).toEqual(0);
  });

  it("answers an overlapping copy from the saved order when its twin took the last piece first", async () => {
    reset();
    useOrderFunction();
    db.products[0].stock_quantity = 1;
    let twin: { status: number; body: any } | null = null;
    // The twin saves the order after this copy looked for it, before this copy
    // reads the stock.
    beforeNextRead("products", async () => {
      twin = await call(cod({ expected_total: listing().total }));
    });
    const second = await call(cod({ expected_total: listing().total }));
    expect(twin!.status, JSON.stringify(twin!.body)).toEqual(200);
    expect(second.status, JSON.stringify(second.body)).toEqual(200);
    expect(second.body.already_placed).toEqual(true);
    expect(second.body.order_number).toEqual(twin!.body.order_number);
    expect(db.orders.length).toEqual(1);
  });

  it("still refuses a sold-out item when this checkout has no saved order", async () => {
    reset();
    useOrderFunction();
    db.products[0].stock_quantity = 1;
    // Another customer (another checkout id and phone) takes the last piece.
    whileOrderFunctionWaits(async () => {
      await call({ ...cod({ expected_total: listing().total }), checkout_ref: "another-checkout-0001", shipping_address: { ...address, phone: "9000000001" } });
    });
    const second = await call(cod({ expected_total: listing().total }));
    expect(second.status).toEqual(409);
    expect(second.body.code).toEqual("OUT_OF_STOCK");
    expect(db.orders.length).toEqual(1);
  });

  it("is not refused when the price or the order limit has changed since", async () => {
    reset();
    useOrderFunction();
    const first = await call(cod({ expected_total: listing().total }));
    db.gold_rates = [{ rate_22k: 9500, rate_24k: 10300, rate_18k: 7700, is_current: true }];
    const now = new Date().toISOString();
    db.orders.push(...[1, 2, 3].map((i) => ({ id: `other-${i}`, created_at: now, shipping_address: { phone: "9843010986" } })));

    const again = await call(cod({ expected_total: first.body.total_amount }));
    expect(again.status, JSON.stringify(again.body)).toEqual(200);
    expect(again.body.order_number).toEqual(first.body.order_number);
    expect(again.body.total_amount, "the price the order was saved at").toEqual(first.body.total_amount);
  });

  it("shows the order that was saved, not a cart changed afterwards", async () => {
    reset();
    useOrderFunction();
    const first = await call(cod());
    const changed = await call(cod({
      items: [{ product_id: P1, quantity: 3, selected_variations: {} }],
      shipping_address: { ...address, city: "Chennai", pincode: "600001" },
      expected_total: listing().total * 3,
    }));
    expect(changed.status, JSON.stringify(changed.body)).toEqual(200);
    expect(changed.body.order_number).toEqual(first.body.order_number);
    expect(changed.body.total_amount).toEqual(listing().total);
    expect(changed.body.item_count).toEqual(1);
    expect(changed.body.items[0].quantity).toEqual(1);
    expect(changed.body.shipping_address.city).toEqual("Coimbatore");
    expect(changed.body.notice).toContain("already placed");
    expect(db.orders.length).toEqual(1);
  });

  it("does not show an order to someone using its checkout id with another phone number", async () => {
    reset();
    useOrderFunction();
    await call(cod());
    const other = await call(cod({ shipping_address: { ...address, full_name: "Someone Else", phone: "9000000001" } }));
    expect(other.status).toEqual(409);
    expect(other.body.code).toEqual("CHECKOUT_REUSED");
    expect(JSON.stringify(other.body)).not.toContain("Big Bazaar");
    expect(db.orders.length).toEqual(1);
  });

  it("returns a paid UPI order again and tells the customer staff will be in touch", async () => {
    reset();
    useOrderFunction();
    const quote = await call({ mode: "quote", items, shipping_address: address, payment_method: "upi" });
    db.products[0].stock_quantity = 0; // sold out while the customer was paying
    const upi = { mode: "place", items, shipping_address: address, payment_method: "upi", payment: { utr: "432118765432" }, quote_token: quote.body.quote_token, checkout_ref: ref };
    const first = await call(upi);
    expect(first.status, JSON.stringify(first.body)).toEqual(200);
    expect(first.body.notice).toContain("no longer available");
    const again = await call(upi);
    expect(again.status).toEqual(200);
    expect(again.body.order_number).toEqual(first.body.order_number);
    expect(again.body.notice).toContain("We will contact you");
    expect(db.orders.length).toEqual(1);
  });

  it("keeps a UPI reference sent on a repeat of a cash-on-delivery checkout", async () => {
    reset();
    useOrderFunction();
    const first = await call(cod());
    expect(first.status, JSON.stringify(first.body)).toEqual(200);
    // The reply was lost; the customer switched to UPI, paid, and sent the reference.
    const paid = await call({ ...cod(), payment_method: "upi", payment: { utr: "432118765432" } });
    expect(paid.status, JSON.stringify(paid.body)).toEqual(200);
    expect(paid.body.order_number).toEqual(first.body.order_number);
    expect(paid.body.payment_method).toEqual("cod");
    expect(paid.body.notice).toContain("432118765432");
    expect(db.orders[0].staff_alert).toContain("UPI reference 432118765432");
    expect(db.orders[0].staff_alert).toContain("cash on delivery");
    // The same reference again changes nothing more.
    const alertAfterFirst = db.orders[0].staff_alert;
    await call({ ...cod(), payment_method: "upi", payment: { utr: "432118765432" } });
    expect(db.orders[0].staff_alert.split("432118765432").length).toEqual(alertAfterFirst.split("432118765432").length + 1);
    expect(db.orders.length).toEqual(1);
  });

  it("old storefront code: the same order number sent twice saves one order", async () => {
    reset();
    useOrderFunction();
    const legacy = { allowMissingUtr: true, requestedOrderNumber: "KRT26110042" };
    const body = { mode: "place", items, payment_method: "cod", checkout_ref: "legacy:KRT26110042", shipping_address: address };
    const first = await call(body, undefined, legacy);
    const again = await call(body, undefined, legacy);
    expect(first.status, JSON.stringify(first.body)).toEqual(200);
    expect(again.status).toEqual(200);
    expect(again.body.order_number).toEqual(first.body.order_number);
    expect(db.orders.length).toEqual(1);
    // Old order numbers are short, so a guessed one must not reveal an order.
    const guess = await call({ ...body, shipping_address: { ...address, phone: "9000000001" } }, undefined, legacy);
    expect(guess.body.code).toEqual("CHECKOUT_REUSED");
  });
});
