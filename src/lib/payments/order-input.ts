/**
 * The order form, checked on the server. Pure, so it is tested without a
 * database (order-input.test.ts).
 */

import { parsePlaceSlug, placeSlug } from "../place/coords";
import { REPORT } from "./catalog";
import { checkDeadline, todayEastern, type Day } from "./turnaround";

/**
 * What the buyer can tell us about the house (migration 0010). Each is null
 * when not given. They replace the City of Philadelphia assessor's record,
 * whose terms forbid commercial use (Climate Home Inspection D53), and they
 * are printed in the report as the buyer's answers, not inspected.
 */
export interface HouseFacts {
  basement: "full" | "partial" | "none" | null;
  central_air: boolean | null;
  year_built: number | null;
  storeys: number | null;
}

export const BASEMENT_CHOICES = ["full", "partial", "none"] as const;
export const EARLIEST_YEAR = 1700;
export const MAX_STOREYS = 6;

export function checkHouseFacts(form: FormData, thisYear: number = new Date().getFullYear()): HouseFacts | "invalid" {
  const basement = clean(form.get("basement"));
  const air = clean(form.get("central_air"));
  const year = clean(form.get("year_built"));
  const storeys = clean(form.get("storeys"));
  if (basement && !(BASEMENT_CHOICES as readonly string[]).includes(basement)) return "invalid";
  if (air && air !== "yes" && air !== "no") return "invalid";
  let y: number | null = null;
  if (year) {
    if (!/^\d{4}$/.test(year)) return "invalid";
    y = Number(year);
    if (y < EARLIEST_YEAR || y > thisYear + 1) return "invalid";
  }
  let n: number | null = null;
  if (storeys) {
    if (!/^\d$/.test(storeys)) return "invalid";
    n = Number(storeys);
    if (n < 1 || n > MAX_STOREYS) return "invalid";
  }
  return {
    basement: (basement || null) as HouseFacts["basement"],
    central_air: air === "yes" ? true : air === "no" ? false : null,
    year_built: y,
    storeys: n,
  };
}

export interface OrderInput {
  address: string;
  note: string | null;
  placeSlug: string | null;
  agreed: boolean;
  /** The buyer's inspection deadline, if they gave one. */
  inspectionDeadline: Day | null;
  /** True when the deadline comes before our promise and the buyer said they understand. */
  deadlineAcknowledged: boolean;
  /** The buyer's answers about the house, each null when left blank. */
  houseFacts: HouseFacts;
}

export type OrderCheck = { ok: true; value: OrderInput } | { ok: false; error: string };

const clean = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]+/g, " ").trim() : "");

export function checkOrder(form: FormData, today: Day = todayEastern()): OrderCheck {
  const address = clean(form.get("address")).replace(/\s+/g, " ");
  const note = clean(form.get("note"));
  const place = clean(form.get("place"));
  const agreed = form.get("agree") === "yes";
  const deadline = clean(form.get("deadline"));
  const deadlineAck = form.get("deadline_ack") === "yes";

  if (address.length < 5) return { ok: false, error: "address" };
  if (address.length > 300) return { ok: false, error: "address" };
  if (!/\d/.test(address)) return { ok: false, error: "address" }; // a street address has a number
  if (note.length > 2000) return { ok: false, error: "note" };
  if (!agreed) return { ok: false, error: "agree" };

  // The inspection deadline is optional. When it comes before the promise,
  // the buyer must say they understand before a card is saved: we would
  // rather lose the order than have it arrive after the moment it was for.
  const d = checkDeadline(deadline, today, REPORT.deliveryDays);
  if (d.kind === "invalid") return { ok: false, error: "deadline_invalid" };
  if (d.kind === "past") return { ok: false, error: "deadline_past" };
  if (d.kind === "tight" && !deadlineAck) return { ok: false, error: "deadline" };

  const facts = checkHouseFacts(form, Number(today.slice(0, 4)));
  if (facts === "invalid") return { ok: false, error: "house_facts" };

  const p = place ? parsePlaceSlug(place) : null;
  return {
    ok: true,
    value: {
      address,
      note: note || null,
      placeSlug: p ? placeSlug(p) : null,
      agreed,
      inspectionDeadline: d.kind === "none" ? null : deadline,
      deadlineAcknowledged: d.kind === "tight" && deadlineAck,
      houseFacts: facts,
    },
  };
}

export const ORDER_ERRORS: Record<string, string> = {
  address: "Please give the property's street address, with its number, city and state.",
  note: "The note is too long. Keep it under 2,000 characters.",
  agree: "Please tick the box to say you have read what the report is and is not.",
  deadline:
    "Your inspection deadline comes before the date we promise. Tick the box under it if you want to order anyway, or write to us first. Nothing was charged.",
  deadline_invalid: "That inspection deadline is not a date we can read. Leave it blank if you are not sure. Nothing was charged.",
  house_facts:
    "One of the answers about the house is not one we can read. Leave any you are not sure of blank. Nothing was charged.",
  deadline_past: "That inspection deadline has already passed. Leave it blank if your inspection period is over. Nothing was charged.",
  full: "We have as many reports as we can make well this week, so we are not taking new orders for a few days. Nothing was charged. Write to us and we will tell you when we can start.",
  attempts:
    "This account has started several orders today without saving a card, so to protect against card fraud we pause new ones for a day. Nothing was charged. If that was you having trouble with the card page, write to us and we will help.",
  checkout: "We could not open the checkout. Nothing was charged. Please try again in a minute.",
  unavailable: "Reports are not on sale yet. Nothing was charged.",
  unconfigured: "Checkout is not set up yet. Nothing was charged.",
  invite: "Reports are open by invitation for now, and this account is not on the list. Nothing was charged.",
};
