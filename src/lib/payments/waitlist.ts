/**
 * The house report's waitlist (migration 0012). Pure, so it is tested without
 * a database (waitlist.test.ts).
 *
 * Kyle, 24 November 2026: cap orders at about 10 a week, since one person
 * reads every report, and put anyone past that on a waitlist. The wait we
 * quote is arithmetic on that pace, never a promise: the list is served in
 * the order people joined, at up to `cap` a week.
 */

import { parsePlaceSlug, placeSlug } from "../place/coords";
import { checkDeadline, todayEastern, type Day } from "./turnaround";
import { REPORT, weeklyCap, DEFAULT_WEEKLY_CAP } from "./catalog";

export { DEFAULT_WEEKLY_CAP };

/** How long an invite holds a place before it goes to the next person. */
export const INVITE_DAYS = 7;

export interface WaitlistInput {
  name: string;
  email: string;
  address: string;
  placeSlug: string | null;
  note: string | null;
  inspectionDeadline: Day | null;
}

export type WaitlistError = "name" | "email" | "address" | "note" | "deadline_invalid" | "deadline_past";

const clean = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.replace(/[\r\0]/g, "").trim() : "");
const oneLine = (s: string) => s.replace(/\n+/g, " ");

export function checkWaitlist(form: FormData, today: Day = todayEastern()): { ok: true; value: WaitlistInput } | { ok: false; error: WaitlistError } {
  const name = oneLine(clean(form.get("name")));
  if (name.length < 1 || name.length > 200) return { ok: false, error: "name" };
  const email = clean(form.get("email")).toLowerCase();
  if (email.length > 320 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: "email" };
  const address = oneLine(clean(form.get("address")));
  if (address.length < 5 || address.length > 300) return { ok: false, error: "address" };
  const note = clean(form.get("note"));
  if (note.length > 2000) return { ok: false, error: "note" };
  const rawPlace = clean(form.get("place"));
  const p = rawPlace ? parsePlaceSlug(rawPlace) : null;
  const d = checkDeadline(clean(form.get("inspection_deadline")), today, REPORT.deliveryDays);
  if (d.kind === "invalid") return { ok: false, error: "deadline_invalid" };
  if (d.kind === "past") return { ok: false, error: "deadline_past" };
  const inspectionDeadline = d.kind === "none" ? null : clean(form.get("inspection_deadline"));
  return {
    ok: true,
    value: { name, email, address, placeSlug: p ? placeSlug(p) : null, note: note || null, inspectionDeadline },
  };
}

export const WAITLIST_ERRORS: Record<WaitlistError | "save", string> = {
  name: "Please give a name we can address you by.",
  email: "Please give an email address we can reach you at. It is how we tell you a place has opened.",
  address: "Please give the property's street address, with its number, city and state.",
  note: "The note is too long. Keep it under 2,000 characters.",
  deadline_invalid: "That inspection deadline is not a date we can read. Leave it blank if you are not sure.",
  deadline_past: "That inspection deadline has already passed. Leave it blank if your inspection period is over.",
  save: "We could not add you to the list just now. Nothing was saved. Please try again in a minute, or write to us.",
};

/**
 * The weekly cap in force. The database row (order_settings.weekly_cap) wins;
 * `undefined` means it could not be read (before migration 0012, or a database
 * hiccup), and then ORDERS_WEEKLY_CAP is read, then the default. `null` from
 * either source means no cap. ORDERS_WEEKLY_CAP accepts a whole number, or
 * "none" / "off" for no cap.
 */
export function capInForce(dbCap: number | null | undefined, env: Record<string, string | undefined> = process.env): number | null {
  if (dbCap !== undefined) return dbCap !== null && Number.isInteger(dbCap) && dbCap > 0 ? dbCap : null;
  return weeklyCap(env);
}

export interface Capacity {
  cap: number | null;
  /** Orders in the last seven days that count against the cap. */
  orders: number;
  /** Places held for open invites. */
  held: number;
  /** Places left this week; Infinity with no cap. */
  open: number;
  full: boolean;
}

export function capacityFrom(cap: number | null, orders: number, held: number): Capacity {
  if (cap === null) return { cap, orders, held, open: Infinity, full: false };
  const open = Math.max(0, cap - orders - held);
  return { cap, orders, held, open, full: open === 0 };
}

/**
 * About how many weeks until the person at `position` (1 = next) is invited,
 * at up to `cap` a week. Whole weeks, at least one: a place frees only when
 * an order from the last seven days ages out.
 */
export function expectedWeeks(position: number, cap: number | null): number {
  if (cap === null || position < 1) return 1;
  return Math.max(1, Math.ceil(position / cap));
}

/** "about a week" / "about 3 weeks". */
export function waitPhrase(weeks: number): string {
  return weeks <= 1 ? "about a week" : `about ${weeks} weeks`;
}

/**
 * The plain note on the expected wait, shown on the page and in the email.
 * The deadline line matters most: a buyer in an inspection period should not
 * sit on a list that cannot reach them in time.
 */
export function waitNote(position: number, cap: number | null): string {
  const weeks = expectedWeeks(position, cap);
  const pace = cap === null ? "" : ` We take up to ${cap} a week, because a person reads every report before it leaves, and we invite people in the order they joined.`;
  return (
    `You are number ${position} on the list. At our current pace that is ${waitPhrase(weeks)} before we invite you.${pace} ` +
    `That is an estimate, not a promise: if it changes, we will tell you. Once invited, you have ${INVITE_DAYS} days to order, ` +
    `and the report is ready within ${REPORT.deliveryDays} working days of that. Nothing is charged to join, and you can leave the list from the link in our email.`
  );
}

/** When an invite sent at `now` stops holding the place. */
export function inviteExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + INVITE_DAYS * 24 * 60 * 60 * 1000);
}

/**
 * Whether the wait is likely to miss the buyer's inspection deadline: the
 * expected invite, plus the delivery promise in calendar days (working days
 * times 7/5, rounded up), lands after it. A warning, not a refusal.
 */
export function waitMissesDeadline(deadline: Day | null, position: number, cap: number | null, today: Day = todayEastern()): boolean {
  if (!deadline) return false;
  const days = expectedWeeks(position, cap) * 7 + Math.ceil((REPORT.deliveryDays * 7) / 5);
  const t = new Date(`${today}T12:00:00Z`).getTime() + days * 86_400_000;
  return new Date(`${deadline}T12:00:00Z`).getTime() < t;
}

/** Said on the page and in the email when waitMissesDeadline() is true. */
export const DEADLINE_WARNING =
  "You gave an inspection deadline that this wait will probably miss. If it cannot move, a report from us is unlikely to reach you in time, and we would rather say so now than after. Reply to our email and we will tell you honestly whether we can make it.";
