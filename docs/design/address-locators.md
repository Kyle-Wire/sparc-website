# Address locators

**20 November 2026.** Written by the agent after Kyle reported a real address the search could not find and asked: "Can we use a different address locator?" Calls marked **agent's call** are open to Kyle.

## What the site does now

1. It asks the US Census Bureau's geocoder, as before.
2. If Census finds nothing, or does not answer, it asks **Esri's World Geocoding Service**. This step runs only when `ARCGIS_API_KEY` is set, server side. With no key, the site behaves as before.
3. An Esri answer is taken only when it puts the point on a house or building (`PointAddress`, `Subaddress`, `StreetAddress`, `StreetAddressExt`, `BuildingName`) with a score of at least 90. A match to a street, a ZIP code or a town is refused, because the page is built around one block and a point in the middle of a long street or a town would pick the wrong one (**agent's call**).

The privacy rules are the same for both locators:
- only the address is sent, from our server, not the visitor's browser;
- nothing is cached, logged or stored;
- Esri is asked with `forStorage=false`, its "not stored" use.

The privacy page, the data page, the place page's note and [`site-redesign-brief.md`](site-redesign-brief.md) section 8 now name Esri.

## Why a second locator, and why Esri

Tested 20 November 2026 on public addresses: office buildings and landmarks, never a home.

- **Census misses depend on coverage, not on typing.** The same address typed eight ways matched every time: with a unit number, "#2", no commas, a ZIP code alone, the state written out, and "USA" on the end. Addresses on streets that are new or missing from Census's street ranges failed however they were typed: 1 Apple Park Way, Cupertino; 2 Lincoln Memorial Cir NW, Washington; 4059 Mt Lee Dr, Los Angeles. Retrying Census with different wording would not help.
- **Esri found all eight test addresses at house level.** Census found five.
- **OpenStreetMap's Nominatim found the house for five**, and for the other three it returned only the street or a building with no house number. Its usage policy also asks sites not to send personal data and caps the whole site at one request a second ([policy](https://operations.osmfoundation.org/policies/nominatim/), read 20 November 2026). A buyer's address is arguably personal data. Not used.

Esri's terms, read 20 November 2026:
- A token is required ([find address candidates](https://developers.arcgis.com/rest/geocode/find-address-candidates/); [geocoding overview](https://developers.arcgis.com/documentation/mapping-and-location-services/geocoding/)). The service also answered without one during testing, but the site does not rely on that.
- Results are "not stored" by default and may be shown on a map.
- Esri's documentation lists geocodes that are not stored as 20,000 free, then $0.50 per 1,000. The pricing page itself did not load, so the free amount and its period are unconfirmed.
- The same page asks that requests carry no personally identifiable information. The site sends a street address and nothing else: no name, no account and no visitor details.

## What Kyle needs to do

1. Make an ArcGIS Location Platform account and an API key with the geocoding privilege.
2. Set `ARCGIS_API_KEY` in Vercel's Production environment, and in `.env.local` for a local copy.

The key is never `NEXT_PUBLIC_` and never reaches a browser.

## Not checked

- An Esri answer through the site end to end, which needs the key. The parts are tested separately:
  - the match filter has unit tests (`src/lib/place/arcgis.test.ts`) and was checked against Esri's live answers for the eight test addresses, plus a bare street and a bare town;
  - the route falls back to Census alone with no key, and reports that Esri did not answer when the key is wrong.
- Whether Esri's figure of 20,000 free requests is per month.
