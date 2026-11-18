// Kept for browsers still running the old storefront code. It used to save
// whatever prices and status the browser sent; it now goes through the same
// server-side pricing as place-order and ignores the browser's totals and
// status. New code calls place-order directly.
import { corsHeadersFor, jsonResponse } from "../_shared/cors.ts";
import { handleOrderRequest } from "../_shared/order.ts";

Deno.serve(async (req: Request) => {
  const cors = corsHeadersFor(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405, cors);

  let legacy: Record<string, unknown>;
  try {
    legacy = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid request", code: "BAD_REQUEST" }, 400, cors);
  }

  const items = Array.isArray(legacy.items)
    ? (legacy.items as Record<string, unknown>[]).map((item) => ({
        product_id: String(item.product_id ?? ""),
        quantity: Number(item.quantity),
        selected_variations: item.selected_variations ?? {},
      }))
    : [];

  return handleOrderRequest(
    req,
    {
      mode: "place",
      items,
      shipping_address: (legacy.shipping_address || {}) as Record<string, unknown>,
      payment_method: typeof legacy.payment_method === "string" ? legacy.payment_method : "cod",
      payment: { utr: typeof legacy.payment_utr === "string" ? legacy.payment_utr : undefined },
      notes: typeof legacy.notes === "string" ? legacy.notes : null,
      expected_total: typeof legacy.total_amount === "number" ? legacy.total_amount : null,
    },
    cors,
  );
});
