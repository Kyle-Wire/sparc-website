// Cloudflare Turnstile server-side verification.
// No-op when TURNSTILE_SECRET_KEY is unset (so dev / preview deploys work).
// Docs: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/

const ENDPOINT = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export interface TurnstileResult {
  ok: boolean;
  reason?: string;
}

export async function verifyTurnstile(token: unknown, ip?: string | null): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true };

  if (typeof token !== "string" || token.length === 0 || token.length > 4096) {
    return { ok: false, reason: "missing_token" };
  }

  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);

  try {
    const res = await fetch(ENDPOINT, { method: "POST", body });
    if (!res.ok) return { ok: false, reason: `http_${res.status}` };
    const json = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    if (json.success) return { ok: true };
    return { ok: false, reason: json["error-codes"]?.join(",") ?? "verify_failed" };
  } catch (err) {
    console.warn("[turnstile] verify error:", err);
    return { ok: false, reason: "network_error" };
  }
}

// Public site key for the client widget (safe to expose).
export function turnstileSiteKey(): string | undefined {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
}
