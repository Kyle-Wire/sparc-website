import FEMA_LEGEND from "@/data/fema-flood-zones-legend.json";
import { HAZARD_WORDS, LANDSLIDE_CLASSES, rampGradient, type LayerInfo } from "@/lib/map-legends";

/**
 * The key for one public map layer: what the colour means, the publisher's
 * own colours, units, and where it comes from. `active` is the legend entry
 * the cursor is over, which is ringed so the eye can find it.
 */

/** FEMA's legend, shortened to the zones a buyer meets. FEMA's swatch images are kept. */
const FEMA_SHOWN: { match: string; label: string }[] = [
  { match: "1% Annual Chance Flood Hazard", label: "1% annual chance (100-year)" },
  { match: "Regulatory Floodway", label: "Regulatory floodway" },
  { match: "0.2% Annual Chance Flood Hazard", label: "0.2% annual chance (500-year)" },
  { match: "Area of Undetermined Flood Hazard", label: "Undetermined hazard" },
  { match: "Area with Reduced Risk Due to Levee", label: "Reduced risk, behind a levee" },
  { match: "Future Conditions 1% Annual Chance Flood Hazard", label: "Future conditions 1%" },
];
/** Index into FEMA_COLOURS (src/lib/map-legends.ts) for each row above. */
const FEMA_ROW_OF_COLOUR = [0, 1, 2, 3];

export function MapLegend({
  layer,
  active,
  slrFeet,
  onHide,
  children,
}: {
  layer: LayerInfo;
  active?: number;
  slrFeet?: number;
  /** Shows a "Hide" button that clears the layer, leaving the aerial. */
  onHide?: () => void;
  children?: React.ReactNode;
}) {
  const lg = layer.legend;
  return (
    <div className="mk-legend" data-layer={layer.key}>
      <div className="mk-legend-head">
        <span className="mk-hazard" data-hazard={layer.hazard}>
          {HAZARD_WORDS[layer.hazard]}
        </span>
        <strong>
          {layer.title}
          {layer.key === "slr" && slrFeet ? `, ${slrFeet} ft higher` : ""}
        </strong>
        {onHide && (
          <button type="button" className="mk-hide" onClick={onHide}>
            Hide
          </button>
        )}
      </div>
      <p className="mk-what">{layer.what}</p>
      {children}

      {lg.kind === "ramp" && (
        <div className="mk-ramp" role="img" aria-label={`${layer.title}: from ${lg.ticks[0]} to ${lg.ticks[lg.ticks.length - 1]} ${lg.unit}`}>
          <div className="mk-ramp-bar" style={{ backgroundImage: rampGradient([{ at: 0, color: lg.stops[0].color }, ...lg.stops]) }}>
            {active !== undefined && active >= 0 && <span className="mk-ramp-mark" style={{ left: `${active}%` }} />}
          </div>
          <div className="mk-ramp-ticks">
            {lg.ticks.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
          <div className="mk-unit">{lg.unit}. Clear where none is mapped.</div>
        </div>
      )}

      {lg.kind === "classes" && layer.key === "landslide" && (
        <div className="mk-steps">
          <div className="mk-steps-row">
            {LANDSLIDE_CLASSES.map((c, i) => (
              <span key={c.color} className="mk-step" data-on={active === i ? "true" : undefined} style={{ background: c.color }} title={`Class ${i + 1}`} />
            ))}
          </div>
          <div className="mk-ramp-ticks">
            <span>Less prone</span>
            <span>More prone</span>
          </div>
          <div className="mk-unit">USGS classes 1 to 5</div>
        </div>
      )}

      {lg.kind === "classes" && layer.key !== "landslide" && (
        <ul className="mk-classes" data-shape={lg.shape ?? "fill"}>
          {lg.classes.map((c, i) => (
            <li key={c.label} data-on={active === i ? "true" : undefined}>
              <span className="mk-swatch" style={{ background: c.color }} aria-hidden />
              {c.label}
            </li>
          ))}
        </ul>
      )}

      {lg.kind === "fema" && (
        <ul className="mk-classes">
          {FEMA_SHOWN.map((row, i) => {
            const it = FEMA_LEGEND.items.find((x) => x.label === row.match);
            if (!it) return null;
            return (
              <li key={row.match} data-on={active !== undefined && FEMA_ROW_OF_COLOUR[active] === i ? "true" : undefined}>
                {/* FEMA's own swatch, copied from its legend by scripts/fetch-fema-legend.mjs. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="mk-swatch" src={it.image} alt="" width={14} height={14} />
                {row.label}
              </li>
            );
          })}
          <li className="mk-none">
            <span className="mk-swatch mk-swatch-clear" aria-hidden />
            No shading: outside the mapped hazard areas (zone X), or not mapped
          </li>
        </ul>
      )}

      {lg.kind === "track" && (
        <ul className="mk-classes" data-shape="line">
          <li>
            <span className="mk-swatch mk-swatch-track" aria-hidden />
            One storm&apos;s path
          </li>
        </ul>
      )}

      <p className="mk-source">
        {layer.publisher}, {layer.vintage}. {layer.grain[0].toUpperCase() + layer.grain.slice(1)}.
      </p>
    </div>
  );
}
