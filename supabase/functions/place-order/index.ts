// Prices and places storefront orders. See ../_shared/order.ts.
//
// POST { mode: "quote" | "place", items, shipping_address, payment_method,
//        payment: { utr, upi_phone, upi_provider }, notes, expected_total,
//        quote_token, checkout_ref, turnstile_token }
// POST { mode: "config" } returns { turnstile_site_key } for the checkout page.
//
// Secrets: TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY switch on the
// Cloudflare Turnstile check (see ../_shared/turnstile.ts); ORDER_QUOTE_SECRET
// is optional.
import { corsHeadersFor, jsonResponse } from "../_shared/cors.ts";
import { handleOrderRequest, type OrderRequest } from "../_shared/order.ts";

Deno.serve(async (req: Request) => {
  const cors = corsHeadersFor(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405, cors);

  let body: OrderRequest;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid request", code: "BAD_REQUEST" }, 400, cors);
  }
  return handleOrderRequest(req, body, cors);
});
