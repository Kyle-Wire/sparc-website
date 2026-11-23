/**
 * Whether we can take another order this week (ORDERS_WEEKLY_CAP). Server
 * only: it counts orders with the service role. A count that fails is read
 * as "not full", so a database hiccup never hides the form; the cap is a
 * courtesy to buyers, not a security control.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { CAP_STATUSES, weeklyCap } from "./catalog";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export async function atCapacity(admin: SupabaseClient, env: Record<string, string | undefined> = process.env, now: Date = new Date()): Promise<boolean> {
  const cap = weeklyCap(env);
  if (cap === null) return false;
  const { count, error } = await admin
    .from("report_orders")
    .select("id", { count: "exact", head: true })
    .in("status", [...CAP_STATUSES])
    .gte("created_at", new Date(now.getTime() - WEEK_MS).toISOString());
  if (error || count === null) {
    console.error("[capacity] count failed:", error);
    return false;
  }
  return count >= cap;
}
