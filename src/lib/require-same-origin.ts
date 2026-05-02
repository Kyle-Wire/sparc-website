// Defense-in-depth CSRF guard. SameSite=Lax cookies already block most cross-origin
// state-changing requests, but explicitly verifying Origin/Referer hardens against
// edge cases (older browsers, certain top-level navigations).
import type { NextRequest } from "next/server";

export function isSameOrigin(req: NextRequest): boolean {
  const host = req.headers.get("host");
  if (!host) return false;

  const origin = req.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }

  // Fall back to Referer when Origin is absent (some same-origin form posts).
  const referer = req.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).host === host;
    } catch {
      return false;
    }
  }

  // No Origin and no Referer on a state-changing request → reject.
  return false;
}
