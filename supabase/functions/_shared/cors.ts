// CORS for edge functions called from the storefront. Only the site's own
// origins get a matching Access-Control-Allow-Origin; other sites' pages
// cannot read the responses. Add origins with the ALLOWED_ORIGINS secret
// (comma-separated) without a code change.

const DEFAULT_ORIGINS = [
  "https://www.krtjewellers.com",
  "https://krtjewellers.com",
  "https://krtgold.lovable.app",
  "http://localhost:8080",
  "http://localhost:5173",
];

// Preview builds of this project: the Lovable preview and editor, and Vercel
// previews of pull requests (only this project's Vercel team can publish
// under that name). Browsers do not send cookies to these functions, so this
// list is tidiness, not the security boundary: the functions check who is
// calling themselves.
const ALLOWED_PATTERNS = [
  /^https:\/\/preview--krtgold\.lovable\.app$/,
  /^https:\/\/id-preview--[0-9a-f-]{36}\.lovable\.app$/,
  /^https:\/\/[0-9a-f-]{36}\.lovableproject\.com$/,
  /^https:\/\/krtjewelleryap[a-z0-9-]*-foundifinnovations-gmailcoms-projects\.vercel\.app$/,
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
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    Vary: "Origin",
  };
}

export function jsonResponse(body: unknown, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
