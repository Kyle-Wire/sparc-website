import { headers } from "next/headers";
import { withPage } from "@/lib/seo";
import { Nav } from "@/components/shell/Shell";
import { HomeMap, US_VIEW, type StartView } from "@/components/home/HomeMap";
import { inUsBounds } from "@/lib/place/coords";

// The map. It was the home page until 25 Nov 2026 (map-first-brief.md s.3);
// Kyle then made How it works the landing page and asked for the site menu
// bar on the map too, because the floating "Menu" chip was hard to find on a
// wide monitor. The map now sits under the same Nav as every other page.
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
// Old "/?lat=..&lon=.." links are redirected here with their query
// (next.config.ts), and "/map?lat=.." links count as this page.
export const metadata = withPage("/map", {
  title: "Look up a home",
  description: "See what is on public record around any US address: flood zones, claims nearby, storm tracks, sinkholes and more. Free, no account.",
});

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

export default async function MapPage() {
  return (
    <>
      <Nav active="home" />
      <HomeMap start={await startView()} underNav />
    </>
  );
}
