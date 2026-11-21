"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Map as MlMap, Marker, GeoJSONSource, StyleSpecification } from "maplibre-gl";
import type { LatLon } from "@/lib/place/coords";
import { recallPoint, type PlacePoint } from "./place-point";
import { FAULT_SEARCH_KM, SLIDE_RADIUS_KM, perYear } from "@/lib/place/readings";

/**
 * The neighbourhood map: the place at the centre, public layers on top, and
 * a click anywhere to read what is on record at that spot.
 *
 * Every layer here is a published public map drawn as its publisher draws it.
 * Nothing on this map is SPARC Labs model output, and the panel says so.
 * Tiles are fetched by the visitor's browser straight from the agencies
 * (USGS, FEMA, NOAA, MRLC); the hosts are listed in next.config.ts.
 *
 * The exact point a visitor searched for is read from this browser tab's own
 * storage and marked for them alone. A visitor who opens a shared link sees
 * the block ring and no mark.
 *
 * A click is sent to /api/inspect, which asks FEMA, USGS and the land cover
 * server about that spot. The click is not stored.
 */

const NFHL = "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer";
const MRLC = "https://www.mrlc.gov/geoserver/mrlc_display/wms";

function wms(layer: string): string {
  return (
    `${MRLC}?service=WMS&version=1.1.1&request=GetMap&layers=${layer}&styles=` +
    `&format=image/png&transparent=true&srs=EPSG:3857&width=256&height=256&bbox={bbox-epsg-3857}`
  );
}

type RasterId = "fema" | "slr1" | "slr3" | "slr6" | "canopy" | "paving" | "landslide" | "faults";

interface RasterDef {
  id: RasterId;
  tiles: string;
  tileSize: number;
  minzoom?: number;
  maxzoom?: number;
  opacity: number;
  attribution: string;
}

export const RASTERS: RasterDef[] = [
  {
    id: "paving",
    tiles: wms("NLCD_2021_Impervious_L48"),
    tileSize: 256,
    opacity: 0.6,
    attribution: "NLCD 2021 impervious surface, USGS / MRLC",
  },
  {
    id: "canopy",
    tiles: wms("nlcd_tcc_conus_2021_v2021-4"),
    tileSize: 256,
    opacity: 0.6,
    attribution: "NLCD 2021 tree canopy, USFS / MRLC",
  },
  ...([1, 3, 6] as const).map(
    (ft): RasterDef => ({
      id: `slr${ft}`,
      tiles: `https://coast.noaa.gov/arcgis/rest/services/dc_slr/slr_${ft}ft/MapServer/tile/{z}/{y}/{x}`,
      tileSize: 256,
      maxzoom: 16,
      opacity: 0.6,
      attribution: "Sea level rise, NOAA Office for Coastal Management",
    }),
  ),
  {
    id: "fema",
    // One 512 px image per tile instead of four 256 px ones: this server drops bursts.
    tiles:
      `${NFHL}/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=512,512` +
      `&layers=show:28&format=png32&transparent=true&f=image`,
    tileSize: 512,
    minzoom: 11,
    opacity: 0.6,
    attribution: "Flood zones, FEMA National Flood Hazard Layer",
  },
  {
    // USGS landslide susceptibility, Mirus et al. 2024, 90 m; cached tiles to
    // level 12, drawn larger past that. Found through USGS's own viewer
    // (docs/design/map-first-brief.md s.6). CC0.
    id: "landslide",
    tiles: "https://tiles.arcgis.com/tiles/v01gqwM5QqNysAAi/arcgis/rest/services/US_Landslide_Susceptibility/MapServer/tile/{z}/{y}/{x}",
    tileSize: 256,
    maxzoom: 12,
    opacity: 0.55,
    attribution: "Landslide susceptibility, USGS (Mirus et al. 2024)",
  },
  {
    // USGS Quaternary Fault and Fold Database, 2020 release: the national
    // layer (21) and fault areas (22).
    id: "faults",
    tiles:
      "https://earthquake.usgs.gov/arcgis/rest/services/haz/Qfaults/MapServer/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857" +
      "&size=512,512&layers=show:21,22&format=png32&transparent=true&f=image",
    tileSize: 512,
    minzoom: 6,
    opacity: 0.9,
    attribution: "Quaternary faults, USGS",
  },
];

