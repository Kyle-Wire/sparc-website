/**
 * How full this week is, and who may order past the cap. Server only: it
 * reads with the service role.
 *
 * The cap in force is order_settings.weekly_cap (migration 0012, default 10),
 * falling back to ORDERS_WEEKLY_CAP, then 10, when that row cannot be read.
 * A week is any seven days. Orders a card was saved for (or later) count, and
 * so do places held for open waitlist invites (report_capacity_used()).
 *
 * A count that fails is read as "not full", so a database hiccup never hides
 * the order form; the cap is a courtesy to buyers and to the person reading
 * every report, not a security control.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { CAP_STATUSES } from "./catalog";
import { capInForce, capacityFrom, type Capacity } from "./waitlist";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** The cap in force: the database setting, else the environment, else 10. */
export async function readCap(admin: SupabaseClient, env: Record<string, string | undefined> = process.env): Promise<number | null> {
  try {
    const { data, error } = await admin.from("order_settings").select("weekly_cap").eq("id", true).maybeSingle<{ weekly_cap: number | null }>();
    if (error || !data) return capInForce(undefined, env);
    return capInForce(data.weekly_cap, env);
  } catch {
    return capInForce(undefined, env);
  }
}

export async function capacity(admin: SupabaseClient, env: Record<string, string | undefined> = process.env, now: Date = new Date()): Promise<Capacity> {
  const cap = await readCap(admin, env);
  if (cap === null) return capacityFrom(null, 0, 0);
  const since = new Date(now.getTime() - WEEK_MS).toISOString();
  const used = await admin.rpc("report_capacity_used", { p_since: since, p_statuses: [...CAP_STATUSES] });
  if (!used.error && Array.isArray(used.data) && used.data[0]) {
    const row = used.data[0] as { orders: number; held: number };
    return capacityFrom(cap, Number(row.orders) || 0, Number(row.held) || 0);
  }
  // Before migration 0012 the function does not exist: count orders alone.
  const { count, error } = await admin
    .from("report_orders")
    .select("id", { count: "exact", head: true })
    .in("status", [...CAP_STATUSES])
    .gte("created_at", since);
  if (error || count === null) {
    console.error("[capacity] count failed:", used.error ?? error);
    return capacityFrom(null, 0, 0);
  }
  return capacityFrom(cap, count, 0);
}

/** Kept for callers that only need yes or no. */
export async function atCapacity(admin: SupabaseClient, env: Record<string, string | undefined> = process.env, now: Date = new Date()): Promise<boolean> {
  return (await capacity(admin, env, now)).full;
}

export interface OpenInvite {
  id: string;
  expiresAt: string;
  address: string | null;
  placeSlug: string | null;
}

/**
 * The open waitlist invite for this email, if any. An open invite holds a
 * place: its holder may order when the week is full, and during the
 * invitation-only launch even when not in ORDER_INVITE_EMAILS.
 */
export async function openInvite(admin: SupabaseClient, email: string | null | undefined, now: Date = new Date()): Promise<OpenInvite | null> {
  if (!email) return null;
  try {
    const { data, error } = await admin
      .from("report_waitlist")
      .select("id, invite_expires_at, address, place_slug, order_id")
      .eq("email", email.trim().toLowerCase())
      .eq("status", "invited")
      .gt("invite_expires_at", now.toISOString())
      .maybeSingle<{ id: string; invite_expires_at: string; address: string | null; place_slug: string | null; order_id: string | null }>();
    if (error || !data) return null;
    // Used already: the order placed on it has a saved card.
    if (data.order_id) {
      const { data: o } = await admin.from("report_orders").select("status").eq("id", data.order_id).maybeSingle<{ status: string }>();
      if (o && (CAP_STATUSES as readonly string[]).includes(o.status)) return null;
    }
    return { id: data.id, expiresAt: data.invite_expires_at, address: data.address, placeSlug: data.place_slug };
  } catch {
    return null;
  }
}

/** The person's place in the queue (1 = next), counting only people still waiting. */
export async function queuePosition(admin: SupabaseClient, createdAt: string): Promise<number> {
  const { count } = await admin
    .from("report_waitlist")
    .select("id", { count: "exact", head: true })
    .eq("status", "waiting")
    .lte("created_at", createdAt);
  return Math.max(1, count ?? 1);
}

/** How many people are waiting now (not yet invited). */
export async function waitingCount(admin: SupabaseClient): Promise<number> {
  try {
    const { count, error } = await admin.from("report_waitlist").select("id", { count: "exact", head: true }).eq("status", "waiting");
    return error ? 0 : count ?? 0;
  } catch {
    return 0;
  }
}
