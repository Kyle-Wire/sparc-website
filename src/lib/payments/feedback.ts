/**
 * When the feedback ask may go out (business/17-reviews-and-consent.md):
 * once the report is delivered and at least 7 days have passed, so the buyer
 * has had time to use it. Pure, so it is tested without a clock.
 */

export const FEEDBACK_AFTER_DAYS = 7;

export type FeedbackDue = { ok: true; deliveredOn: string } | { ok: false; why: string };

export function feedbackDue(status: string, deliveredAt: string | null, now: Date): FeedbackDue {
  if (status !== "delivered") return { ok: false, why: `the order is ${status}, not delivered` };
  if (!deliveredAt) return { ok: false, why: "no delivery date on the order" };
  const at = new Date(deliveredAt);
  const days = (now.getTime() - at.getTime()) / 86_400_000;
  if (days < FEEDBACK_AFTER_DAYS) {
    return { ok: false, why: `delivered ${Math.floor(days)} days ago; wait until ${FEEDBACK_AFTER_DAYS}` };
  }
  const deliveredOn = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "long", day: "numeric" }).format(at);
  return { ok: true, deliveredOn };
}