const USGS = "https://basemap.nationalmap.gov/arcgis/rest/services";

/**
 * The base map: aerial imagery from USGS The National Map (USDA NAIP and
 * others, per the service's own credit, opened 18 November 2026), public
 * domain and keyless, drawn in black and white. It is the only base map
 * (Kyle, 18 November 2026: "just the black and white aerial"), so the
 * coloured layers on top (FEMA's zones, the pins) are what the eye goes to.
 */
export const BASE_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    aerial: {
      type: "raster",
      tiles: [`${USGS}/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}`],
      tileSize: 256,
      maxzoom: 16,
      attribution: "Imagery: USDA, USGS The National Map: Orthoimagery",
    },
  },
  layers: [{ id: "aerial", type: "raster", source: "aerial", paint: { "raster-saturation": -1 } }],
};

/** A mouse wheel or trackpad zooms the map directly. On a touch screen one
 *  finger still scrolls the page and two move the map, so a phone is never
 *  trapped inside it. */
export function needsTwoFingers(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
}

const NEAR_ZOOM = 14.6;
const TRACK_ZOOM = 6.2;
const RING_METRES = 500;

// Ink and paper, as in src/styles/tokens.css. A map paint property cannot read
// a CSS variable, so the two values are repeated here.
const INK = "#141414";
const PAPER = "#f5f5f4";

function ring(centre: LatLon, metres: number): GeoJSON.Feature<GeoJSON.LineString> {
  const pts: [number, number][] = [];
  const dLat = metres / 111_320;
  const dLon = metres / (111_320 * Math.cos((centre.lat * Math.PI) / 180));
  for (let i = 0; i <= 72; i++) {
    const a = (i / 72) * 2 * Math.PI;
    pts.push([centre.lon + dLon * Math.cos(a), centre.lat + dLat * Math.sin(a)]);
  }
  return { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: pts } };
}

export interface TrackLine {
  id: string;
  label: string;
  lines: [number, number][][];
}

type Slr = "off" | "slr1" | "slr3" | "slr6";

const SLR_OPTIONS: { value: Slr; label: string }[] = [
  { value: "off", label: "Off" },
  { value: "slr1", label: "1 ft" },
  { value: "slr3", label: "3 ft" },
  { value: "slr6", label: "6 ft" },
];

/* ---- what /api/inspect returns ---- */
type Item<T> = { value: T } | { error: string };
export interface Spot {
  zone: Item<{ code: string; subtype: string | null; inSfha: boolean } | null>;
  elevation: Item<{ feet: number; metres: number; resolutionM: number | null; surveyYear: number | null }>;
  canopy: Item<number | null>;
  paving: Item<number | null>;
  /** Added with the map-first home (docs/design/map-first-brief.md s.6). */
  fault?: Item<{ name: string; age: string; km: number; url: string | null } | null>;
  slides?: Item<number>;
  soil?: Item<{ name: string; drainage: string | null; hydroGroup: string | null; flooding: string | null; hydricPct: number | null } | null>;
  wind?: Item<{ tract: string; tornado: number | null; strongWind: number | null; hurricane: number | null; version: string | null } | null>;
}
type SpotState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "failed"; reason: string }
  | { status: "done"; spot: Spot };

function SpotRow({ label, children, source }: { label: string; children: React.ReactNode; source: string }) {
  return (
    <div className="spot-row">
      <dt>{label}</dt>
      <dd>
        <span className="spot-value">{children}</span>
        <small>{source}</small>
      </dd>
    </div>
  );
}

