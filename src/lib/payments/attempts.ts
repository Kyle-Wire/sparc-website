/**
 * A per-account limit on unfinished checkouts (blind spot P2, card testing).
 *
 * Saving a card without charging it is what card testers look for: each order
 * opens a Stripe page that checks a card and charges nothing. checkRateLimit()
 * in src/lib/rate-limit.ts is a no-op unless Upstash is installed and
 * configured, and today it is neither (no @upstash packages in package.json),
 * so it does not protect the order route. This limit uses our own table and
 * needs nothing else: an account that has started ATTEMPT_LIMIT orders in the
 * last day without saving a card (awaiting_card or abandoned) cannot start
 * another until a day has passed. A real buyer finishes the card step on the
 * first or second try; four unfinished in a day is not a buyer.
 *
 * Server only (service role). A count that fails is read as "not over the
 * limit" and logged, so a database hiccup does not stop a real buyer; Stripe
 * Radar (business/20-radar-rules.md) is the second line.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export const ATTEMPT_LIMIT = 4;
export const ATTEMPT_WINDOW_MS = 24 * 60 * 60 * 1000;
export const UNFINISHED_STATUSES = ["awaiting_card", "abandoned"] as const;

export async function tooManyAttempts(admin: SupabaseClient, userId: string, now: Date = new Date()): Promise<boolean> {
  const { count, error } = await admin
    .from("report_orders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("status", [...UNFINISHED_STATUSES])
    .gte("created_at", new Date(now.getTime() - ATTEMPT_WINDOW_MS).toISOString());
  if (error || count === null) {
    console.error("[attempts] count failed:", error);
    return false;
  }
  return count >= ATTEMPT_LIMIT;
}
