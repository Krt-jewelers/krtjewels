// CORS for edge functions called from the storefront.
const DEFAULT_ORIGINS = [
  "https://www.krtjewellers.com",
  "https://krtjewellers.com",
  "http://localhost:8080",
  "http://localhost:5173",
];

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  const extraOrigins = (Deno.env.get("ALLOWED_ORIGINS") || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  const allowedOrigins = [...DEFAULT_ORIGINS, ...extraOrigins];
  const isAllowed = allowedOrigins.includes(origin) || 
    origin.endsWith(".lovable.app") || 
    origin.endsWith(".vercel.app");

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : DEFAULT_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  };
}