function missing(reason: string) {
  return <span className="spot-missing">No answer. {reason}</span>;
}

/** What public sources say at one point, as /api/inspect returns it. */
export function SpotList({ spot }: { spot: Spot }) {
  return (
    <dl className="spot-list">
      <SpotRow label="FEMA flood zone" source="FEMA National Flood Hazard Layer">
        {"error" in spot.zone ? (
          missing(spot.zone.error)
        ) : spot.zone.value === null ? (
          "Not mapped"
        ) : (
          <>
            Zone {spot.zone.value.code}
            {spot.zone.value.inSfha
              ? " · Special Flood Hazard Area"
              : spot.zone.value.subtype
                ? ` · ${spot.zone.value.subtype.toLowerCase()}`
                : ""}
          </>
        )}
      </SpotRow>
      <SpotRow
        label="Ground elevation"
        source={
          "error" in spot.elevation
            ? "USGS 3D Elevation Program"
            : `USGS 3D Elevation Program${spot.elevation.value.surveyYear ? `, surveyed ${spot.elevation.value.surveyYear}` : ""}`
        }
      >
        {"error" in spot.elevation
          ? missing(spot.elevation.error)
          : `${spot.elevation.value.feet.toFixed(1)} ft (${spot.elevation.value.metres.toFixed(1)} m)`}
      </SpotRow>
      <SpotRow label="Tree canopy" source="National Land Cover Database 2021">
        {"error" in spot.canopy
          ? missing(spot.canopy.error)
          : spot.canopy.value === null
            ? "Not mapped here"
            : `${spot.canopy.value}% of the land cover cell`}
      </SpotRow>
      <SpotRow label="Paving and buildings" source="National Land Cover Database 2021">
        {"error" in spot.paving
          ? missing(spot.paving.error)
          : spot.paving.value === null
            ? "Not mapped here"
            : `${spot.paving.value}% of the land cover cell`}
      </SpotRow>
      {spot.fault && (
        <SpotRow label="Nearest mapped fault" source="USGS Quaternary Fault and Fold Database, 2020">
          {"error" in spot.fault
            ? missing(spot.fault.error)
            : spot.fault.value === null
              ? `None mapped within ${FAULT_SEARCH_KM} km`
              : `${spot.fault.value.name}, ${spot.fault.value.km < 1 ? "under 1" : spot.fault.value.km.toFixed(1)} km away${spot.fault.value.age ? ` · last moved: ${spot.fault.value.age}` : ""}`}
        </SpotRow>
      )}
      {spot.slides && (
        <SpotRow label="Landslides mapped nearby" source="USGS U.S. Landslide Inventory, version 3">
          {"error" in spot.slides
            ? missing(spot.slides.error)
            : spot.slides.value === 0
              ? `None within ${SLIDE_RADIUS_KM} km`
              : `${spot.slides.value} within ${SLIDE_RADIUS_KM} km`}
        </SpotRow>
      )}
      {spot.soil && (
        <SpotRow label="Soil" source="USDA NRCS soil survey (SSURGO)">
          {"error" in spot.soil
            ? missing(spot.soil.error)
            : spot.soil.value === null
              ? "Not surveyed here"
              : [
                  spot.soil.value.name,
                  spot.soil.value.drainage && spot.soil.value.drainage.toLowerCase(),
                  spot.soil.value.hydroGroup && `water soaks in: group ${spot.soil.value.hydroGroup} (A fast, D slow)`,
                  spot.soil.value.flooding && spot.soil.value.flooding !== "None" && `floods: ${spot.soil.value.flooding.toLowerCase()}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
        </SpotRow>
      )}
      {spot.wind && (
        <SpotRow
          label="Wind events, this census tract"
          source={`FEMA National Risk Index${"error" in spot.wind || !spot.wind.value?.version ? "" : `, ${spot.wind.value.version}`}; counts for the whole tract`}
        >
          {"error" in spot.wind
            ? missing(spot.wind.error)
            : spot.wind.value === null
              ? "No tract found"
              : [
                  ["Tornado", spot.wind.value.tornado],
                  ["Strong wind", spot.wind.value.strongWind],
                  ["Hurricane", spot.wind.value.hurricane],
                ]
                  .map(([name, f]) => `${name}: ${perYear(f as number | null) ?? "not rated"}`)
                  .join(" · ")}
        </SpotRow>
      )}
    </dl>
  );
}

function SpotPanel({ state, onCentre }: { state: SpotState; onCentre: () => void }) {
  return (
    <section className="spot-panel" aria-live="polite">
      <div className="kicker">at this spot</div>
      {state.status === "idle" && (
        <p className="spot-hint">
          <strong>Click anywhere on the map</strong> to read the flood zone, the ground&apos;s height, the tree
          canopy and the paving at that spot.
        </p>
      )}
      {state.status === "loading" && <p className="spot-hint">Asking FEMA, USGS, the soil survey and the land cover survey…</p>}
      {state.status === "failed" && <p className="spot-hint">{state.reason}</p>}
      {state.status === "done" && (
        <SpotList spot={state.spot} />
      )}
      <div className="spot-foot">
        <button type="button" className="btn btn-sm" onClick={onCentre}>
          Read the middle of this place
        </button>
        <small>Read from public sources as published. The spot you click is not stored.</small>
      </div>
    </section>
  );
}

export function PlaceMap({
  slug,
  place,
  tracks,
  aside,
}: {
  slug: string;
  place: LatLon;
  tracks: TrackLine[];
  /** Shown at the top of the column beside the map: the place page's one line per hazard. */
  aside?: ReactNode;
}) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MlMap | null>(null);
  const pinRef = useRef<Marker | null>(null);
  const askRef = useRef(0);
  const centreRef = useRef<LatLon>(place);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [mine, setMine] = useState<PlacePoint | null>(null);
  const [spot, setSpot] = useState<SpotState>({ status: "idle" });

  const [fema, setFema] = useState(true);
  const [slr, setSlr] = useState<Slr>("off");
  const [canopy, setCanopy] = useState(false);
  const [paving, setPaving] = useState(false);
  const [showTracks, setShowTracks] = useState(false);
  const [landslide, setLandslide] = useState(false);
  const [faults, setFaults] = useState(false);

  /** Ask the server about one spot. Only the newest question's answer is shown. */
  const inspect = useCallback(async (p: LatLon) => {
    const asked = ++askRef.current;
    setSpot({ status: "loading" });
    try {
      const res = await fetch("/api/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
      });
      const body = (await res.json()) as Spot & { error?: string };
      if (asked !== askRef.current) return;
      if (!res.ok) setSpot({ status: "failed", reason: body.error ?? "That spot could not be read. Try again." });
      else setSpot({ status: "done", spot: body });
    } catch {
      if (asked === askRef.current) setSpot({ status: "failed", reason: "That spot could not be read. Check your connection." });
    }
  }, []);

  useEffect(() => {
    let dead = false;
    let map: MlMap | null = null;

    (async () => {
      const box = boxRef.current;
      if (!box) return;
      try {
        const maplibre = await import("maplibre-gl");
        if (dead) return;
        // The worker is served by this site: scripts/copy-map-worker.mjs.
        maplibre.setWorkerUrl(`/vendor/maplibre-gl-worker.mjs?v=${maplibre.getVersion()}`);

        const point = recallPoint(slug);
        const centre: LatLon = point ?? place;
        centreRef.current = centre;
        setMine(point);

        map = new maplibre.Map({
          container: box,
          style: BASE_STYLE,
          center: [centre.lon, centre.lat],
          zoom: NEAR_ZOOM,
          minZoom: 4,
          maxZoom: 17,
          cooperativeGestures: needsTwoFingers(),
          attributionControl: { compact: true },
          // Keeps the drawn map available to the browser's print and save.
          canvasContextAttributes: { preserveDrawingBuffer: true },
        });
        mapRef.current = map;
        map.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right");
        map.addControl(new maplibre.ScaleControl({ unit: "imperial" }), "bottom-left");

        const pinEl = document.createElement("div");
        pinEl.className = "place-map-pin";
        pinEl.setAttribute("aria-hidden", "true");
        const pin = new maplibre.Marker({ element: pinEl });
        pinRef.current = pin;

        map.on("click", (e) => {
          if (!map) return;
          const p = { lat: e.lngLat.lat, lon: e.lngLat.lng };
          pin.setLngLat([p.lon, p.lat]).addTo(map);
          void inspect(p);
        });

        map.on("load", () => {
          if (dead || !map) return;
          for (const r of RASTERS) {
            map.addSource(r.id, {
              type: "raster",
              tiles: [r.tiles],
              tileSize: r.tileSize,
              ...(r.minzoom ? { minzoom: r.minzoom } : {}),
              ...(r.maxzoom ? { maxzoom: r.maxzoom } : {}),
              attribution: r.attribution,
            });
            map.addLayer({
              id: r.id,
              type: "raster",
              source: r.id,
              layout: { visibility: r.id === "fema" ? "visible" : "none" },
              paint: { "raster-opacity": r.opacity },
            });
          }

          map.addSource("tracks", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: tracks.map((t) => ({
                type: "Feature",
                properties: { label: t.label },
                geometry: { type: "MultiLineString", coordinates: t.lines },
              })),
            },
          });
          map.addLayer({
            id: "tracks",
            type: "line",
            source: "tracks",
            layout: { visibility: "none", "line-join": "round", "line-cap": "round" },
            paint: { "line-color": INK, "line-width": 1.2, "line-opacity": 0.55 },
          });

          map.addSource("ring", { type: "geojson", data: ring(centre, RING_METRES) });
          map.addLayer({
            id: "ring-halo",
            type: "line",
            source: "ring",
            paint: { "line-color": PAPER, "line-width": 4, "line-opacity": 0.9 },
          });
          map.addLayer({
            id: "ring",
            type: "line",
            source: "ring",
            paint: { "line-color": INK, "line-width": 1.5, "line-dasharray": [3, 2] },
          });

          if (point) {
            const el = document.createElement("div");
            el.className = "place-map-mark";
            el.setAttribute("aria-hidden", "true");
            new maplibre.Marker({ element: el }).setLngLat([point.lon, point.lat]).addTo(map);
          }
          setReady(true);
        });

        // A tile that fails to load is not a broken map: the agencies' servers
        // are busy at times. The layer simply has a gap until it is asked again.
        map.on("error", () => {});
      } catch {
        if (!dead) setFailed(true);
      }
    })();

    return () => {
      dead = true;
      mapRef.current = null;
      pinRef.current = null;
      map?.remove();
    };
    // The map is built once per place. Track data arrives with the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const show = (id: string, on: boolean) => map.setLayoutProperty(id, "visibility", on ? "visible" : "none");
    show("fema", fema);
    show("canopy", canopy);
    show("paving", paving);
    show("slr1", slr === "slr1");
    show("slr3", slr === "slr3");
    show("slr6", slr === "slr6");
    show("tracks", showTracks);
    show("landslide", landslide);
    show("faults", faults);
  }, [ready, fema, canopy, paving, slr, showTracks, landslide, faults]);

  // Storm tracks are a regional picture; the other layers are a neighbourhood one.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    map.easeTo({ zoom: showTracks ? TRACK_ZOOM : NEAR_ZOOM, duration: 600 });
  }, [ready, showTracks]);

  // Keep the ring on the exact point when there is one.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !mine) return;
    (map.getSource("ring") as GeoJSONSource | undefined)?.setData(ring(mine, RING_METRES));
  }, [ready, mine]);

  const readCentre = useCallback(() => {
    const c = centreRef.current;
    const map = mapRef.current;
    if (map && pinRef.current) pinRef.current.setLngLat([c.lon, c.lat]).addTo(map);
    void inspect(c);
  }, [inspect]);

  return (
    <div className="place-map-wrap">
      <div className="place-map-frame">
        <div ref={boxRef} className="place-map" role="region" aria-label="Map of the neighbourhood with public map layers. Click a spot to read what is on record there." />
        {failed && (
          <p className="place-map-failed">
            The map could not start in this browser. The records below do not depend on it.
          </p>
        )}
      </div>

      <aside className="place-side">
        {aside}
        <SpotPanel state={spot} onCentre={readCentre} />

        <section className="place-layers">
          <div className="kicker">public map layers</div>
          <label className="place-layer">
            <input type="checkbox" checked={fema} onChange={(e) => setFema(e.target.checked)} />
            <span>
              <strong>FEMA flood zones</strong>
              <small>FEMA&apos;s flood map, in FEMA&apos;s own colours and labels. Shown when zoomed in.</small>
            </span>
          </label>
          <div className="place-layer">
            <span>
              <strong id="slr-label">Sea level rise</strong>
              <small>Where NOAA maps the sea at the highest tides if it stood this much higher than today.</small>
              <span className="place-seg" role="radiogroup" aria-labelledby="slr-label">
                {SLR_OPTIONS.map((o) => (
                  <label key={o.value} data-on={slr === o.value ? "true" : undefined}>
                    <input
                      type="radio"
                      name="slr"
                      value={o.value}
                      checked={slr === o.value}
                      onChange={() => setSlr(o.value)}
                    />
                    {o.label}
                  </label>
                ))}
              </span>
            </span>
          </div>
          <label className="place-layer">
            <input type="checkbox" checked={showTracks} onChange={(e) => setShowTracks(e.target.checked)} />
            <span>
              <strong>Storm tracks</strong>
              <small>
                {tracks.length
                  ? "Paths of the tropical storms and hurricanes listed below. The map zooms out to show them."
                  : "NOAA's record has no tropical storm or hurricane track near this place."}
              </small>
            </span>
          </label>
          <label className="place-layer">
            <input type="checkbox" checked={canopy} onChange={(e) => setCanopy(e.target.checked)} />
            <span>
              <strong>Tree canopy</strong>
              <small>National land cover survey, 2021. Lower 48 states.</small>
            </span>
          </label>
          <label className="place-layer">
            <input type="checkbox" checked={paving} onChange={(e) => setPaving(e.target.checked)} />
            <span>
              <strong>Paving and buildings</strong>
              <small>Share of ground that sheds water, national land cover survey, 2021. Lower 48 states.</small>
            </span>
          </label>
          <label className="place-layer">
            <input type="checkbox" checked={landslide} onChange={(e) => setLandslide(e.target.checked)} />
            <span>
              <strong>Landslide susceptibility</strong>
              <small>USGS, 2024: how prone the slopes are, yellow (lower) to red (higher), at 90 m.</small>
            </span>
          </label>
          <label className="place-layer">
            <input type="checkbox" checked={faults} onChange={(e) => setFaults(e.target.checked)} />
            <span>
              <strong>Faults</strong>
              <small>USGS: faults that have moved in the last 1.6 million years.</small>
            </span>
          </label>

          <p className="place-map-note">
            The dashed ring is 500 m (about a third of a mile) out from the middle of this place.{" "}
            {mine
              ? `The dot marks ${mine.matched || "the address you searched"}. Only this browser tab can see it.`
              : "It is centred on the block, not on a house."}
          </p>
          <p className="place-map-note">
            Every layer is a public map as its publisher draws it. None of it is SPARC Labs model output.
          </p>
        </section>
      </aside>
    </div>
  );
}
