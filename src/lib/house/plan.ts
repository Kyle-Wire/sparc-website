/**
 * The buyer's plan: fixes saved from the what-if lab. In this prototype it is
 * kept in the viewer's own browser (a per-viewer convenience, wrapped in
 * try/catch); the plan doc's next step is a plans table so it follows the
 * buyer across devices and can be shared with a contractor.
 */
export interface PlanItem {
  id: string;
  savedAt: string;
  hazard: "flood";
  /** e.g. "French drain 16 in of gravel, rain garden 4 in bowl" */
  fix: string;
  /** e.g. "10-year storm, damp ground" */
  storm: string;
  /** Water against the house with the fix, metres, and the full model's range with nothing built. */
  wall: number;
  without: [number, number] | null;
}

export const planKey = (houseId: string) => `sparc-plan:${houseId}`;

export function readPlan(key: string): PlanItem[] {
  try {
    const raw = window.localStorage.getItem(key);
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? (v as PlanItem[]).slice(0, 20) : [];
  } catch {
    return [];
  }
}

export function writePlan(key: string, items: PlanItem[]): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(items.slice(0, 20)));
    window.dispatchEvent(new Event("sparc-plan"));
    return true;
  } catch {
    return false;
  }
}
