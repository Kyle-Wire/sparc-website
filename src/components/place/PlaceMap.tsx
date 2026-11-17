"use client";

import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Map as MlMap, GeoJSONSource, StyleSpecification } from "maplibre-gl";
import type { LatLon } from "@/lib/place/coords";
import { recallPoint, type PlacePoint } from "./place-point";

/**
 * The neighbourhood map: the place at the centre, public layers on top.
 *
 * Every layer here is a published public map drawn as its publisher draws it.
 * Nothing on this map is SPARC Labs model output, and the caption under the
 * map says so. Tiles are fetched by the visitor's browser straight from the
 * agencies (USGS, FEMA, NOAA, MRLC); the hosts are listed in next.config.ts.
 *
 * The exact point a visitor searched for is read from this browser tab's own
 * storage and marked for them alone. A visitor who opens a shared link sees
 * the block ring and no mark.
 */

const NFHL = "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer";
const MRLC = "https://www.mrlc.gov/geoserver/mrlc_display/wms";

function wms(layer: string): string {
  return (
    `${MRLC}?service=WMS&version=1.1.1&request=GetMap&layers=${layer}&styles=` +
    `&format=image/png&transparent=true&srs=EPSG:3857&width=256&height=256&bbox={bbox-epsg-3857}`
  );
}

type LayerId = "fema" | "slr1" | "slr3" | "slr6" | "canopy" | "paving" | "tracks";

interface RasterDef {
  id: Exclude<LayerId, "tracks">;
  tiles: string;
  tileSize: number;
  minzoom?: number;
  maxzoom?: number;
  opacity: number;
  attribution: string;
}

const RASTERS: RasterDef[] = [
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
];

const BASE_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    base: {
      type: "raster",
      tiles: ["https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}"],
      tileSize: 256,
      maxzoom: 16,
      attribution: "Base map: USGS The National Map",
    },
  },
  layers: [{ id: "base", type: "raster", source: "base" }],
};

const NEAR_ZOOM = 14.6;
const TRACK_ZOOM = 6.2;
const RING_METRES = 500;

// Ink and paper, as in src/styles/tokens.css. A map paint property cannot read
// a CSS variable, so the two values are repeated here.
const INK = "#1a1416";
const PAPER = "#f7f4ee";

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

const SLR_OPTIONS: { value: "off" | "slr1" | "slr3" | "slr6"; label: string }[] = [
  { value: "off", label: "Off" },
  { value: "slr1", label: "1 ft" },
  { value: "slr3", label: "3 ft" },
  { value: "slr6", label: "6 ft" },
];

export function PlaceMap({ slug, place, tracks }: { slug: string; place: LatLon; tracks: TrackLine[] }) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MlMap | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [mine, setMine] = useState<PlacePoint | null>(null);

  const [fema, setFema] = useState(true);
  const [slr, setSlr] = useState<"off" | "slr1" | "slr3" | "slr6">("off");
  const [canopy, setCanopy] = useState(false);
  const [paving, setPaving] = useState(false);
  const [showTracks, setShowTracks] = useState(false);

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
        setMine(point);

        map = new maplibre.Map({
          container: box,
          style: BASE_STYLE,
          center: [centre.lon, centre.lat],
          zoom: NEAR_ZOOM,
          minZoom: 4,
          maxZoom: 17,
          cooperativeGestures: true,
          attributionControl: { compact: true },
        });
        mapRef.current = map;
        map.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right");
        map.addControl(new maplibre.ScaleControl({ unit: "imperial" }), "bottom-left");

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
            paint: { "line-color": INK, "line-width": 1.4, "line-opacity": 0.75 },
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
  }, [ready, fema, canopy, paving, slr, showTracks]);

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

  return (
    <div className="place-map-wrap">
      <div className="place-map-frame">
        <div ref={boxRef} className="place-map" role="region" aria-label="Map of the neighbourhood with public map layers" />
        {failed && (
          <p className="place-map-failed">
            The map could not start in this browser. The records below do not depend on it.
          </p>
        )}
      </div>

      <div className="place-layers">
        <div className="kicker">public map layers</div>
        <label className="place-layer">
          <input type="checkbox" checked={fema} onChange={(e) => setFema(e.target.checked)} />
          <span>
            <strong>FEMA flood zones</strong>
            <small>FEMA&apos;s flood map, in FEMA&apos;s own colours. Shown when zoomed in.</small>
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

        <p className="place-map-note">
          The dashed ring is 500 m (about a third of a mile) out from the middle of this place.{" "}
          {mine
            ? `The dot marks ${mine.matched || "the address you searched"}. Only this browser tab can see it.`
            : "It is centred on the block, not on a house."}
        </p>
        <p className="place-map-note">
          Every layer is a public map as its publisher draws it. None of it is SPARC Labs model output.
        </p>
      </div>
    </div>
  );
}
