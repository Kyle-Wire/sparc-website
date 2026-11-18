import type { Glance } from "@/lib/place/summary";

/**
 * The headline records for a place, in one row. Used on the place page, on
 * saved-place cards and in the comparison, so a figure reads the same way in
 * all three. A dash means the source did not answer, never zero.
 */

export interface GlanceItem {
  key: string;
  label: string;
  value: string;
  /** A second line under the value. */
  sub?: string;
  /** Where on the place page the full card is. */
  anchor: string;
}

/** `zonePending` marks FEMA's flood map as still being asked, so the zone
 *  reads "Asking FEMA" rather than the dash that means no answer. */
export function glanceItems(g: Glance, zonePending = false): GlanceItem[] {
  const n = (v: number | null) => (v === null ? "—" : v.toLocaleString("en-US"));
  return [
    zonePending
      ? { key: "zone", label: "FEMA flood zone", value: "Asking FEMA", sub: "fills in when it answers", anchor: "#flood" }
      : {
          key: "zone",
          label: "FEMA flood zone",
          value: g.zone === null ? "—" : g.zone === "Not mapped" ? g.zone : `Zone ${g.zone}`,
          sub: g.sfha === null ? undefined : g.sfha ? "Special Flood Hazard Area on the block" : "No Special Flood Hazard Area",
          anchor: "#flood",
        },
    { key: "claims", label: "Flood insurance claims", value: n(g.claims), sub: "in the census tract", anchor: "#flood" },
    { key: "declarations", label: "Disaster declarations", value: n(g.declarations), sub: "for the county", anchor: "#flood" },
    { key: "storms", label: "Storm tracks nearby", value: n(g.storms), sub: "within 100 km", anchor: "#flood" },
    { key: "risk", label: "FEMA risk rating", value: g.risk ?? "—", sub: "all hazards, for the tract", anchor: "#hazards" },
  ];
}

export function GlanceRow({ glance, linked, zonePending }: { glance: Glance; linked?: boolean; zonePending?: boolean }) {
  return (
    <dl className="glance-row" aria-busy={zonePending || undefined}>
      {glanceItems(glance, zonePending).map((it) => {
        const body = (
          <>
            <dt>{it.label}</dt>
            <dd>
              <span className="glance-value">{it.value}</span>
              {it.sub && <small>{it.sub}</small>}
            </dd>
          </>
        );
        return linked ? (
          <a key={it.key} className="glance-item" href={it.anchor}>
            {body}
          </a>
        ) : (
          <div key={it.key} className="glance-item">
            {body}
          </div>
        );
      })}
    </dl>
  );
}
