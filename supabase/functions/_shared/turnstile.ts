// Cloudflare Turnstile: a check, usually invisible, that the person placing an
// order is not a script. It is on only when both secrets are set:
//
//   TURNSTILE_SITE_KEY    the widget's site key (public; sent to the checkout page)
//   TURNSTILE_SECRET_KEY  the widget's secret key (used here only)
//
// With one or neither set, orders are not checked, so the storefront works
// before the keys exist. Unset TURNSTILE_SECRET_KEY to switch it off again.

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
// Tokens are at most 2048 characters (Cloudflare's limit).
const MAX_TOKEN_LENGTH = 2048;
const VERIFY_TIMEOUT_MS = 8000;
// The checkout page renders the widget with this action.
export const TURNSTILE_ACTION = "checkout";

export interface TurnstileConfig {
  siteKey: string;
  secret: string;
}

export function turnstileConfig(): TurnstileConfig | null {
  const siteKey = (Deno.env.get("TURNSTILE_SITE_KEY") || "").trim();
  const secret = (Deno.env.get("TURNSTILE_SECRET_KEY") || "").trim();
  if (siteKey && secret) return { siteKey, secret };
  if (siteKey || secret) {
    console.warn("Turnstile is off: set both TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY to turn it on.");
  }
  return null;
}

export type TurnstileResult =
  // `unchecked` explains why the token could not be checked (Cloudflare did
  // not answer, or the secret key is wrong). The order goes ahead with a note
  // for staff: a problem on our side or Cloudflare's should not stop real
  // customers from ordering.
  | { ok: true; unchecked?: string }
  | { ok: false; reason: "missing" | "failed" };

export async function verifyTurnstile(config: TurnstileConfig, token: unknown): Promise<TurnstileResult> {
  if (typeof token !== "string" || token === "" || token.length > MAX_TOKEN_LENGTH) {
    return { ok: false, reason: "missing" };
  }

  let data: { success?: boolean; action?: string; "error-codes"?: string[] } | null = null;
  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: config.secret, response: token }),
      signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error(`Turnstile check failed: Cloudflare answered ${res.status}`);
      return { ok: true, unchecked: `Cloudflare answered ${res.status}` };
    }
    data = await res.json();
  } catch (error) {
    console.error("Turnstile check failed:", error instanceof Error ? error.message : error);
    return { ok: true, unchecked: "Cloudflare could not be reached" };
  }

  if (data?.success === true) {
    // A token made for another form on this site does not count.
    if (data.action && data.action !== TURNSTILE_ACTION) return { ok: false, reason: "failed" };
    return { ok: true };
  }

  const codes = Array.isArray(data?.["error-codes"]) ? data!["error-codes"]! : [];
  const ourSide = codes.filter((c) => c === "missing-input-secret" || c === "invalid-input-secret" || c === "internal-error");
  if (ourSide.length > 0) {
    console.error("Turnstile check could not run:", codes.join(", "));
    return { ok: true, unchecked: ourSide.includes("internal-error") ? "Cloudflare had an internal error" : "the Turnstile secret key is wrong" };
  }
  return { ok: false, reason: "failed" };
}
