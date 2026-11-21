import { headers } from "next/headers";
import { HomeMap, US_VIEW, type StartView } from "@/components/home/HomeMap";
import { inUsBounds } from "@/lib/place/coords";

// The home page is the map and nothing else (docs/design/map-first-brief.md
// s.3, Kyle: "Nothing: map only"). The explainer that used to sit under the
// map is in the map's "?" panel and on the About page.
//
// Where the map opens. Vercel adds the visitor's rough location, from their
// internet address, to each request (x-vercel-ip-latitude / -longitude:
// https://vercel.com/docs/headers/request-headers, read 20 Nov 2026). The map
// opens there at town zoom, so the first thing a visitor sees is somewhere
// they know. Nothing is asked of the visitor's browser, no outside service is
// called, and the location is not stored: it only picks the starting view.
// Outside the US, or with no headers (a local copy), it opens on the lower 48.
//
// Claims on this page and what each rests on: see the map component
// (src/components/home/HomeMap.tsx). Do not add a figure, a customer, a city
// or a validation claim here.

export const dynamic = "force-dynamic";

const NEAR_ZOOM = 10.5;

async function startView(): Promise<StartView> {
  const h = await headers();
  const lat = Number(h.get("x-vercel-ip-latitude"));
  const lon = Number(h.get("x-vercel-ip-longitude"));
  if (h.get("x-vercel-ip-latitude") && h.get("x-vercel-ip-longitude") && inUsBounds({ lat, lon })) {
    return { center: [lon, lat], zoom: NEAR_ZOOM, from: "near" };
  }
  return { center: US_VIEW.center, zoom: US_VIEW.zoom, from: "us" };
}

export default async function Home() {
  return <HomeMap start={await startView()} />;
}
