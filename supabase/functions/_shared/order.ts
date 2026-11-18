// Order placement shared by the place-order and create-guest-order functions.
//
// The browser sends only what was chosen (products, options, quantities,
// address, payment details). Prices, GST and totals are worked out here from
// the database with the same pricing module the storefront uses, and the order
// is saved by one database function so stock, order and items change together.
// Orders always start as "pending"; staff confirm them after checking payment.
//
// UPI is paid before the order exists (the customer scans a QR code, pays, then
// sends the reference). So that a paid order is never turned away:
//   * the quote that precedes the QR code checks the address, stock and order
//     limit, and returns a signed token holding the priced order;
//   * an order placed with that token is saved at the quoted price, even if
//     the gold rate has changed or the last piece has just been sold;
//   * a UPI order without a valid token is still saved, at the current price,
//     with a note telling staff what the customer was shown.
// Cash-on-delivery orders are simply refused when the price or stock changed,
// because the customer can look at the new total and try again.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// The client is created without generated database types.
// deno-lint-ignore no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;
import {
  matchIndianState,
  priceCartLine,
  sumLines,
  type PricedLine,
  type PricingMetalType,
  type PricingProduct,
  type PricingVariation,
} from "./pricing.ts";
import { jsonResponse } from "./cors.ts";

const MAX_LINES = 30;
const MAX_QUANTITY = 20;
// Allowed gap between the total the customer saw and the server total (rupees).
const TOTAL_TOLERANCE = 1;
// Orders one phone number may place in 15 minutes.
const RECENT_ORDER_LIMIT = 3;
// How long a quoted price is honoured for a UPI payment.
const QUOTE_TTL_MS = 20 * 60 * 1000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CHECKOUT_REF_RE = /^[A-Za-z0-9:_-]{8,80}$/;
const STORE_PHONE = "+91 98430 10986";

export interface OrderRequestItem {
  product_id: string;
  quantity: number;
  selected_variations?: unknown;
}

export interface OrderRequest {
  mode?: "quote" | "place";
  items: OrderRequestItem[];
  shipping_address?: Record<string, unknown>;
  payment_method?: string;
  payment?: { utr?: string; upi_phone?: string; upi_provider?: string };
  notes?: string | null;
  expected_total?: number | null;
  // From a quote response; lets a UPI order keep the quoted price.
  quote_token?: string | null;
  // One id per checkout attempt; a repeat returns the order already saved.
  checkout_ref?: string | null;
}

// Set only by create-guest-order, for browsers still running old storefront code.
export interface LegacyOptions {
  // The old code did not send the UPI reference for guests.
  allowMissingUtr: boolean;
  // The old code shows its own order number to the customer.
  requestedOrderNumber: string | null;
}

export class OrderError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
    public details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

interface ProductRow extends PricingProduct {
  id: string;
  name: string;
  images: string[] | null;
  is_active: boolean | null;
  stock_quantity: number | null;
}

const text = (value: unknown, max: number): string =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

export function normalizePhone(value: unknown): string | null {
  const digits = String(value ?? "").replace(/\D/g, "");
  const local = digits.length === 12 && digits.startsWith("91")
    ? digits.slice(2)
    : digits.length === 11 && digits.startsWith("0")
    ? digits.slice(1)
    : digits;
  return /^[6-9]\d{9}$/.test(local) ? local : null;
}

// `lenient` is for old storefront code, which let customers type anything: an
// order that may already be paid is kept with the address as it was given.
export function validateAddress(input: Record<string, unknown> | undefined, lenient = false) {
  const a = input || {};
  const fullName = text(a.full_name, 100);
  const rawPhone = text(String(a.phone ?? ""), 20);
  const phone = normalizePhone(rawPhone);
  const line1 = text(a.address_line1, 200);
  const line2 = text(a.address_line2, 200);
  const city = text(a.city, 80);
  const rawState = text(a.state, 80);
  const state = matchIndianState(rawState);
  const pincode = String(a.pincode ?? "").replace(/\s/g, "").slice(0, 10);

  const problems: string[] = [];
  if (lenient) {
    if (!fullName) problems.push("full name");
    if (rawPhone.replace(/\D/g, "").length < 10) problems.push("a 10-digit mobile number");
    if (!line1) problems.push("address line 1");
    if (!city) problems.push("city");
    if (!pincode) problems.push("pincode");
  } else {
    if (fullName.length < 2) problems.push("full name");
    if (!phone) problems.push("a 10-digit mobile number");
    if (line1.length < 3) problems.push("address line 1");
    if (city.length < 2) problems.push("city");
    if (!state) problems.push("state");
    if (!/^[1-9]\d{5}$/.test(pincode)) problems.push("a 6-digit pincode");
  }
  if (problems.length) {
    throw new OrderError("INVALID_ADDRESS", `Please check: ${problems.join(", ")}.`, 400, { fields: problems });
  }

  return {
    full_name: fullName,
    phone: phone || rawPhone,
    address_line1: line1,
    address_line2: line2,
    city,
    state: state || rawState,
    pincode,
  };
}

