"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Map as MlMap, GeoJSONSource, Marker } from "maplibre-gl";
import { PlaceSearch, type FoundPlace } from "@/components/place/PlaceSearch";
import { rememberPoint } from "@/components/place/place-point";
import { placeSlug } from "@/lib/place/coords";
import { BASE_STYLE, RASTERS, SpotList, needsTwoFingers, type Spot } from "@/components/place/PlaceMap";
import { MapLegend } from "@/components/map/MapLegend";
import { layerInfo } from "@/lib/map-legends";
import { DEFAULT_STORM, HAZARD_STATE_WORDS, floodSortName, type BlockReadings, type HazardState } from "@/lib/listings/blocks";
import type { PublicListing } from "@/lib/listings/feed";

/**
 * The home page is a map, and only a map (Climate Inspection D42,
 * SPEC-LISTINGS.md §1; docs/design/map-first-brief.md s.3). It fills the
 * screen. The logo, one search bar and the menu float on it; layers, homes
 * for sale and a short explainer open from chips. A click drops a pin and
 * opens a card of what public records say at that spot.
 *
 * Homes for sale are loaded only when a visitor asks for an area, because
 * each new ZIP code area spends one of the month's few feed requests. A
 * listing's panel keeps three things apart: the listing as its feed gave it,
 * the free public record for its block, and the house's own report. Nothing
 * on the panel calls a home safe; model values are for subscribers and are
 * labelled exploratory.
 */

type Listing = PublicListing & { slug: string };

interface AreaAnswer {
  zip: string;
  status: "kept" | "fetched" | "budget_spent" | "day_spent" | "zip_recent" | "feed_not_connected" | "store_not_connected" | "failed";
  fetchedAt: string | null;
  source: string;
  listings: Listing[];
  sort: { name: string; order: { key: string; depth_cm: number; spread_cm: [number, number] | null }[]; leftOut: number } | null;
  budget: { cap: number; days: number; used: number | null };
}

interface BlockAnswer {
  slug: string;
  place: string | null;
  states: Record<string, HazardState>;
  subscriber: boolean;
  readings: BlockReadings | null;
}

type Load<T> = { status: "idle" } | { status: "loading" } | { status: "failed"; reason: string } | { status: "done"; data: T };

export const US_VIEW = { center: [-98.35, 39.5] as [number, number], zoom: 3.4 };
/** Below this the map shows too wide an area to be one ZIP code. */
const LISTINGS_ZOOM = 12;
const HAZARD_NAMES: Record<string, string> = { flood: "Flood", heat: "Heat", ground: "Ground movement", wind: "Wind" };

const usd = (n: number | null) => (n === null ? "—" : `$${n.toLocaleString("en-US")}`);
const plain = (n: number | null, unit = "") => (n === null ? "—" : `${n.toLocaleString("en-US")}${unit}`);
const longDay = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }) : "";

function areaLine(a: AreaAnswer): string {
  const n = a.listings.length;
  const homes = `${n.toLocaleString("en-US")} ${n === 1 ? "home" : "homes"} for sale in ZIP ${a.zip}`;
  switch (a.status) {
    case "kept":
    case "fetched":
      return `${homes}, from ${a.source}, as of ${longDay(a.fetchedAt)}.`;
    case "budget_spent":
      return n
        ? `${homes}, from ${a.source}, as of ${longDay(a.fetchedAt)}. Newer listings for this area load next month.`
        : "Listings for this area load next month.";
    case "day_spent":
      return n
        ? `${homes}, from ${a.source}, as of ${longDay(a.fetchedAt)}. Newer listings for this area load tomorrow.`
        : "Today's listings requests are used. Listings for this area load tomorrow.";
    case "zip_recent":
      return n
        ? `${homes}, from ${a.source}, as of ${longDay(a.fetchedAt)}.`
        : "The listings feed did not answer for this area today. It is tried again tomorrow.";
    case "feed_not_connected":
    case "store_not_connected":
      return "Homes for sale are not connected on this site yet. Searching an address still works everywhere.";
    case "failed":
      return "The listings feed did not answer. Try again later.";
  }
}

