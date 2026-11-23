// The block set against the square kilometre around it: how much tree canopy,
// how much paving, and whether the ground is high or low for the area.
//
//   Land cover   National Land Cover Database 2021, downloaded as a small grid
//                from the MRLC server's coverage service (WCS) and averaged
//                here. https://www.mrlc.gov/geoserver/mrlc_download/wcs
//   Elevation    USGS 3D Elevation Program image service, which computes
//                statistics and a histogram for an area itself.
//                https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer
//
// Two areas, both centred on the rounded place (never on a house):
//   the block           the same box the FEMA lookup uses, about 180 m across
//   the neighbourhood   a square of one kilometre
//
// What these numbers are not. They are averages of public survey grids. They
// say nothing about a particular yard, and open water inside either area is
// counted as it is surveyed: no trees, no paving, and a surface near sea
// level. The cards say so where it matters.

import type { LatLon } from "./coords";
import { readByteGrid } from "./geotiff";
import { askBytes, askJson, DAY_SECONDS, type Lookup } from "./lookup";

const BLOCK_HALF_LAT = 0.0008;
const BLOCK_HALF_LON = 0.001;
const AREA_HALF_M = 500;
const M_PER_DEG = 111_320;
const FT_PER_M = 3.28084;

interface Box {
  west: number;
  south: number;
  east: number;
  north: number;
}

function areaBox(p: LatLon): Box {
  const dLat = AREA_HALF_M / M_PER_DEG;
  const dLon = AREA_HALF_M / (M_PER_DEG * Math.cos((p.lat * Math.PI) / 180));
  return { west: p.lon - dLon, south: p.lat - dLat, east: p.lon + dLon, north: p.lat + dLat };
}

function blockBox(p: LatLon): Box {
  return {
    west: p.lon - BLOCK_HALF_LON,
    south: p.lat - BLOCK_HALF_LAT,
    east: p.lon + BLOCK_HALF_LON,
    north: p.lat + BLOCK_HALF_LAT,
  };
}

/* ---------------- land cover ---------------- */

export interface Share {
  /** Percent, 0 to 100, averaged over the block. */
  block: number;
  /** Percent, averaged over the square kilometre. */
  neighbourhood: number;
}

export interface LandCover {
  canopy: Share;
  paving: Share;
}

const WCS = "https://www.mrlc.gov/geoserver/mrlc_download/wcs";
/** Cells across the square kilometre: about 30 m each. */
const GRID = 34;

async function shareOf(p: LatLon, coverage: string): Promise<Lookup<Share>> {
  const area = areaBox(p);
  const q = new URLSearchParams({
    service: "WCS",
    version: "1.0.0",
    request: "GetCoverage",
    coverage,
    bbox: [area.west, area.south, area.east, area.north].map((v) => v.toFixed(6)).join(","),
    crs: "EPSG:4326",
    width: String(GRID),
    height: String(GRID),
    format: "GeoTIFF",
  });
  const res = await askBytes(`${WCS}?${q.toString()}`, "The land cover server", {
    // One edition of the survey (2021) is read; keep an answer for half a year.
    revalidate: 180 * DAY_SECONDS,
    retries: 1,
  });
  if (!res.ok) return res;
  const grid = readByteGrid(res.data);
  if (!grid) return { ok: false, final: true, reason: "The land cover survey has no data for this place." };

  const block = blockBox(p);
  let allSum = 0;
  let allN = 0;
  let blockSum = 0;
  let blockN = 0;
  for (let y = 0; y < grid.height; y++) {
    const lat = area.north - ((y + 0.5) / grid.height) * (area.north - area.south);
    for (let x = 0; x < grid.width; x++) {
      const v = grid.values[y * grid.width + x];
      if (v > 100) continue; // outside the survey
      const lon = area.west + ((x + 0.5) / grid.width) * (area.east - area.west);
      allSum += v;
      allN++;
      if (lat >= block.south && lat <= block.north && lon >= block.west && lon <= block.east) {
        blockSum += v;
        blockN++;
      }
    }
  }
  if (allN < (GRID * GRID) / 2 || blockN === 0) {
    return { ok: false, final: true, reason: "The national land cover survey used here covers the lower 48 states only." };
  }
  return { ok: true, data: { block: blockSum / blockN, neighbourhood: allSum / allN } };
}

export async function landCoverAround(p: LatLon): Promise<Lookup<LandCover>> {
  const [canopy, paving] = await Promise.all([
    shareOf(p, "nlcd_tcc_conus_2021_v2021-4"),
    shareOf(p, "NLCD_2021_Impervious_L48"),
  ]);
  if (!canopy.ok) return canopy;
  if (!paving.ok) return paving;
  return { ok: true, data: { canopy: canopy.data, paving: paving.data } };
}

/* ---------------- ground height ---------------- */

export interface Ground {
  /** Median elevation of the block, feet. */
  blockFt: number;
  /** Median elevation of the square kilometre, feet. */
  neighbourhoodFt: number;
  /** Lowest and highest surveyed surface in the square kilometre, feet. */
  lowFt: number;
  highFt: number;
  /** Share of the square kilometre that lies lower than the block's median, 0 to 100. */
  lowerSharePct: number;
}

interface Stats {
  statistics?: { min: number; max: number; median: number; count: number }[];
  histograms?: { size: number; min: number; max: number; counts: number[] }[];
}

const DEM = "https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer";

function statsUrl(b: Box): string {
  const q = new URLSearchParams({
    geometry: JSON.stringify({
      xmin: b.west,
      ymin: b.south,
      xmax: b.east,
      ymax: b.north,
      spatialReference: { wkid: 4326 },
    }),
    geometryType: "esriGeometryEnvelope",
    f: "json",
  });
  return `${DEM}/computeStatisticsHistograms?${q.toString()}`;
}

export async function groundAround(p: LatLon): Promise<Lookup<Ground>> {
  const who = "The USGS elevation service";
  // This service answers 502 for a few seconds at a time (seen 17 Nov 2026),
  // so it is asked up to four times, a little further apart each time.
  const opts = { revalidate: 180 * DAY_SECONDS, retries: 3, timeoutMs: 25_000 };
  const [area, block] = await Promise.all([
    askJson<Stats>(statsUrl(areaBox(p)), who, opts),
    askJson<Stats>(statsUrl(blockBox(p)), who, opts),
  ]);
  if (!area.ok) return area;
  if (!block.ok) return block;
  const a = area.data.statistics?.[0];
  const b = block.data.statistics?.[0];
  const h = area.data.histograms?.[0];
  if (!a || !b || !h || !h.counts?.length || !Number.isFinite(b.median) || !Number.isFinite(a.median)) {
    return { ok: false, final: true, reason: "USGS has no elevation survey for this place." };
  }

  // Share of the area's cells below the block's median, from the service's histogram.
  const total = h.counts.reduce((n, c) => n + c, 0);
  const width = (h.max - h.min) / h.counts.length;
  let below = 0;
  if (width > 0) {
    for (let i = 0; i < h.counts.length; i++) {
      const lo = h.min + i * width;
      const hi = lo + width;
      if (hi <= b.median) below += h.counts[i];
      else if (lo < b.median) below += h.counts[i] * ((b.median - lo) / width);
    }
  }

  return {
    ok: true,
    data: {
      blockFt: b.median * FT_PER_M,
      neighbourhoodFt: a.median * FT_PER_M,
      lowFt: a.min * FT_PER_M,
      highFt: a.max * FT_PER_M,
      lowerSharePct: total > 0 ? (below / total) * 100 : 50,
    },
  };
}
