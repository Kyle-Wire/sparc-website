/**
 * The house-report wait list (Kyle, 24 November 2026: "if I can only do 5 to
 * 10 a week, then we cap it at 10 and they'll be put on a wait list").
 *
 * When ORDERS_WEEKLY_CAP is reached, /report/buy offers this list instead of
 * the order form. Rows go into the existing `waitlist` table (migration 0001)
 * with domain WAITLIST_DOMAIN, so no migration is needed. Nothing is charged
 * and no card is saved; Kyle invites people in the order they joined.
 *
 * The place in line shown to the buyer is a real count of queued rows that
 * joined before them, never a made-up number (map-first brief s.7: no fake
 * scarcity).
 */

export const WAITLIST_DOMAIN = "house-report";

const NO_CTRL = (s: string) => s.replace(/[\r\n\0]/g, " ").trim();

/** The note stored with a wait-list row: place, deadline and the buyer's own words. */
export function waitlistReason(input: { place?: string | null; deadline?: string | null; note?: string | null }): string {
  const place = input.place && /^[-0-9.,a-z_]{1,80}$/i.test(input.place) ? input.place : null;
  const deadline = input.deadline && /^\d{4}-\d{2}-\d{2}$/.test(input.deadline) ? input.deadline : null;
  const note = input.note ? NO_CTRL(input.note).slice(0, 2000) : "";
  return [
    "House report wait list",
    `Block: ${place ?? "not given"}`,
    `Inspection deadline: ${deadline ?? "not given"}`,
    note ? `Note: ${note}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Reads ?waitlisted=N back from the redirect. Anything else is not a place in line. */
export function parsePlaceInLine(v: string | undefined): number | null {
  if (!v || !/^\d{1,4}$/.test(v)) return null;
  const n = Number(v);
  return n > 0 ? n : null;
}