function ListingPanel({ listing, onClose }: { listing: Listing; onClose: () => void }) {
  // The panel is keyed by listing, so each listing starts here afresh.
  const [spot, setSpot] = useState<Load<Spot>>({ status: listing.screening_hidden ? "idle" : "loading" });
  const [block, setBlock] = useState<Load<BlockAnswer>>({ status: listing.screening_hidden ? "idle" : "loading" });

  useEffect(() => {
    if (listing.screening_hidden) return;
    let live = true;
    const [lat, lon] = listing.slug.split(",").map(Number);
    const post = (url: string, body: unknown) =>
      fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(
        async (r) => ({ ok: r.ok, body: await r.json() }),
      );
    post("/api/inspect", { lat, lon })
      .then((r) => live && setSpot(r.ok ? { status: "done", data: r.body as Spot } : { status: "failed", reason: r.body.error ?? "No answer." }))
      .catch(() => live && setSpot({ status: "failed", reason: "Check your connection." }));
    post("/api/listings/block", { slug: listing.slug })
      .then((r) => live && setBlock(r.ok ? { status: "done", data: r.body as BlockAnswer } : { status: "failed", reason: r.body.error ?? "No answer." }))
      .catch(() => live && setBlock({ status: "failed", reason: "Check your connection." }));
    return () => {
      live = false;
    };
  }, [listing.slug, listing.screening_hidden]);

  const reportHref = {
    pathname: "/start",
    query: { place: listing.slug, hazard: ["flood", "heat", "ground", "wind"] },
  } as const;

  return (
    <aside className="listing-panel" aria-label="The listing you picked">
      <div className="listing-panel-head">
        <span className="kicker">a home for sale</span>
        <button type="button" className="btn btn-sm" onClick={onClose}>
          Close
        </button>
      </div>

      <section className="listing-part">
        <h3>The listing</h3>
        <p className="listing-price">{usd(listing.ListPrice)}</p>
        <p className="listing-address">{listing.UnparsedAddress ?? "Address not given"}</p>
        <dl className="listing-facts">
          <div><dt>Beds</dt><dd>{plain(listing.BedroomsTotal)}</dd></div>
          <div><dt>Baths</dt><dd>{plain(listing.BathroomsTotalDecimal)}</dd></div>
          <div><dt>Living area</dt><dd>{plain(listing.LivingArea, " sq ft")}</dd></div>
          <div><dt>Built</dt><dd>{listing.YearBuilt ?? "—"}</dd></div>
          <div><dt>Type</dt><dd>{listing.PropertyType ?? "—"}</dd></div>
          <div><dt>Status</dt><dd>{listing.StandardStatus ?? "—"}</dd></div>
          <div><dt>Days listed</dt><dd>{plain(listing.DaysOnMarket)}</dd></div>
        </dl>
        <p className="listing-source">
          Listed by {listing.ListOfficeName ?? "a broker not named"}
          {listing.ListAgentFullName ? ` (${listing.ListAgentFullName})` : ""}
          {listing.OriginatingSystemName ? ` · ${listing.OriginatingSystemName}` : ""}
          {listing.ListingId ? ` #${listing.ListingId}` : ""}. Shown as {listing.source} gave it on {longDay(listing.fetched_at)}. No
          figure here is ours.
        </p>
      </section>

      <section className="listing-part">
        <h3>This block · free</h3>
        <p className="listing-note">The block, not this house. Every home in the block reads the same.</p>
        {listing.screening_hidden ? (
          <p>The seller has asked for our screening to be switched off on this listing.</p>
        ) : (
          <>
            {spot.status === "loading" && <p className="spot-hint">Asking FEMA, USGS and the land cover survey…</p>}
            {spot.status === "failed" && <p className="spot-hint">{spot.reason}</p>}
            {spot.status === "done" && <SpotList spot={spot.data} />}
            <div className="listing-models">
              <div className="kicker">our models at this block</div>
              {block.status === "loading" && <p className="spot-hint">Checking…</p>}
              {block.status === "failed" && <p className="spot-hint">{block.reason}</p>}
              {block.status === "done" && <BlockModels answer={block.data} />}
            </div>
            <Link href={`/place/${listing.slug}` as Route} className="listing-link">
              The full public record for this block <span className="arrow">→</span>
            </Link>
          </>
        )}
      </section>

      <section className="listing-part">
        <h3>This house</h3>
        <p className="listing-note">
          Our flood, heat, ground movement and wind models, worked out for this house. Built for you alone and never
          posted on the map.
        </p>
        <Link href={reportHref} className="btn btn-accent btn-sm">
          Get this house&apos;s report <span className="arrow">→</span>
        </Link>
      </section>
    </aside>
  );
}

