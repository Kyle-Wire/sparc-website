/**
 * What a buyer can do to their own order from /account/reports, without
 * writing to us. Pure, so it is tested without a database (self-serve.test.ts).
 *
 * The Terms say a buyer may cancel any time before the report is ready and
 * pays nothing. Until 23 November 2026 that meant writing to us; now the
 * account page has a button for it.
 *
 * Self-serve cancel is allowed while the card is saved and nothing is charged:
 * "card_saved" and "in_progress". Not "charging" (the charge is in flight; the
 * database function refuses it too), and not "payment_failed" (the report is
 * finished; the buyer simply does not pay, and can write to us).
 */

import { promisedBy, todayEastern, isDay, type Day } from "./turnaround";

export function mayCancel(status: string): boolean {
  return status === "card_saved" || status === "in_progress";
}

export type OrderDates = {
  /** Last day of the promise, in US Eastern. */
  promised: Day;
  /** The buyer's inspection deadline, if they gave one. */
  deadline: Day | null;
  /** The deadline comes before the promise. */
  tight: boolean;
};

/** The dates a buyer sees on an order that is still being made. */
export function orderDates(orderedAt: string, deadline: string | null, workingDays: number): OrderDates {
  const promised = promisedBy(todayEastern(new Date(orderedAt)), workingDays);
  const d = deadline && isDay(deadline.slice(0, 10)) ? deadline.slice(0, 10) : null;
  return { promised, deadline: d, tight: d !== null && d < promised };
}
