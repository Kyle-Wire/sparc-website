"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/house/server";
import { parseProfile } from "@/lib/house/profile";

/** Save the buyer's profile (their own row only; RLS enforces it too). */
export async function saveProfile(form: FormData) {
  const { supabase, user } = await currentUser();
  if (!user) redirect("/login?next=/account/profile");
  const parsed = parseProfile(form);
  if (!parsed.ok) redirect(`/account/profile?error=${encodeURIComponent(parsed.field)}&why=${encodeURIComponent(parsed.why)}`);
  const { error } = await supabase
    .from("profiles")
    .upsert({ user_id: user.id, ...parsed.profile, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) redirect("/account/profile?error=save");
  revalidatePath("/account", "layout");
  redirect("/account/profile?saved=1");
}