function validateItems(items: unknown): OrderRequestItem[] {
  if (!Array.isArray(items) || items.length === 0) {
    throw new OrderError("EMPTY_CART", "Your cart is empty.");
  }
  if (items.length > MAX_LINES) {
    throw new OrderError("TOO_MANY_ITEMS", `An order can have at most ${MAX_LINES} lines.`);
  }
  return items.map((raw) => {
    const item = (raw || {}) as Record<string, unknown>;
    const productId = String(item.product_id ?? "");
    const quantity = Number(item.quantity);
    if (!UUID_RE.test(productId)) throw new OrderError("INVALID_ITEM", "An item in your cart is not valid.");
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      throw new OrderError("INVALID_QUANTITY", `Quantity must be between 1 and ${MAX_QUANTITY}.`);
    }
    return { product_id: productId, quantity, selected_variations: item.selected_variations ?? {} };
  });
}

async function userIdFromRequest(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  // The anon key is also a bearer token; it has no user, so that is a guest.
  const { data, error } = await client.auth.getUser(authHeader.slice(7));
  if (error || !data?.user) return null;
  return data.user.id;
}

async function loadPricingData(admin: SupabaseClient, productIds: string[]) {
  const [productsRes, variationsRes, metalTypesRes, goldRateRes, gstRes] = await Promise.all([
    admin
      .from("products")
      .select("id, name, slug, images, category, metal_type, metal_type_id, weight_grams, making_charge_percent, diamond_cost, stone_cost, specifications, is_active, stock_quantity")
      .in("id", productIds),
    admin.from("product_variations").select("*").in("product_id", productIds),
    admin.from("metal_types").select("id, slug, name, rate_per_gram").eq("is_active", true),
    admin
      .from("gold_rates")
      .select("rate_22k, rate_24k, rate_18k")
      .eq("is_current", true)
      .order("effective_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin.from("site_settings").select("value").eq("key", "gst_rate_percent").maybeSingle(),
  ]);

  for (const res of [productsRes, variationsRes, metalTypesRes, goldRateRes]) {
    if (res.error) throw res.error;
  }

  const gstValue = (gstRes.data?.value || {}) as { rate?: number };
  return {
    products: (productsRes.data || []) as ProductRow[],
    variations: (variationsRes.data || []) as PricingVariation[],
    metalTypes: (metalTypesRes.data || []) as PricingMetalType[],
    goldRate: goldRateRes.data as { rate_22k: number; rate_24k: number; rate_18k: number | null } | null,
    gstRate: typeof gstValue.rate === "number" ? gstValue.rate : 3,
  };
}

export interface PricedOrder {
  lines: { item: OrderRequestItem; product: ProductRow; line: PricedLine }[];
  totals: { subtotal: number; gst: number; total: number; itemCount: number };
  goldRate22k: number;
  gstRate: number;
}

export async function priceOrder(
  admin: SupabaseClient,
  rawItems: unknown,
  options: { enforceStock: boolean } = { enforceStock: true },
): Promise<PricedOrder> {
  const items = validateItems(rawItems);
  const productIds = Array.from(new Set(items.map((i) => i.product_id)));
  const data = await loadPricingData(admin, productIds);

  if (!data.goldRate) {
    throw new OrderError("RATE_UNAVAILABLE", "Today's gold rate is not available yet. Please try again shortly.", 503);
  }

  const productMap = new Map(data.products.map((p) => [p.id, p]));
  const lines = items.map((item) => {
    const product = productMap.get(item.product_id);
    if (!product || !product.is_active) {
      throw new OrderError("PRODUCT_UNAVAILABLE", "An item in your cart is no longer available.", 409, {
        product_id: item.product_id,
      });
    }
    const line = priceCartLine({
      product,
      variations: data.variations.filter((v) => v.product_id === product.id),
      metalTypes: data.metalTypes,
      goldRate: data.goldRate,
      gstRate: data.gstRate,
      selection: item.selected_variations,
      quantity: item.quantity,
    });
    if (line.error) {
      throw new OrderError(
        "ITEM_OPTIONS_CHANGED",
        `The options for "${product.name}" have changed. Please remove it from your cart and add it again.`,
        409,
        { product_id: product.id, reason: line.error },
      );
    }
    return { item, product, line };
  });

  // Friendly stock message before the database re-checks it under a lock.
  const wanted = new Map<string, number>();
  for (const { item } of lines) wanted.set(item.product_id, (wanted.get(item.product_id) || 0) + item.quantity);
  for (const [productId, qty] of wanted) {
    if (!options.enforceStock) break;
    const product = productMap.get(productId)!;
    if (product.stock_quantity !== null && product.stock_quantity < qty) {
      throw new OrderError(
        "OUT_OF_STOCK",
        product.stock_quantity > 0
          ? `Only ${product.stock_quantity} of "${product.name}" left in stock.`
          : `"${product.name}" is out of stock.`,
        409,
        { product_id: productId, available: product.stock_quantity },
      );
    }
  }

  return {
    lines,
    totals: sumLines(lines.map((l) => l.line)),
    goldRate22k: Number(data.goldRate.rate_22k) || 0,
    gstRate: data.gstRate,
  };
}

// ---------------------------------------------------------------------------
// Order rows and signed quotes
// ---------------------------------------------------------------------------

interface ItemRow {
  product_id: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  weight_grams: number;
  gold_rate_applied: number;
  making_charges: number;
  diamond_cost: number;
  stone_cost: number;
  unit_price: number;
  total_price: number;
  selected_variations: Record<string, unknown>;
  variation_price_adjustment: number;
  variation_weight_adjustment: number;
}

interface OrderSums {
  subtotal: number;
  gst_amount: number;
  total_amount: number;
  gold_rate_at_order: number;
  gst_rate: number;
  item_count: number;
}

interface QuotePayload {
  v: 1;
  exp: number;
  order: OrderSums;
  rows: ItemRow[];
}

function toItemRows(priced: PricedOrder): ItemRow[] {
  return priced.lines.map(({ product, line }) => ({
    product_id: product.id,
    product_name: product.name,
    product_image: product.images?.[0] || null,
    quantity: line.quantity,
    weight_grams: Math.round(line.weightGrams * 1000) / 1000,
    gold_rate_applied: line.goldRateApplied,
    making_charges: line.makingCharges,
    diamond_cost: line.diamondCost,
    stone_cost: line.stoneCost,
    // unit_price and total_price include GST, as the storefront shows them.
    unit_price: line.unitTotal,
    total_price: line.lineTotal,
    selected_variations: line.selectedVariations,
    variation_price_adjustment: line.variationPriceAdjustment,
    variation_weight_adjustment: Math.round(line.variationWeightAdjustment * 1000) / 1000,
  }));
}

function toOrderSums(priced: PricedOrder): OrderSums {
  return {
    subtotal: priced.totals.subtotal,
    gst_amount: priced.totals.gst,
    total_amount: priced.totals.total,
    gold_rate_at_order: priced.goldRate22k,
    gst_rate: priced.gstRate,
    item_count: priced.totals.itemCount,
  };
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// Quotes are signed with a key only the server has, so a browser cannot write
// its own prices into one. ORDER_QUOTE_SECRET is optional; without it the key
// is derived from the service role key.
function quoteKey(): Promise<CryptoKey> {
  const secret = Deno.env.get("ORDER_QUOTE_SECRET") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!secret) throw new Error("No secret available to sign quotes");
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(`krt-order-quote-v1:${secret}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signQuote(payload: QuotePayload): Promise<string> {
  const body = new TextEncoder().encode(JSON.stringify(payload));
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", await quoteKey(), body));
  return `${toBase64Url(body)}.${toBase64Url(signature)}`;
}

// Returns the quote when the token is genuine and still valid, otherwise null.
export async function verifyQuote(token: unknown, now = Date.now()): Promise<QuotePayload | null> {
  if (typeof token !== "string" || token.length > 200_000) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  try {
    const body = fromBase64Url(parts[0]);
    const signature = fromBase64Url(parts[1]);
    const genuine = await crypto.subtle.verify("HMAC", await quoteKey(), signature, body);
    if (!genuine) return null;
    const payload = JSON.parse(new TextDecoder().decode(body)) as QuotePayload;
    if (payload?.v !== 1 || typeof payload.exp !== "number" || payload.exp < now) return null;
    if (!Array.isArray(payload.rows) || payload.rows.length === 0 || !payload.order) return null;
    return payload;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

const rupees = (amount: number) => `₹${new Intl.NumberFormat("en-IN").format(Math.round(amount))}`;

function totalDiffers(expected: unknown, actual: number): expected is number {
  return typeof expected === "number" && Number.isFinite(expected) && Math.abs(expected - actual) > TOTAL_TOLERANCE;
}

function priceChanged(sums: OrderSums): OrderError {
  return new OrderError(
    "PRICE_CHANGED",
    "Prices have been updated (the gold rate may have changed). Please review your order total.",
    409,
    { totals: { subtotal: sums.subtotal, gst: sums.gst_amount, total: sums.total_amount } },
  );
}

function validatePayment(body: OrderRequest, legacy?: LegacyOptions) {
  const method = body.payment_method === "upi" ? "upi" : body.payment_method === "cod" ? "cod" : null;
  if (!method) throw new OrderError("INVALID_PAYMENT", "Choose a payment method.");
  if (method === "cod") return { method, utr: null, upiPhone: null, upiProvider: null };

  const utr = text(body.payment?.utr, 40).replace(/\s/g, "");
  if (!/^[A-Za-z0-9]{6,35}$/.test(utr)) {
    if (legacy?.allowMissingUtr && utr === "") return { method, utr: null, upiPhone: null, upiProvider: null };
    throw new OrderError("INVALID_UTR", "Enter the UTR / transaction reference from your UPI app.");
  }
  const upiPhone = body.payment?.upi_phone ? normalizePhone(body.payment.upi_phone) : null;
  const upiProvider = text(body.payment?.upi_provider, 40) || null;
  return { method, utr, upiPhone, upiProvider };
}

async function checkRecentOrders(admin: SupabaseClient, phone: string, limit: number) {
  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { count, error } = await admin
    .from("orders")
    .select("id", { count: "exact", head: true })
    .gte("created_at", since)
    .eq("shipping_address->>phone", phone);
  if (error) throw error;
  if ((count || 0) >= limit) {
    throw new OrderError(
      "TOO_MANY_ORDERS",
      "Several orders were just placed with this phone number. Please wait a few minutes or call us.",
      429,
    );
  }
}

function mapDatabaseError(error: { message?: string }): OrderError | null {
  const message = error?.message || "";
  if (message.includes("OUT_OF_STOCK")) {
    return new OrderError("OUT_OF_STOCK", "An item in your cart just sold out. Please review your cart.", 409);
  }
  if (message.includes("PRODUCT_UNAVAILABLE")) {
    return new OrderError("PRODUCT_UNAVAILABLE", "An item in your cart is no longer available.", 409);
  }
  return null;
}

// A UPI customer has usually paid already when their order reaches us. If it
// still cannot be saved, tell them exactly what to do with their payment.
function afterPayment(error: OrderError): OrderError {
  if (error.code === "INVALID_UTR" || error.code === "INVALID_ADDRESS" || error.code === "INVALID_PAYMENT") return error;
  return new OrderError(
    error.code,
    `${error.message} If you have already paid, your money is safe: call or WhatsApp us on ${STORE_PHONE} with your UPI reference and we will complete the order or refund you.`,
    error.status,
    error.details,
  );
}

// ---------------------------------------------------------------------------
// Request handling
// ---------------------------------------------------------------------------

async function handleQuote(admin: SupabaseClient, body: OrderRequest, cors: Record<string, string>) {
  const priced = await priceOrder(admin, body.items);
  const sums = toOrderSums(priced);
  if (totalDiffers(body.expected_total, sums.total_amount)) throw priceChanged(sums);

  // Before a QR code is shown, check everything else that could stop the order.
  if (body.shipping_address) {
    const address = validateAddress(body.shipping_address);
    await checkRecentOrders(admin, address.phone, RECENT_ORDER_LIMIT);
  }

  const expiresAt = Date.now() + QUOTE_TTL_MS;
  const quoteToken = await signQuote({ v: 1, exp: expiresAt, order: sums, rows: toItemRows(priced) });
  return jsonResponse(
    { quote: sums, quote_token: quoteToken, expires_at: new Date(expiresAt).toISOString() },
    200,
    cors,
  );
}

async function handlePlace(
  req: Request,
  admin: SupabaseClient,
  body: OrderRequest,
  cors: Record<string, string>,
  legacy?: LegacyOptions,
) {
  const address = validateAddress(body.shipping_address, !!legacy);
  const payment = validatePayment(body, legacy);
  const isUpi = payment.method === "upi";
  const notes = text(body.notes, 500) || null;

  let sums: OrderSums;
  let rows: ItemRow[];
  let staffAlert: string | null = null;
  let notice: string | null = null;
  let orderLimit = RECENT_ORDER_LIMIT;

  const quoted = isUpi ? await verifyQuote(body.quote_token) : null;
  if (quoted) {
    // The customer was shown this total with the QR code and has paid it.
    sums = quoted.order;
    rows = quoted.rows;
    // The quote already counted against the limit; leave room for it.
    orderLimit += 2;
  } else {
    const priced = await priceOrder(admin, body.items, { enforceStock: !isUpi });
    sums = toOrderSums(priced);
    rows = toItemRows(priced);
    if (totalDiffers(body.expected_total, sums.total_amount)) {
      if (!isUpi) throw priceChanged(sums);
      staffAlert = `Price changed while the customer was paying: they were shown ${rupees(body.expected_total)}; ` +
        `the order is saved at ${rupees(sums.total_amount)}. Check the amount received.`;
      notice = `The price changed while you were paying. Your order is saved at today's price of ` +
        `${rupees(sums.total_amount)}; you were shown ${rupees(body.expected_total)}. We will contact you about the difference.`;
    }
  }

  await checkRecentOrders(admin, address.phone, orderLimit);
  const userId = await userIdFromRequest(req);

  const clientRef = typeof body.checkout_ref === "string" && CHECKOUT_REF_RE.test(body.checkout_ref)
    ? body.checkout_ref
    : null;

  const orderRow = {
    user_id: userId,
    subtotal: sums.subtotal,
    gst_amount: sums.gst_amount,
    total_amount: sums.total_amount,
    gold_rate_at_order: sums.gold_rate_at_order,
    shipping_address: address,
    payment_method: payment.method,
    payment_utr: payment.utr,
    upi_phone: payment.upiPhone,
    upi_provider: payment.upiProvider,
    notes,
    staff_alert: staffAlert,
    checkout_ref: clientRef,
    // A paid order is recorded even when stock has just run out.
    allow_backorder: isUpi,
    requested_order_number: legacy?.requestedOrderNumber || null,
  };

  const { data, error } = await admin.rpc("create_order_with_items", { p_order: orderRow, p_items: rows });
  if (error) {
    const mapped = mapDatabaseError(error);
    if (mapped) throw mapped;
    throw error;
  }

  const created = data as { id: string; order_number: string; created_at: string; existing?: boolean; short?: string[] };
  if (created.short && created.short.length > 0) {
    notice = [
      notice,
      `Some items were no longer available when your payment reached us (${created.short.join(", ")}). ` +
        `We will call you to arrange a replacement or a refund.`,
    ].filter(Boolean).join(" ");
  }

  return jsonResponse(
    {
      success: true,
      order_id: created.id,
      order_number: created.order_number,
      created_at: created.created_at,
      status: "pending",
      payment_method: payment.method,
      ...sums,
      notice,
      shipping_address: address,
      items: rows.map((i) => ({
        product_name: i.product_name,
        product_image: i.product_image,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total_price: i.total_price,
        selected_variations: i.selected_variations,
      })),
    },
    200,
    cors,
  );
}

export async function handleOrderRequest(
  req: Request,
  body: OrderRequest,
  cors: Record<string, string>,
  legacy?: LegacyOptions,
): Promise<Response> {
  const paidFirst = body.mode !== "quote" && body.payment_method === "upi";
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    if (body.mode === "quote") return await handleQuote(admin, body, cors);
    return await handlePlace(req, admin, body, cors, legacy);
  } catch (caught) {
    let error = caught;
    if (!(error instanceof OrderError)) {
      console.error("Order request failed:", error);
      error = new OrderError("SERVER_ERROR", "We could not place your order. Please try again or call us.", 500);
    }
    const orderError = paidFirst ? afterPayment(error as OrderError) : (error as OrderError);
    return jsonResponse(
      { error: orderError.message, code: orderError.code, ...(orderError.details || {}) },
      orderError.status,
      cors,
    );
  }
}
