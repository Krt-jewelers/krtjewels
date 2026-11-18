// CORS for edge functions called from the storefront. Only the site's own
// origins get a matching Access-Control-Allow-Origin; other sites' pages
// cannot read the responses. Add origins with the ALLOWED_ORIGINS secret
// (comma-separated) without a code change.

const DEFAULT_ORIGINS = [
  "https://www.krtjewellers.com",
  "https://krtjewellers.com",
  "https://www.krtjewels.com",
  "https://krtjewels.com",
  "https://krtgold.lovable.app",
  "http://localhost:8080",
  "http://localhost:5173",
];

// Lovable preview and editor hosts.
const ALLOWED_PATTERNS = [
  /^https:\/\/[a-z0-9-]+\.lovable\.app$/,
  /^https:\/\/[a-z0-9-]+\.lovableproject\.com$/,
];

function allowedOrigins(): string[] {
  const extra = (Deno.env.get("ALLOWED_ORIGINS") || "")
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean);
  return [...DEFAULT_ORIGINS, ...extra];
}

export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return allowedOrigins().includes(origin) || ALLOWED_PATTERNS.some((re) => re.test(origin));
}

export function corsHeadersFor(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin");
  return {
    "Access-Control-Allow-Origin": isAllowedOrigin(origin) ? (origin as string) : DEFAULT_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

export function jsonResponse(body: unknown, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
