/**
 * The weekly order cap and the house report waitlist (migration 0012). Run
 * from a shell with the service key, never from the browser:
 *
 *   export NEXT_PUBLIC_SUPABASE_URL=...  SUPABASE_SERVICE_ROLE_KEY=...
 *   export RESEND_API_KEY=...                     # invite emails the person
 *
 *   npx tsx scripts/waitlist.ts                   # this week, the cap and the queue
 *   npx tsx scripts/waitlist.ts cap <n|none>      # change the weekly cap (no deploy needed)
 *   npx tsx scripts/waitlist.ts invite --next [n] # invite the next n people in the order they joined (default 1)
 *   npx tsx scripts/waitlist.ts invite <id>       # invite one person out of turn (say why in the time log)
 *   npx tsx scripts/waitlist.ts remove <id>       # take someone off at their request; deletes the address
 *
 * Kyle, 24 November 2026: about 5 to 10 reports a week, "we cap it at 10 and
 * they'll be put on a wait list." An invite holds a place for INVITE_DAYS (7)
 * and counts against the cap while it is open; after that it lapses and the
 * place goes back. `invite --next` will not invite more people than there are
 * places this week unless --force is given.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { REPORT, formatPrice } from "../src/lib/payments/catalog";
import { capacity } from "../src/lib/payments/capacity";
import { INVITE_DAYS, inviteExpiry, waitMissesDeadline } from "../src/lib/payments/waitlist";
import { sendEmail } from "../src/lib/email";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sparclabs.co";

class Quit extends Error {
  constructor(readonly code: number) {
    super(`exit ${code}`);
  }
}
function quit(code: number): never {
  throw new Quit(code);
}

const USAGE = `npx tsx scripts/waitlist.ts
npx tsx scripts/waitlist.ts cap <n|none>
npx tsx scripts/waitlist.ts invite --next [n] [--force]
npx tsx scripts/waitlist.ts invite <id> [--force]
npx tsx scripts/waitlist.ts remove <id>`;

function admin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.");
    quit(2);
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

interface Entry {
  id: string;
  name: string;
  email: string;
  address: string | null;
  place_slug: string | null;
  inspection_deadline: string | null;
  status: string;
  leave_token: string;
  invite_expires_at: string | null;
  order_id: string | null;
  created_at: string;
}

const day = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "long", month: "long", day: "numeric" }).format(new Date(iso));

/** Lapse invites past their hold, and mark invites whose order has a saved card. */
async function tidy(db: SupabaseClient) {
  const now = new Date().toISOString();
  const { data: invited } = await db.from("report_waitlist").select("id, invite_expires_at, order_id").eq("status", "invited");
  for (const w of (invited ?? []) as Pick<Entry, "id" | "invite_expires_at" | "order_id">[]) {
    if (w.order_id) {
      const { data: o } = await db.from("report_orders").select("status").eq("id", w.order_id).maybeSingle<{ status: string }>();
      if (o && !["awaiting_card", "abandoned", "cancelled"].includes(o.status)) {
        await db.from("report_waitlist").update({ status: "ordered", updated_at: now }).eq("id", w.id);
        continue;
      }
    }
    if (w.invite_expires_at && w.invite_expires_at <= now) {
      await db.from("report_waitlist").update({ status: "expired", updated_at: now }).eq("id", w.id);
    }
  }
}

async function queue(db: SupabaseClient): Promise<Entry[]> {
  const { data, error } = await db.from("report_waitlist").select("*").eq("status", "waiting").order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Entry[];
}

