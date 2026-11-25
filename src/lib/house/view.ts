/** Words for the house dashboard, from an order and a profile. Pure, so it is tested. */
import { partOfDay } from "./profile";

const DAY = (iso: string) => new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "America/New_York" });

export function hello(name: string | null, now: Date): string {
  return `Good ${partOfDay(now)}${name ? `, ${name}` : ""}. Here is how your house handles weather.`;
}

/** A year from delivery: Storm Ahead's free year and the free-update window (business/15-update-policy.md). */
export function yearAfter(deliveredAt: string): string {
  const d = new Date(deliveredAt);
  d.setUTCFullYear(d.getUTCFullYear() + 1);
  return DAY(d.toISOString());
}

export function deliveredKicker(deliveredAt: string | null, report: string): string {
  return `Your SPARC Labs Field Kit${deliveredAt ? ` · delivered ${DAY(deliveredAt)}` : ""} · report v${report}`;
}

export function updateLines(deliveredAt: string | null): string[] {
  return [
    "Corrections are free for as long as you have the report.",
    deliveredAt ? `New findings and new hazards are free until ${yearAfter(deliveredAt)}.` : "New findings and new hazards are free for a year.",
    "Each update arrives by email with a plain list of what changed, and every earlier version stays here.",
  ];
}
