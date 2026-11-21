// Small shared pieces of the spot readings, safe to load in the browser:
// the search distances ground.ts uses and the words for a wind frequency.

/** How far to look for a fault, and the radius for counting landslides. */
export const FAULT_SEARCH_KM = 25;
export const SLIDE_RADIUS_KM = 1;

/** "about 1.3 a year" or "about once in 450 years", for a frequency in events a year. */
export function perYear(f: number | null): string | null {
  if (f === null) return null;
  if (f <= 0) return "none on record";
  if (f >= 0.95) return `about ${f < 10 ? f.toFixed(1) : Math.round(f)} a year`;
  const years = 1 / f;
  if (years > 1000) return "less than once in 1,000 years";
  const round = years < 20 ? Math.round(years) : years < 200 ? Math.round(years / 5) * 5 : Math.round(years / 50) * 50;
  return `about once in ${round} years`;
}