async function invite(db: SupabaseClient, w: Entry): Promise<void> {
  const now = new Date();
  const until = inviteExpiry(now);
  const { error } = await db
    .from("report_waitlist")
    .update({ status: "invited", invited_at: now.toISOString(), invite_expires_at: until.toISOString(), updated_at: now.toISOString() })
    .eq("id", w.id)
    .eq("status", "waiting");
  if (error) throw error;
  const orderUrl = `${SITE}/report/buy${w.place_slug ? `?place=${w.place_slug}` : ""}`;
  const r = await sendEmail({
    to: w.email,
    template: "report-waitlist-invite",
    props: {
      name: w.name,
      address: w.address ?? "your house",
      email: w.email,
      orderUrl,
      holdUntil: day(until.toISOString()),
      amount: formatPrice(REPORT.priceCents),
      deliveryDays: REPORT.deliveryDays,
      leaveUrl: `${SITE}/report/waitlist/leave?token=${w.leave_token}`,
    },
    refId: `report-waitlist-invite-${w.id}`,
  });
  console.log(`Invited ${w.name} <${w.email}> for ${w.address}; place held until ${day(until.toISOString())}.`);
  console.log(r.ok ? `  Emailed (${r.id}).` : `  Email NOT sent (${r.error}). Write to them yourself with the link: ${orderUrl}`);
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const force = rest.includes("--force");
  const args = rest.filter((x) => x !== "--force");
  const db = admin();
  await tidy(db);

  if (!cmd || cmd === "list") {
    const c = await capacity(db);
    const q = await queue(db);
    const { data: inv } = await db.from("report_waitlist").select("*").eq("status", "invited").order("invited_at");
    console.log(
      c.cap === null
        ? "Weekly cap: none."
        : `Weekly cap: ${c.cap}. Last 7 days: ${c.orders} ordered, ${c.held} held for invites, ${c.open} open.`,
    );
    for (const w of (inv ?? []) as Entry[]) {
      console.log(`  invited  ${w.id.slice(0, 8)}  ${w.name} <${w.email}>  ${w.address}  held until ${day(w.invite_expires_at!)}${w.order_id ? "  (order started, no card yet)" : ""}`);
    }
    console.log(`Waiting: ${q.length}.`);
    q.forEach((w, i) => {
      const late = waitMissesDeadline(w.inspection_deadline, i + 1, c.cap);
      console.log(
        `  ${String(i + 1).padStart(3)}  ${w.id.slice(0, 8)}  joined ${w.created_at.slice(0, 10)}  ${w.name} <${w.email}>  ${w.address}` +
          (w.inspection_deadline ? `  deadline ${w.inspection_deadline}${late ? " (wait likely misses it)" : ""}` : ""),
      );
    });
    if (q.length && c.open > 0) console.log(`Next: npx tsx scripts/waitlist.ts invite --next ${Math.min(c.open, q.length)}`);
    return;
  }

  if (cmd === "cap" && args[0]) {
    const v = args[0].toLowerCase();
    const cap = v === "none" || v === "off" ? null : Number(v);
    if (cap !== null && !(Number.isInteger(cap) && cap > 0)) {
      console.error("The cap is a whole number above 0, or none.");
      quit(2);
    }
    const { error } = await db.from("order_settings").upsert({ id: true, weekly_cap: cap, updated_at: new Date().toISOString() });
    if (error) throw error;
    console.log(cap === null ? "Weekly cap removed. Anyone allowed to order can order." : `Weekly cap set to ${cap} orders in any seven days. The site uses it from the next page view.`);
    return;
  }

  if (cmd === "invite" && args[0] === "--next") {
    const n = args[1] ? Number(args[1]) : 1;
    if (!(Number.isInteger(n) && n > 0)) {
      console.error("invite --next takes a whole number.");
      quit(2);
    }
    const c = await capacity(db);
    const q = await queue(db);
    if (!q.length) {
      console.log("Nobody is waiting.");
      return;
    }
    let take = Math.min(n, q.length);
    if (!force && c.cap !== null && take > c.open) {
      if (c.open === 0) {
        console.error(`No places open this week (cap ${c.cap}: ${c.orders} ordered, ${c.held} held). Add --force to invite anyway.`);
        quit(1);
      }
      console.log(`Only ${c.open} place(s) open this week; inviting ${c.open}. Add --force to invite all ${take}.`);
      take = c.open;
    }
    for (const w of q.slice(0, take)) await invite(db, w);
    console.log(`Each invite holds a place for ${INVITE_DAYS} days.`);
    return;
  }

  if (cmd === "invite" && args[0]) {
    const match = (await queue(db)).filter((w) => w.id.startsWith(args[0]));
    if (match.length !== 1) {
      console.error(match.length ? "That id matches more than one person; give more of it." : `Nobody waiting with id ${args[0]}.`);
      quit(1);
    }
    const c = await capacity(db);
    if (!force && c.full) {
      console.error(`No places open this week (cap ${c.cap}). Add --force to invite anyway.`);
      quit(1);
    }
    await invite(db, match[0]);
    return;
  }

  if (cmd === "remove" && args[0]) {
    const { data } = await db.from("report_waitlist").select("id").in("status", ["waiting", "invited", "expired"]);
    const ids = ((data ?? []) as { id: string }[]).map((r) => r.id).filter((id) => id.startsWith(args[0]));
    if (ids.length !== 1) {
      console.error(ids.length ? "That id matches more than one person; give more of it." : `No one on the list with id ${args[0]}.`);
      quit(1);
    }
    const now = new Date().toISOString();
    const { error } = await db.from("report_waitlist").update({ status: "left", left_at: now, updated_at: now, address: null, note: null }).eq("id", ids[0]);
    if (error) throw error;
    console.log("Removed, and the address deleted.");
    return;
  }

  console.error(USAGE);
  quit(2);
}

main().catch((e) => {
  if (e instanceof Quit) {
    process.exitCode = e.code;
    return;
  }
  console.error(e);
  process.exitCode = 1;
});