function BlockModels({ answer }: { answer: BlockAnswer }) {
  const r = answer.readings;
  const storm = r?.flood?.[DEFAULT_STORM];
  return (
    <>
      <ul className="listing-states">
        {Object.entries(answer.states).map(([h, s]) => (
          <li key={h}>
            <span>{HAZARD_NAMES[h] ?? h}</span>
            <span>
              {s === "modelled" && !answer.subscriber ? "Modelled at this block · for subscribers" : HAZARD_STATE_WORDS[s]}
            </span>
          </li>
        ))}
      </ul>
      {r && (
        <div className="listing-readings">
          {storm && <p>{storm.statement}</p>}
          {r.heat && <p>{r.heat.statement}</p>}
          <p className="listing-note">For the block&apos;s open ground, not this house.</p>
        </div>
      )}
    </>
  );
}

type LayerId = "fema" | "landslide" | "faults";

/** The layers a visitor can switch on, and what each says it is. FEMA's
 *  zones are on at start; the rest wait to be asked for (brief s.3). */
const LAYERS: { id: LayerId; name: string; note: string; group: "Flood" | "Ground" }[] = [
  { id: "fema", name: "FEMA flood zones", note: "FEMA's map for insurance and building rules. Not a forecast.", group: "Flood" },
  {
    id: "landslide",
    name: "Landslide susceptibility",
    note: "USGS, 2024: how prone the slopes are, from yellow (lower) to red (higher), at 90 m. About the area, not the lot.",
    group: "Ground",
  },
  {
    id: "faults",
    name: "Faults",
    note: "USGS: faults that have moved in the last 1.6 million years. Shown from state zoom.",
    group: "Ground",
  },
];

