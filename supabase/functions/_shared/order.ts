// Order placement shared by the place-order and create-guest-order functions.
//
// The browser sends only what was chosen (products, options, quantities,
// address, payment details). Prices, GST and totals are worked out here from
// the database with the same pricing module the storefront uses, and the order
// is saved by one database function so stock, order and items change together.
// Orders always start as "pending"; staff confirm them after checking payment.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// The client is created without generated database types.
// deno-lint-ignore no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;
import {
  INDIAN_STATES,
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
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

export function validateAddress(input: Record<string, unknown> | undefined) {
  const a = input || {};
  const fullName = text(a.full_name, 100);
  const phone = normalizePhone(a.phone);
  const line1 = text(a.address_line1, 200);
  const line2 = text(a.address_line2, 200);
  const city = text(a.city, 80);
  const stateInput = text(a.state, 80).toLowerCase();
  const state = INDIAN_STATES.find((s) => s.toLowerCase() === stateInput) || null;
  const pincode = String(a.pincode ?? "").replace(/\s/g, "");

  const problems: string[] = [];
  if (fullName.length < 2) problems.push("full name");
  if (!phone) problems.push("a 10-digit mobile number");
  if (line1.length < 3) problems.push("address line 1");
  if (city.length < 2) problems.push("city");
  if (!state) problems.push("state");
  if (!/^[1-9]\d{5}$/.test(pincode)) problems.push("a 6-digit pincode");
  if (problems.length) {
    throw new OrderError("INVALID_ADDRESS", `Please check: ${problems.join(", ")}.`, 400, { fields: problems });
  }

  return {
    full_name: fullName,
    phone: phone as string,
    address_line1: line1,
    address_line2: line2,
    city,
    state: state as string,
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

export async function priceOrder(admin: SupabaseClient, rawItems: unknown): Promise<PricedOrder> {
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

function checkExpectedTotal(priced: PricedOrder, expected: unknown) {
  if (typeof expected !== "number" || !Number.isFinite(expected)) return;
  if (Math.abs(expected - priced.totals.total) > TOTAL_TOLERANCE) {
    throw new OrderError(
      "PRICE_CHANGED",
      "Prices have been updated (the gold rate may have changed). Please review your order total.",
      409,
      { totals: priced.totals },
    );
  }
}

function validatePayment(body: OrderRequest) {
  const method = body.payment_method === "upi" ? "upi" : body.payment_method === "cod" ? "cod" : null;
  if (!method) throw new OrderError("INVALID_PAYMENT", "Choose a payment method.");
  if (method === "cod") return { method, utr: null, upiPhone: null, upiProvider: null };

  const utr = text(body.payment?.utr, 40).replace(/\s/g, "");
  if (!/^[A-Za-z0-9]{6,35}$/.test(utr)) {
    throw new OrderError("INVALID_UTR", "Enter the UTR / transaction reference from your UPI app.");
  }
  const upiPhone = body.payment?.upi_phone ? normalizePhone(body.payment.upi_phone) : null;
  const upiProvider = text(body.payment?.upi_provider, 40) || null;
  return { method, utr, upiPhone, upiProvider };
}

async function checkRecentOrders(admin: SupabaseClient, phone: string) {
  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { count, error } = await admin
    .from("orders")
    .select("id", { count: "exact", head: true })
    .gte("created_at", since)
    .eq("shipping_address->>phone", phone);
  if (error) throw error;
  if ((count || 0) >= 3) {
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

export async function handleOrderRequest(
  req: Request,
  body: OrderRequest,
  cors: Record<string, string>,
): Promise<Response> {
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const priced = await priceOrder(admin, body.items);
    checkExpectedTotal(priced, body.expected_total);

    const summary = {
      subtotal: priced.totals.subtotal,
      gst_amount: priced.totals.gst,
      total_amount: priced.totals.total,
      gst_rate: priced.gstRate,
      item_count: priced.totals.itemCount,
    };

    if (body.mode === "quote") {
      return jsonResponse({ quote: summary }, 200, cors);
    }

    const address = validateAddress(body.shipping_address);
    const payment = validatePayment(body);
    const notes = text(body.notes, 500) || null;
    await checkRecentOrders(admin, address.phone);
    const userId = await userIdFromRequest(req);

    const orderRow = {
      user_id: userId,
      subtotal: priced.totals.subtotal,
      gst_amount: priced.totals.gst,
      total_amount: priced.totals.total,
      gold_rate_at_order: priced.goldRate22k,
      shipping_address: address,
      payment_method: payment.method,
      payment_utr: payment.utr,
      upi_phone: payment.upiPhone,
      upi_provider: payment.upiProvider,
      notes,
    };

    const itemRows = priced.lines.map(({ product, line }) => ({
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

    const { data, error } = await admin.rpc("create_order_with_items", { p_order: orderRow, p_items: itemRows });
    if (error) {
      const mapped = mapDatabaseError(error);
      if (mapped) throw mapped;
      throw error;
    }

    const created = data as { id: string; order_number: string; created_at: string };
    return jsonResponse(
      {
        success: true,
        order_id: created.id,
        order_number: created.order_number,
        created_at: created.created_at,
        status: "pending",
        payment_method: payment.method,
        ...summary,
        shipping_address: address,
        items: itemRows.map((i) => ({
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
  } catch (error) {
    if (error instanceof OrderError) {
      return jsonResponse({ error: error.message, code: error.code, ...(error.details || {}) }, error.status, cors);
    }
    console.error("Order request failed:", error);
    return jsonResponse(
      { error: "We could not place your order. Please try again or call us.", code: "SERVER_ERROR" },
      500,
      cors,
    );
  }
}
