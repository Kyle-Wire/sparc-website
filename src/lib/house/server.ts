/**
 * Server-only reads for the paid account: the buyer's order (through their own
 * session, so row level security applies), their profile, and the house files
 * in the private "reports" bucket (src/lib/house/paths.ts).
 */
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { EMPTY_PROFILE, type Profile } from "./profile";
import { housePath, whatifEnginePath, whatifModelPath } from "./paths";
import { isHouseBundle, type HouseBundle } from "./types";

export interface HouseOrder {
  id: string;
  user_id: string;
  status: string;
  address: string;
  progress: Record<string, { state?: string; at?: string }> | null;
  created_at: string;
  delivered_at: string | null;
  inspection_deadline: string | null;
}

export const ORDER_FIELDS = "id,user_id,status,address,progress,created_at,delivered_at,inspection_deadline";
export const isOrderId = (id: string) => /^[0-9a-f-]{36}$/i.test(id);

export async function currentUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

/** The buyer's own order, or null (wrong id, someone else's, or not readable). */
export async function ownOrder(id: string): Promise<{ order: HouseOrder; userId: string } | null> {
  if (!isOrderId(id)) return null;
  const { supabase, user } = await currentUser();
  if (!user) return null;
  const { data } = await supabase.from("report_orders").select(ORDER_FIELDS).eq("id", id).maybeSingle<HouseOrder>();
  if (!data || data.user_id !== user.id) return null;
  return { order: data, userId: user.id };
}

export async function ownProfile(): Promise<Profile> {
  const { supabase, user } = await currentUser();
  if (!user) return EMPTY_PROFILE;
  try {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle<Profile>();
    return data ? { ...EMPTY_PROFILE, ...data } : EMPTY_PROFILE;
  } catch {
    return EMPTY_PROFILE;
  }
}

/** The house bundle the runner uploaded, or null if it isn't there or isn't valid. */
export async function houseBundle(userId: string, orderId: string): Promise<HouseBundle | null> {
  try {
    const { data, error } = await createSupabaseAdminClient().storage.from("reports").download(housePath(userId, orderId));
    if (error || !data) return null;
    const json: unknown = JSON.parse(await data.text());
    return isHouseBundle(json) ? json : null;
  } catch {
    return null;
  }
}

/** Which of the lab's two files are there (both are needed to offer the lab). */
export async function hasFloodLab(userId: string, orderId: string): Promise<boolean> {
  try {
    const { data } = await createSupabaseAdminClient().storage.from("reports").list(userId, { limit: 1000 });
    const names = new Set((data ?? []).map((f) => `${userId}/${f.name}`));
    return names.has(whatifModelPath(userId, orderId)) && names.has(whatifEnginePath(userId, orderId));
  } catch {
    return false;
  }
}
