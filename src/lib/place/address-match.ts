// Does an answer from a geocoder describe the address the visitor typed?
//
// The Census geocoder only ever answers with the address it matched. Photon
// (photon.ts) answers with the nearest thing it knows, which can be a clinic
// on another street when the typed one is missing ("1 Main St, Springfield,
// IL" returned a clinic on South 6th Street, tested 20 Nov 2026). So an answer
// from Photon is taken only when this module says the house number and street
// (or, for a street-level answer, the street) are the ones typed, and the
// state agrees when one was typed.

const STATES: Record<string, string> = {
  alabama: "al", alaska: "ak", arizona: "az", arkansas: "ar", california: "ca", colorado: "co",
  connecticut: "ct", delaware: "de", "district of columbia": "dc", florida: "fl", georgia: "ga",
  hawaii: "hi", idaho: "id", illinois: "il", indiana: "in", iowa: "ia", kansas: "ks", kentucky: "ky",
  louisiana: "la", maine: "me", maryland: "md", massachusetts: "ma", michigan: "mi", minnesota: "mn",
  mississippi: "ms", missouri: "mo", montana: "mt", nebraska: "ne", nevada: "nv", "new hampshire": "nh",
  "new jersey": "nj", "new mexico": "nm", "new york": "ny", "north carolina": "nc", "north dakota": "nd",
  ohio: "oh", oklahoma: "ok", oregon: "or", pennsylvania: "pa", "rhode island": "ri",
  "south carolina": "sc", "south dakota": "sd", tennessee: "tn", texas: "tx", utah: "ut", vermont: "vt",
  virginia: "va", washington: "wa", "west virginia": "wv", wisconsin: "wi", wyoming: "wy",
  "puerto rico": "pr",
};
const STATE_CODES = new Set(Object.values(STATES));

/** Street words to one spelling. Directions and street types are dropped
 *  when two names are compared, so they are only listed here to be known. */
const CANON: Record<string, string> = {
  street: "st", avenue: "ave", av: "ave", drive: "dr", road: "rd", boulevard: "blvd", lane: "ln",
  court: "ct", place: "pl", plaza: "plz", parkway: "pkwy", circle: "cir", terrace: "ter",
  highway: "hwy", way: "way", trail: "trl", square: "sq", alley: "aly", expressway: "expy",
  freeway: "fwy", turnpike: "tpke", crossing: "xing", point: "pt", loop: "loop", row: "row",
  mount: "mt", fort: "ft", saint: "st",
  north: "n", south: "s", east: "e", west: "w",
  northeast: "ne", northwest: "nw", southeast: "se", southwest: "sw",
  first: "1st", second: "2nd", third: "3rd", fourth: "4th", fifth: "5th", sixth: "6th",
  seventh: "7th", eighth: "8th", ninth: "9th", tenth: "10th",
};
const TYPES = new Set([
  "st", "ave", "dr", "rd", "blvd", "ln", "ct", "pl", "plz", "pkwy", "cir", "ter", "hwy", "way",
  "trl", "sq", "aly", "expy", "fwy", "tpke", "xing", "pt", "loop", "row",
]);
const DIRECTIONS = new Set(["n", "s", "e", "w", "ne", "nw", "se", "sw"]);
const UNIT = /\b(apt|apartment|unit|suite|ste|fl|floor|rm|room|bldg|lot|spc|space)\.?\s*[\w-]+|#\s*[\w-]+/gi;
const ZIP = /\b\d{5}(-\d{4})?\b/g;
const COUNTRY = /\b(usa|us|united states( of america)?)\b/g;
const STATE_WORD = new RegExp(
  `\\b(${[...Object.keys(STATES), ...STATE_CODES].map((n) => n.replace(/ /g, "\\s+")).join("|")})\\b`,
  "g",
);

function words(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[.,']/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => CANON[w] ?? w);
}

/** The name part of a street: no directions, no street type. "Mount Lee
 *  Drive" and "Mt Lee Dr" both give "mt lee". A street called only by its
 *  type word keeps its words rather than becoming empty. */
export function streetCore(street: string): string {
  const all = words(street);
  const core = all.filter((w) => !DIRECTIONS.has(w) && !TYPES.has(w));
  return (core.length ? core : all).join(" ");
}

export interface TypedAddress {
  number: string | null;
  street: string;
  /** Two-letter state, if one was typed. */
  state: string | null;
}

/** "4059 Mt Lee Dr, Los Angeles, CA 90068" -> number 4059, street "Mt Lee Dr", state "ca". */
export function parseTyped(address: string): TypedAddress {
  const clean = address.replace(UNIT, " ").replace(/\s+/g, " ").trim();
  const parts = clean.split(",").map((p) => p.trim()).filter(Boolean);
  const first = parts[0] ?? "";
  const m = first.match(/^(\d+[a-z]?(?:-\d+)?)\s+(.+)$/i);
  const number = m ? m[1].toLowerCase() : null;
  const street = m ? m[2] : first;

  // The state is whatever names one last: in "Washington, DC" the city is
  // Washington and the state is DC.
  const tail = parts.slice(1).join(" ").toLowerCase().replace(ZIP, " ").replace(COUNTRY, " ");
  let state: string | null = null;
  for (const hit of tail.matchAll(STATE_WORD)) state = stateCode(hit[0].replace(/\s+/g, " "));
  return { number, street, state };
}

export function stateCode(name: string | undefined): string | null {
  if (!name) return null;
  const n = name.trim().toLowerCase();
  return STATES[n] ?? (STATE_CODES.has(n) ? n : null);
}

export function sameStreet(typed: string, found: string | undefined): boolean {
  if (!found) return false;
  const a = streetCore(typed);
  return a.length > 0 && a === streetCore(found);
}

export function sameNumber(typed: string | null, found: string | undefined): boolean {
  if (!typed || !found) return false;
  return typed === found.trim().toLowerCase();
}

export function sameState(typed: string | null, found: string | undefined): boolean {
  if (!typed) return true;
  return stateCode(found) === typed;
}