function LayersPanel(props: { on: Record<LayerId, boolean>; onToggle: (id: LayerId, v: boolean) => void; zoom: number }) {
  const femaMin = RASTERS.find((r) => r.id === "fema")?.minzoom ?? 11;
  return (
    <div className="map-panel-body">
      {(["Flood", "Ground"] as const).map((g) => (
        <div key={g} className="map-legend-group">
          <div className="kicker">{g}</div>
          {LAYERS.filter((l) => l.group === g).map((l) => (
            <div key={l.id} className="map-layer">
              <label className="map-legend-check map-legend-title">
                <input type="checkbox" checked={props.on[l.id]} onChange={(e) => props.onToggle(l.id, e.target.checked)} /> {l.name}
              </label>
              {!props.on[l.id] && <p className="map-legend-note">{l.note}</p>}
              {props.on[l.id] && l.id === "fema" && props.zoom < femaMin && <p className="map-legend-note">Zoom in to a town to see it.</p>}
              {props.on[l.id] && (
                <div className="map-layer-key">
                  <MapLegend layer={layerInfo(l.id)} />
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
      <div className="map-legend-group">
        <div className="kicker">On the map</div>
        <div className="map-legend-row">
          <span className="map-legend-ring" aria-hidden /> Your pin. Drag it to move it.
        </div>
        <div className="map-legend-row">
          <span className="map-legend-dot" aria-hidden /> A home for sale, where its listing places it
        </div>
      </div>
      <p className="map-legend-note">
        Soil and wind are read where you click: the soil survey&apos;s map unit at that spot, and how often FEMA counts
        tornadoes, strong wind and hurricanes in that census tract.
      </p>
    </div>
  );
}

function InfoPanel() {
  return (
    <div className="map-panel-body info-panel">
      <p>
        <strong>Click anywhere</strong> to drop a pin and see what public records say about that spot: flood zone, ground
        height, faults and landslides nearby, the soil, and how often wind storms reach the area.
      </p>
      <p>
        <strong>Free, no account.</strong> All of it comes from public agencies (FEMA, USGS, USDA, NOAA), read as they publish
        it. It describes the area around your pin, not the house itself.
      </p>
      <p>
        <strong>The SPARC Labs Field Kit</strong> is the paid part: our own flood, heat, ground movement and wind models, worked out for one house, with its report, atlas and maps. <Link href="/report/sample">See a sample</Link>.
      </p>
      <p>
        <Link href="/how-it-works">How it works</Link> · <Link href="/about">Who we are</Link> · <Link href="/data">Every source</Link>
      </p>
    </div>
  );
}

type SpotLoad = { status: "loading" } | { status: "failed"; reason: string } | { status: "done"; spot: Spot };

/** What is on record where the pin is, with the block link and one quiet report link. */
function SpotCard({ slug, matched, spot, onClose }: { slug: string; matched: string; spot: SpotLoad; onClose: () => void }) {
  return (
    <aside className="spot-card" aria-live="polite" aria-label="What is on record at your pin">
      <div className="listing-panel-head">
        <span className="kicker">at your pin · free</span>
        <button type="button" className="btn btn-sm btn-ghost" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>
      {matched && <p className="spot-card-where">{matched}</p>}
      {spot.status === "loading" && <p className="spot-hint">Asking FEMA, USGS, the soil survey and the land cover survey…</p>}
      {spot.status === "failed" && <p className="spot-hint">{spot.reason}</p>}
      {spot.status === "done" && <SpotList spot={spot.spot} />}
      <p className="listing-note">
        These records describe the area around the pin. They can&apos;t say how this house itself fares in a storm or a heat
        wave; the house report models that.
      </p>
      <div className="spot-card-links">
        <Link href={`/place/${slug}` as Route}>
          The full public record for this block <span className="arrow">→</span>
        </Link>
        <span className="spot-card-paid">
          <Link href={{ pathname: "/start", query: { place: slug } }}>Get the SPARC Field Kit</Link> ·{" "}
          <Link href="/report/sample">see a sample</Link>
        </span>
      </div>
    </aside>
  );
}

const MENU: { href: Route; label: string }[] = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/places", label: "Your places" },
  { href: "/models", label: "The models" },
  { href: "/pricing", label: "Pricing and the report" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];
const MENU_SMALL: { href: Route; label: string }[] = [
  { href: "/data", label: "Data sources" },
  { href: "/glossary", label: "Glossary" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

function MapMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  return (
    <div className="map-menu" ref={ref}>
      <button type="button" className="map-chip" aria-expanded={open} aria-controls="map-menu-list" onClick={() => setOpen(!open)}>
        Menu
      </button>
      {open && (
        <nav id="map-menu-list" className="map-menu-list" aria-label="Site">
          {MENU.map((m) => (
            <Link key={m.href} href={m.href}>
              {m.label}
            </Link>
          ))}
          <div className="map-menu-small">
            {MENU_SMALL.map((m) => (
              <Link key={m.href} href={m.href}>
                {m.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}

type Panel = "layers" | "homes" | "info" | null;

export interface StartView {
  center: [number, number];
  zoom: number;
  /** "near" when it came from the visitor's rough location. */
  from: "near" | "us";
}

export function HomeMap({ start }: { start: StartView }) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MlMap | null>(null);
  const [failed, setFailed] = useState(false);
  const [zoom, setZoom] = useState(start.zoom);
  const [area, setArea] = useState<Load<AreaAnswer>>({ status: "idle" });
  const [picked, setPicked] = useState<Listing | null>(null);
  const [layers, setLayers] = useState<Record<LayerId, boolean>>({ fema: true, landslide: false, faults: false });
  const [panel, setPanel] = useState<Panel>(null);
  const [pin, setPin] = useState<{ slug: string; matched: string; spot: SpotLoad } | null>(null);
  const [searchNote, setSearchNote] = useState(false);
  const listingsRef = useRef<Listing[]>([]);
  const searchPin = useRef<Marker | null>(null);
  const askId = useRef(0);

  const showPins = useCallback((listings: Listing[]) => {
    listingsRef.current = listings;
    const src = mapRef.current?.getSource("listings") as GeoJSONSource | undefined;
    src?.setData({
      type: "FeatureCollection",
      features: listings.map((l) => ({
        type: "Feature",
        properties: { key: l.listing_key },
        geometry: { type: "Point", coordinates: [l.Longitude as number, l.Latitude as number] },
      })),
    });
  }, []);

  /** The pin is where the visitor put it: that is the house, for this tab.
   *  Its exact point stays in this browser (place-point.ts); the spot is read
   *  from public sources through /api/inspect and not stored. */
  const pinAt = useCallback((p: { lat: number; lon: number }, matched = "") => {
    const slug = placeSlug(p);
    rememberPoint({ slug, ...p, matched: matched || "the pin you dropped" });
    const id = ++askId.current;
    setPicked(null);
    setPanel(null);
    setPin({ slug, matched, spot: { status: "loading" } });
    fetch("/api/inspect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) })
      .then(async (r) => ({ ok: r.ok, body: await r.json() }))
      .then((r) => {
        if (id !== askId.current) return;
        setPin((cur) =>
          cur && { ...cur, spot: r.ok ? { status: "done", spot: r.body as Spot } : { status: "failed", reason: r.body.error ?? "No answer." } },
        );
      })
      .catch(() => id === askId.current && setPin((cur) => cur && { ...cur, spot: { status: "failed", reason: "Check your connection." } }));
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
        maplibre.setWorkerUrl(`/vendor/maplibre-gl-worker.mjs?v=${maplibre.getVersion()}`);
        map = new maplibre.Map({
          container: box,
          style: BASE_STYLE,
          center: start.center,
          zoom: start.zoom,
          minZoom: 3,
          maxZoom: 17,
          cooperativeGestures: needsTwoFingers(),
          attributionControl: { compact: true },
        });
        mapRef.current = map;
        map.addControl(new maplibre.NavigationControl({ showCompass: false }), "bottom-right");
        map.addControl(new maplibre.ScaleControl({ unit: "imperial" }), "bottom-left");
        map.on("zoomend", () => map && setZoom(map.getZoom()));
        const pinEl = document.createElement("div");
        pinEl.className = "place-map-pin";
        pinEl.setAttribute("aria-hidden", "true");
        searchPin.current = new maplibre.Marker({ element: pinEl, draggable: true });
        searchPin.current.on("dragend", () => {
          const at = searchPin.current?.getLngLat();
          if (at) pinAt({ lat: at.lat, lon: at.lng });
        });
        map.on("load", () => {
          if (dead || !map) return;
          // Under FEMA's zones, so the zones stay readable where they overlap.
          for (const id of ["landslide", "faults", "fema"] as const) {
            const r = RASTERS.find((x) => x.id === id);
            if (!r) continue;
            map.addSource(id, { type: "raster", tiles: [r.tiles], tileSize: r.tileSize, minzoom: r.minzoom, maxzoom: r.maxzoom, attribution: r.attribution });
            map.addLayer({ id, type: "raster", source: id, paint: { "raster-opacity": r.opacity }, layout: { visibility: id === "fema" ? "visible" : "none" } });
          }
          map.addSource("listings", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
          map.addLayer({
            id: "listings",
            type: "circle",
            source: "listings",
            paint: {
              "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 4, 16, 8],
              "circle-color": "#141414",
              "circle-stroke-color": "#f5f5f4",
              "circle-stroke-width": 2,
            },
          });
          map.addLayer({
            id: "listings-picked",
            type: "circle",
            source: "listings",
            filter: ["==", ["get", "key"], ""],
            paint: {
              "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 7, 16, 12],
              "circle-color": "rgba(0,0,0,0)",
              "circle-stroke-color": "#141414",
              "circle-stroke-width": 3,
            },
          });
          map.on("click", "listings", (e) => {
            const key = e.features?.[0]?.properties?.key;
            const l = listingsRef.current.find((x) => x.listing_key === key);
            if (l) {
              setPin(null);
              setPicked(l);
            }
          });
          map.on("mouseenter", "listings", () => map && (map.getCanvas().style.cursor = "pointer"));
          map.on("mouseleave", "listings", () => map && (map.getCanvas().style.cursor = ""));
          // Any other click drops the pin there ("Both, pin first", brief s.3).
          map.on("click", (e) => {
            if (!map || map.queryRenderedFeatures(e.point, { layers: ["listings"] }).length) return;
            searchPin.current?.setLngLat(e.lngLat).addTo(map);
            setSearchNote(false);
            pinAt({ lat: e.lngLat.lat, lon: e.lngLat.lng });
          });
        });
      } catch {
        if (!dead) setFailed(true);
      }
    })();
    return () => {
      dead = true;
      map?.remove();
      mapRef.current = null;
    };
    // The start view is read once, when the map is made.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinAt]);

  useEffect(() => {
    const m = mapRef.current;
    if (!m) return;
    for (const [id, on] of Object.entries(layers)) {
      if (m.getLayer(id)) m.setLayoutProperty(id, "visibility", on ? "visible" : "none");
    }
  }, [layers]);

  useEffect(() => {
    const m = mapRef.current;
    if (m?.getLayer("listings-picked")) m.setFilter("listings-picked", ["==", ["get", "key"], picked?.listing_key ?? ""]);
  }, [picked]);

  function flyToFound(f: FoundPlace) {
    const m = mapRef.current;
    // Only a house gets the pin and the card. A street-level answer moves the
    // map to the street, closer in; the next click marks the house.
    const house = f.precision === "house";
    setSearchNote(!house);
    if (!m) return;
    if (house) {
      searchPin.current?.setLngLat([f.point.lon, f.point.lat]).addTo(m);
      pinAt(f.point, f.matched);
    } else {
      searchPin.current?.remove();
      setPin(null);
    }
    m.flyTo({ center: [f.point.lon, f.point.lat], zoom: house ? 16 : 16 });
  }

  async function loadHere() {
    const m = mapRef.current;
    if (!m) return;
    const c = m.getCenter();
    setArea({ status: "loading" });
    setPicked(null);
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: c.lat, lon: c.lng }),
      });
      const body = await res.json();
      if (!res.ok) {
        setArea({ status: "failed", reason: body.error ?? "The listings could not be loaded." });
        return;
      }
      setArea({ status: "done", data: body as AreaAnswer });
      showPins((body as AreaAnswer).listings);
    } catch {
      setArea({ status: "failed", reason: "Check your connection and try again." });
    }
  }

  function goToMe() {
    navigator.geolocation?.getCurrentPosition(
      (p) => mapRef.current?.flyTo({ center: [p.coords.longitude, p.coords.latitude], zoom: 14 }),
      () => undefined,
      { maximumAge: 600_000, timeout: 10_000 },
    );
  }

  const near = zoom >= LISTINGS_ZOOM;
  const sorted =
    area.status === "done" && area.data.sort
      ? area.data.sort.order
          .map((o) => ({ ...o, listing: area.data.listings.find((l) => l.listing_key === o.key) }))
          .filter((o) => o.listing)
      : null;
  const toggle = (p: Exclude<Panel, null>) => setPanel(panel === p ? null : p);

  return (
    <main id="main" className="home-full" aria-label="Map">
      <div ref={boxRef} className="home-full-map" />
      {failed && <p className="home-map-failed">The map could not start in this browser. The search still works.</p>}

      <header className="map-top">
        <Link className="map-logo" href="/" aria-label="SPARC Labs, home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/sparclabs-logo.png" alt="" height={34} />
        </Link>
        <div className="map-search">
          <h1 className="visually-hidden">See what is on public record about any US address</h1>
          <PlaceSearch compact bare onFound={flyToFound} />
          {searchNote && <p className="map-search-note">Click the house on the map to drop your pin on it.</p>}
          <div className="map-chips">
            <button type="button" className="map-chip" aria-expanded={panel === "layers"} onClick={() => toggle("layers")}>
              Layers
            </button>
            <button type="button" className="map-chip" aria-expanded={panel === "homes"} onClick={() => toggle("homes")}>
              Homes for sale
            </button>
            <button type="button" className="map-chip" onClick={goToMe}>
              Near me
            </button>
            <button type="button" className="map-chip map-chip-round" aria-label="What is this?" aria-expanded={panel === "info"} onClick={() => toggle("info")}>
              ?
            </button>
          </div>
        </div>
        <MapMenu />
      </header>

      {!pin && !picked && !panel && (
        <p className="map-hint" aria-hidden>
          {start.from === "near" ? "Roughly where you are. " : ""}Click anywhere to see what is on record there.
        </p>
      )}

      {panel && (
        <section className="map-panel" aria-label={panel === "layers" ? "Layers" : panel === "homes" ? "Homes for sale" : "About this map"}>
          <div className="listing-panel-head">
            <span className="kicker">{panel === "layers" ? "layers" : panel === "homes" ? "homes for sale" : "what this is"}</span>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setPanel(null)} aria-label="Close">
              ✕
            </button>
          </div>
          {panel === "layers" && <LayersPanel on={layers} onToggle={(id, v) => setLayers({ ...layers, [id]: v })} zoom={zoom} />}
          {panel === "info" && <InfoPanel />}
          {panel === "homes" && (
            <div className="map-panel-body">
              {near ? (
                <button type="button" className="btn btn-accent btn-sm" onClick={loadHere} disabled={area.status === "loading"}>
                  {area.status === "loading" ? "Loading…" : "Show homes for sale here"}
                </button>
              ) : (
                <p className="spot-hint">Zoom in to a neighbourhood first.</p>
              )}
              {area.status === "done" && <p className="spot-hint">{areaLine(area.data)}</p>}
              {area.status === "failed" && <p className="spot-hint">{area.reason}</p>}
              {area.status === "done" && area.data.listings.length > 0 && (
                <div className="home-map-sort">
                  {sorted ? (
                    <>
                      <h2>{area.data.sort?.name}</h2>
                      <p className="listing-note">
                        Exploratory model output, deepest 5 % of each block&apos;s open ground at the peak.{" "}
                        {area.data.sort?.leftOut
                          ? `${area.data.sort.leftOut} of ${area.data.listings.length} listings left out: their blocks have no modelled reading yet.`
                          : "No listing was left out."}
                      </p>
                      <ol>
                        {sorted.map((o) => (
                          <li key={o.key}>
                            <button type="button" className="listing-sort-row" onClick={() => o.listing && setPicked(o.listing)}>
                              <span>{o.listing?.UnparsedAddress}</span>
                              <span>
                                {o.depth_cm} cm{o.spread_cm ? ` (${o.spread_cm[0]} to ${o.spread_cm[1]})` : ""}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ol>
                    </>
                  ) : (
                    <p className="listing-note">
                      Click a dot to open a listing. Subscribers can sort these by the{" "}
                      {floodSortName(DEFAULT_STORM).toLowerCase()} where our models have run. Not on sale yet.
                    </p>
                  )}
                </div>
              )}
              <p className="listing-note">
                Listings from RentCast, shown as it gives them. A dot sits where the listing puts it; what we show for each is
                about its block, not the house.
              </p>
            </div>
          )}
        </section>
      )}

      {pin && !picked && (
        <SpotCard
          slug={pin.slug}
          matched={pin.matched}
          spot={pin.spot}
          onClose={() => {
            setPin(null);
            searchPin.current?.remove();
          }}
        />
      )}
      {picked && <ListingPanel key={picked.listing_key} listing={picked} onClose={() => setPicked(null)} />}
    </main>
  );
}
