/**
 * When a report is promised, in working days, and whether that lands before
 * the buyer's inspection deadline. Pure, so it is tested without a clock
 * (turnaround.test.ts).
 *
 * Why this exists (blind-spots review, 23 November 2026): Pennsylvania's
 * standard Agreement of Sale gives a 10-day inspection period when the box is
 * left blank (PA Realtors, "Inspection contingency review"). Our promise is 10
 * WORKING days, so a report can land after the buyer's window has closed. We
 * ask for the deadline and say so before the card is saved, never after.
 *
 * Calendar days are "YYYY-MM-DD" strings in US Eastern time, where the
 * reports are made. Working days skip Saturdays, Sundays and the eleven US
 * federal holidays (5 U.S.C. 6103), moved to the Friday or Monday they are
 * observed on when they fall on a weekend.
 */

export type Day = string; // YYYY-MM-DD

const ISO = /^\d{4}-\d{2}-\d{2}$/;

function toDate(d: Day): Date {
  return new Date(`${d}T00:00:00Z`);
}
function toDay(d: Date): Day {
  return d.toISOString().slice(0, 10);
}
function addDays(d: Day, n: number): Day {
  const x = toDate(d);
  x.setUTCDate(x.getUTCDate() + n);
  return toDay(x);
}

/** A real calendar day written YYYY-MM-DD, or false. */
export function isDay(s: string): boolean {
  return ISO.test(s) && toDay(toDate(s)) === s;
}

/** Today in US Eastern time. */
export function todayEastern(now: Date = new Date()): Day {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** The nth weekday (0 = Sunday) of a month; n = -1 for the last one. */
function nthWeekday(year: number, month: number, weekday: number, n: number): Day {
  if (n > 0) {
    const first = new Date(Date.UTC(year, month, 1));
    const offset = (weekday - first.getUTCDay() + 7) % 7;
    return toDay(new Date(Date.UTC(year, month, 1 + offset + (n - 1) * 7)));
  }
  const last = new Date(Date.UTC(year, month + 1, 0));
  const back = (last.getUTCDay() - weekday + 7) % 7;
  return toDay(new Date(Date.UTC(year, month + 1, -back)));
}

function observed(year: number, month: number, day: number): Day {
  const d = new Date(Date.UTC(year, month, day));
  const w = d.getUTCDay();
  if (w === 6) d.setUTCDate(day - 1);
  if (w === 0) d.setUTCDate(day + 1);
  return toDay(d);
}

/** The US federal holidays observed in a year. */
export function federalHolidays(year: number): Set<Day> {
  return new Set([
    observed(year, 0, 1), // New Year's Day
    nthWeekday(year, 0, 1, 3), // Birthday of Martin Luther King, Jr.
    nthWeekday(year, 1, 1, 3), // Washington's Birthday
    nthWeekday(year, 4, 1, -1), // Memorial Day
    observed(year, 5, 19), // Juneteenth
    observed(year, 6, 4), // Independence Day
    nthWeekday(year, 8, 1, 1), // Labor Day
    nthWeekday(year, 9, 1, 2), // Columbus Day
    observed(year, 10, 11), // Veterans Day
    nthWeekday(year, 10, 4, 4), // Thanksgiving Day
    observed(year, 11, 25), // Christmas Day
    observed(year + 1, 0, 1), // next New Year's, when it is observed on 31 December
  ]);
}

export function isWorkingDay(d: Day): boolean {
  const w = toDate(d).getUTCDay();
  if (w === 0 || w === 6) return false;
  return !federalHolidays(Number(d.slice(0, 4))).has(d);
}

/** The day `n` working days after `from` (the order day itself is day 0). */
export function addWorkingDays(from: Day, n: number): Day {
  let d = from;
  let left = n;
  while (left > 0) {
    d = addDays(d, 1);
    if (isWorkingDay(d)) left -= 1;
  }
  return d;
}

/** The last day of the promise for an order placed on `orderDay`. */
export function promisedBy(orderDay: Day, workingDays: number): Day {
  return addWorkingDays(orderDay, workingDays);
}

export type DeadlineCheck =
  | { kind: "none" } // no deadline given
  | { kind: "invalid" } // not a date, or absurdly far either way
  | { kind: "past" } // the deadline has already gone by
  | { kind: "ok"; promisedBy: Day } // the promise lands on or before the deadline
  | { kind: "tight"; promisedBy: Day; deadline: Day }; // the deadline comes first

/** Compare the buyer's inspection deadline with the promise. */
export function checkDeadline(deadline: string, today: Day, workingDays: number): DeadlineCheck {
  if (!deadline) return { kind: "none" };
  if (!isDay(deadline)) return { kind: "invalid" };
  if (deadline > addDays(today, 400)) return { kind: "invalid" };
  if (deadline < today) return { kind: "past" };
  const by = promisedBy(today, workingDays);
  return deadline >= by ? { kind: "ok", promisedBy: by } : { kind: "tight", promisedBy: by, deadline };
}

/** "Friday, December 5" for a buyer. */
export function formatDay(d: Day): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric" }).format(toDate(d));
}
