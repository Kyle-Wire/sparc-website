// POST /api/listings/block  { slug }  ->  what our models hold for one block
//
// Everyone is told which hazards are modelled at the block and which are not
// ("Not modelled here yet" is a label, not a switch). The values themselves
// are paid tier and go to subscribers only (Climate Inspection D42 item 5).

import { NextResponse, type NextRequest } from "next/server";
import { parsePlaceSlug, placeSlug } from "@/lib/place/coords";
import { hazardStates, placeForBlock } from "@/lib/listings/blocks";
import { isSubscriber, modelPlaces, readingsFor } from "@/lib/listings/store";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/require-same-origin";

const NO_STORE = { "Cache-Control": "no-store" };

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "This request did not come from the site." }, { status: 403, headers: NO_STORE });
  const limit = await checkRateLimit("apiWrite", `listings-block:${clientIp(req)}`);
  if (!limit.ok) return NextResponse.json({ error: "Too many requests at once." }, { status: 429, headers: NO_STORE });

  let raw = "";
  try {
    raw = String(((await req.json()) as { slug?: unknown }).slug ?? "");
  } catch {
    /* falls through to the check below */
  }
  const place = parsePlaceSlug(raw);
  if (!place) return NextResponse.json({ error: "Send a block." }, { status: 400, headers: NO_STORE });
  const slug = placeSlug(place);

  const modelled = placeForBlock(slug, await modelPlaces());
  const states = hazardStates(modelled);
  const subscriber = modelled ? await isSubscriber() : false;
  const readings = subscriber ? ((await readingsFor([slug])).get(slug) ?? null) : null;

  return NextResponse.json(
    { slug, place: modelled ? modelled.name : null, states, subscriber, readings },
    { headers: NO_STORE },
  );
}
