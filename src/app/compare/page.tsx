import Link from "next/link";
import type { Route } from "next";
import { Nav, Footer } from "@/components/shell/Shell";
import { PageHero } from "@/components/marketing/page-shell";
import { parsePlaceSlug, placeSlug } from "@/lib/place/coords";
import { loadPlace, type PlaceRecord } from "@/lib/place/summary";

export const metadata = {
  title: "Compare places",
  robots: { index: false, follow: false },
};

// Up to four places side by side, each read from the public record exactly as
// its own place page reads it (src/lib/place/summary.ts). The page address
// carries blocks, never addresses.
//
// A comparison states what each register says for each place. It does not
// rank the places or say which is safer: several rows describe a census tract
// or a county, not the block, and the page says which.

type Props = { searchParams: Promise<{ p?: string | string[] }> };

const MAX = 4;

function longDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

const DASH = <span className="record-aside">did not answer</span>;

interface Row {
  label: string;
  area: string;
  cell: (r: PlaceRecord) => React.ReactNode;
}

const ROWS: Row[] = [
  {
    label: "FEMA flood zone",
    area: "the block",
    cell: (r) =>
      !r.zones.ok ? (
        DASH
      ) : r.zones.data.zones.length === 0 ? (
        "Not mapped"
      ) : (
        <>
          <strong>{r.zones.data.zones.map((z) => `Zone ${z.code}`).join(", ")}</strong>
          <small>
            {r.zones.data.zones.some((z) => z.inSfha)
              ? "Special Flood Hazard Area on the block"
              : "No Special Flood Hazard Area"}
          </small>
        </>
      ),
  },
  {
    label: "Flood map date",
    area: "the map panel",
    cell: (r) => (!r.zones.ok ? DASH : r.zones.data.panelDate ? longDate(r.zones.data.panelDate) : "Not given"),
  },
  {
    label: "Ground height against the area around it",
    area: "the block, set against a square kilometre",
    cell: (r) => {
      if (!r.ground.ok) return DASH;
      const diff = r.ground.data.blockFt - r.ground.data.neighbourhoodFt;
      const size = Math.abs(diff);
      return (
        <>
          <strong>{size < 1 ? "Level" : `${size.toFixed(size < 10 ? 1 : 0)} ft ${diff > 0 ? "higher" : "lower"}`}</strong>
          <small>{Math.round(r.ground.data.lowerSharePct)}% of the area lies lower than the block</small>
        </>
      );
    },
  },
  {
    label: "Tree canopy",
    area: "the block",
    cell: (r) =>
      !r.cover.ok ? (
        DASH
      ) : (
        <>
          <strong>{Math.round(r.cover.data.canopy.block)}%</strong>
          <small>{Math.round(r.cover.data.canopy.neighbourhood)}% across the square kilometre around it</small>
        </>
      ),
  },
  {
    label: "Paving and buildings",
    area: "the block",
    cell: (r) =>
      !r.cover.ok ? (
        DASH
      ) : (
        <>
          <strong>{Math.round(r.cover.data.paving.block)}%</strong>
          <small>{Math.round(r.cover.data.paving.neighbourhood)}% across the square kilometre around it</small>
        </>
      ),
  },
  {
    label: "Flood insurance claims",
    area: "the census tract",
    cell: (r) =>
      !r.claims.ok ? (
        DASH
      ) : (
        <>
          <strong>
            {r.claims.data.atLeast ? "over " : ""}
            {r.claims.data.total.toLocaleString("en-US")}
          </strong>
          {r.claims.data.total > 0 && r.claims.data.firstYear && r.claims.data.lastYear && (
            <small>
              in {r.claims.data.yearsWithClaims} {r.claims.data.yearsWithClaims === 1 ? "year" : "years"},{" "}
              {r.claims.data.firstYear} to {r.claims.data.lastYear}
            </small>
          )}
        </>
      ),
  },
  {
    label: "Federal disaster declarations",
    area: "the county",
    cell: (r) =>
      !r.declarations.ok ? (
        DASH
      ) : (
        <>
          <strong>{r.declarations.data.total.toLocaleString("en-US")}</strong>
          {r.declarations.data.byType.length > 0 && (
            <small>
              mostly {r.declarations.data.byType[0].type.toLowerCase()} ({r.declarations.data.byType[0].count})
            </small>
          )}
        </>
      ),
  },
  {
    label: "Tropical storm and hurricane tracks",
    area: "the area within 100 km",
    cell: (r) => (
      <>
        <strong>{r.storms.total.toLocaleString("en-US")}</strong>
        <small>{r.storms.hurricanesNearby} at hurricane strength at the nearest point</small>
      </>
    ),
  },
  {
    label: "FEMA risk rating, all hazards",
    area: "the census tract",
    cell: (r) => (!r.risk.ok ? DASH : <strong>{r.risk.data.overall.rating}</strong>),
  },
  {
    label: "Hazards FEMA rates relatively high or very high",
    area: "the census tract",
    cell: (r) => {
      if (!r.risk.ok) return DASH;
      const high = r.risk.data.hazards.filter((h) => h.rank >= 4);
      return high.length ? high.map((h) => `${h.hazard} (${h.rating.toLowerCase()})`).join(", ") : "None";
    },
  },
];

export default async function ComparePage({ searchParams }: Props) {
  const { p } = await searchParams;
  const raw = Array.isArray(p) ? p : p ? [p] : [];
  const seen = new Set<string>();
  const places = raw
    .map((s) => parsePlaceSlug(s))
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .filter((x) => {
      const k = placeSlug(x);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, MAX);

  // One after another, not together: FEMA's map server drops bursts.
  const records: PlaceRecord[] = [];
  for (const place of places) records.push(await loadPlace(place));

  return (
    <>
      <Nav active="places" />
      <PageHero
        kicker="compare · the public record, side by side"
        title="How the places you are weighing up differ on record."
        lead="Each column is one place. Each row says which area the record describes, because a county's record says less about a block than a flood map does."
        accent="var(--flood)"
      />
      <section className="compact">
        <div className="wrap">
          {records.length < 2 ? (
            <div className="card dashed" style={{ padding: 28, maxWidth: 720 }}>
              <h3 style={{ margin: "0 0 8px" }}>Pick at least two places.</h3>
              <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6, margin: "0 0 16px" }}>
                Save the places you are considering, then tick them on the Your places page.
              </p>
              <Link className="btn btn-accent" href="/places">
                Your places <span className="arrow">→</span>
              </Link>
            </div>
          ) : (
            <>
              <div className="table-scroll">
                <table className="plain-table compare-table">
                  <thead>
                    <tr>
                      <th>Record</th>
                      {records.map((r) => (
                        <th key={placeSlug(r.place)}>
                          <Link href={`/place/${placeSlug(r.place)}` as Route}>A block in {r.glance.where}</Link>
                          {r.areas.ok && <small>{r.areas.data.tractName}, {r.areas.data.countyName}</small>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ROWS.map((row) => (
                      <tr key={row.label}>
                        <td>
                          {row.label}
                          <small>describes {row.area}</small>
                        </td>
                        {records.map((r) => (
                          <td key={placeSlug(r.place)}>{row.cell(r)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="screening-note" style={{ marginTop: 24 }}>
                <strong>A comparison of records, not a ranking.</strong> Nothing here says which place is safer.
                Two blocks in the same census tract show the same claims and the same FEMA risk rating, and a
                county&apos;s declarations cover the whole county. Open each place for the full record, its
                sources and its map. A screening tool; not for engineering decisions.
              </p>
            </>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}
