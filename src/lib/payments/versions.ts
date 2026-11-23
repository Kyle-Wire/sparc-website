/**
 * Versions of a delivered report (business/15-update-policy.md, option B,
 * decided 23 November 2026): corrections free for good, and 12 months of free
 * updates after delivery. v1.0 is the PDF delivered with the order; a
 * correction or a changed finding is v1.1, v1.2, ...; a new hazard (wind,
 * ground movement once it passes) is v2.0. Old versions stay in the buyer's
 * account: nothing is silently replaced.
 *
 * Storage only, no migration: v1.0 is <user>/<order>.pdf (as delivered), and
 * each later version is <user>/<order>-v<major>.<minor>.pdf in the same
 * private "reports" bucket.
 */

export type UpdateKind = "correction" | "change" | "hazard";
export const UPDATE_KINDS: readonly UpdateKind[] = ["correction", "change", "hazard"];

export interface Version {
  major: number;
  minor: number;
  /** "1.1" */
  label: string;
}

const V1: Version = { major: 1, minor: 0, label: "1.0" };
const NAME = /^([0-9a-f-]{36})(?:-v(\d{1,3})\.(\d{1,3}))?\.pdf$/i;

const make = (major: number, minor: number): Version => ({ major, minor, label: `${major}.${minor}` });
const cmp = (a: Version, b: Version) => a.major - b.major || a.minor - b.minor;

/** Object path of one version. */
export function versionPath(userId: string, orderId: string, v: Version | string): string {
  const label = typeof v === "string" ? v : v.label;
  return label === "1.0" ? `${userId}/${orderId}.pdf` : `${userId}/${orderId}-v${label}.pdf`;
}

/** Parses "1.1" (from a query string); null for anything else. */
export function parseVersion(s: string | null | undefined): Version | null {
  const m = /^(\d{1,3})\.(\d{1,3})$/.exec(s ?? "");
  if (!m) return null;
  const v = make(Number(m[1]), Number(m[2]));
  return v.major >= 1 ? v : null;
}

/**
 * Every version of every order in a listing of the buyer's folder, oldest
 * first. An order with a delivered PDF always has v1.0.
 */
export function versionsByOrder(names: readonly string[]): Map<string, Version[]> {
  const out = new Map<string, Version[]>();
  for (const n of names) {
    const m = NAME.exec(n);
    if (!m) continue;
    const v = m[2] ? make(Number(m[2]), Number(m[3])) : V1;
    const list = out.get(m[1]) ?? [];
    if (!list.some((x) => x.label === v.label)) list.push(v);
    out.set(m[1], list);
  }
  for (const list of out.values()) list.sort(cmp);
  return out;
}

/** The next version after the ones that exist: a new hazard is a new major. */
export function nextVersion(existing: readonly Version[], kind: UpdateKind): Version {
  const latest = [...existing].sort(cmp).at(-1) ?? V1;
  return kind === "hazard" ? make(latest.major + 1, 0) : make(latest.major, latest.minor + 1);
}

export const UPDATE_WINDOW_DAYS = 365;

/**
 * Whether an update may be sent. Corrections always (they are about something
 * the buyer bought, even if they asked for no more updates). Changes and new
 * hazards only within 12 months of delivery, and not to a buyer who asked us
 * to stop.
 */
export function updateAllowed(
  kind: UpdateKind,
  status: string,
  deliveredAt: string | null,
  now: Date,
  optedOut: boolean,
): { ok: true } | { ok: false; why: string } {
  if (status !== "delivered" || !deliveredAt) return { ok: false, why: `the order is ${status}, not delivered` };
  if (kind === "correction") return { ok: true };
  if (optedOut) return { ok: false, why: "the buyer asked for no more updates (corrections still go)" };
  const days = (now.getTime() - new Date(deliveredAt).getTime()) / 86_400_000;
  if (days > UPDATE_WINDOW_DAYS) return { ok: false, why: `delivered ${Math.floor(days)} days ago; free updates last ${UPDATE_WINDOW_DAYS} days (corrections still go)` };
  return { ok: true };
}
