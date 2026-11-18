"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Map as MlMap, GeoJSONSource } from "maplibre-gl";
import { PlaceSearch } from "@/components/place/PlaceSearch";
import { BASE_STYLE, RASTERS, SpotList, type Spot } from "@/components/place/PlaceMap";
import { DEFAULT_STORM, HAZARD_STATE_WORDS, floodSortName, type BlockReadings, type HazardState } from "@/lib/listings/blocks";
import type { PublicListing } from "@/lib/listings/feed";

/**
 * The home page is a map (Climate Inspection D42, SPEC-LISTINGS.md §1).
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
  status: "kept" | "fetched" | "budget_spent" | "feed_not_connected" | "store_not_connected" | "failed";
  fetchedAt: string | null;
  source: string;
  listings: Listing[];
  sort: { name: string; order: { key: string; depth_cm: number; spread_cm: [number, number] | null }[]; leftOut: number } | null;
  budget: { cap: number; used: number | null };
}

interface BlockAnswer {
  slug: string;
  place: string | null;
  states: Record<string, HazardState>;
  subscriber: boolean;
  readings: BlockReadings | null;
}

type Load<T> = { status: "idle" } | { status: "loading" } | { status: "failed"; reason: string } | { status: "done"; data: T };

const US_VIEW = { center: [-98.35, 39.5] as [number, number], zoom: 3.4 };
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
          Flood, heat, ground movement and wind, worked out for this house. Built for you alone and never posted
          on the map.
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

export function HomeMap() {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MlMap | null>(null);
  const [failed, setFailed] = useState(false);
  const [zoom, setZoom] = useState(US_VIEW.zoom);
  const [area, setArea] = useState<Load<AreaAnswer>>({ status: "idle" });
  const [picked, setPicked] = useState<Listing | null>(null);
  const [fema, setFema] = useState(true);
  const listingsRef = useRef<Listing[]>([]);

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
          center: US_VIEW.center,
          zoom: US_VIEW.zoom,
          minZoom: 3,
          maxZoom: 17,
          cooperativeGestures: true,
          attributionControl: { compact: true },
        });
        mapRef.current = map;
        map.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right");
        map.addControl(new maplibre.ScaleControl({ unit: "imperial" }), "bottom-left");
        map.on("zoomend", () => map && setZoom(map.getZoom()));
        map.on("load", () => {
          if (dead || !map) return;
          const f = RASTERS.find((r) => r.id === "fema");
          if (f) {
            map.addSource("fema", { type: "raster", tiles: [f.tiles], tileSize: f.tileSize, minzoom: f.minzoom, attribution: f.attribution });
            map.addLayer({ id: "fema", type: "raster", source: "fema", paint: { "raster-opacity": f.opacity } });
          }
          map.addSource("listings", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
          map.addLayer({
            id: "listings",
            type: "circle",
            source: "listings",
            paint: {
              "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 4, 16, 8],
              "circle-color": "#1a1416",
              "circle-stroke-color": "#f7f4ee",
              "circle-stroke-width": 2,
            },
          });
          map.on("click", "listings", (e) => {
            const key = e.features?.[0]?.properties?.key;
            const l = listingsRef.current.find((x) => x.listing_key === key);
            if (l) setPicked(l);
          });
          map.on("mouseenter", "listings", () => map && (map.getCanvas().style.cursor = "pointer"));
          map.on("mouseleave", "listings", () => map && (map.getCanvas().style.cursor = ""));
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
  }, []);

  useEffect(() => {
    const m = mapRef.current;
    if (m?.getLayer("fema")) m.setLayoutProperty("fema", "visibility", fema ? "visible" : "none");
  }, [fema]);

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
      (p) => mapRef.current?.flyTo({ center: [p.coords.longitude, p.coords.latitude], zoom: 13 }),
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

  return (
    <section className="home-map-section" aria-label="Map">
      <div className="home-map-frame">
        <div ref={boxRef} className="home-map" />
        {failed && <p className="home-map-failed">The map could not start in this browser. The search still works.</p>}
        <div className="home-map-card">
          <span className="kicker">environmental screening · any US address</span>
          <h1>See what is on record before you buy.</h1>
          <PlaceSearch compact />
          <div className="home-map-tools">
            <button type="button" className="btn btn-sm" onClick={goToMe}>
              Go to where I am
            </button>
            <label className="home-map-toggle">
              <input type="checkbox" checked={fema} onChange={(e) => setFema(e.target.checked)} /> FEMA flood zones
            </label>
          </div>
        </div>
        {picked && <ListingPanel key={picked.listing_key} listing={picked} onClose={() => setPicked(null)} />}
      </div>

      <div className="wrap home-map-bar" aria-live="polite">
        {near ? (
          <button type="button" className="btn btn-accent btn-sm" onClick={loadHere} disabled={area.status === "loading"}>
            {area.status === "loading" ? "Loading homes for sale…" : "Show homes for sale here"}
          </button>
        ) : (
          <span>Zoom in to a neighbourhood to see homes for sale there.</span>
        )}
        {area.status === "done" && <span>{areaLine(area.data)}</span>}
        {area.status === "failed" && <span>{area.reason}</span>}
        <small>
          Listings from RentCast, shown as it gives them. Pins sit where the feed puts them; what we show for each
          is about its block, not the house.
        </small>
      </div>

      {area.status === "done" && area.data.listings.length > 0 && (
        <div className="wrap home-map-sort">
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
              Subscribers can sort these by the {floodSortName(DEFAULT_STORM).toLowerCase()}, with each value&apos;s
              spread, where our models have run. Not on sale yet.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
