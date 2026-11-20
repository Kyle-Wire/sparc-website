# Address locators

**20 November 2026.** Written by the agent after Kyle reported a real address the search could not find and asked: "Can we use a different address locator?" A first version used Esri, which needs a key. Kyle then asked for a keyless option ("Find keyless option"), and this page describes that one. Calls marked **agent's call** are open to Kyle.

## What the site does now

1. It asks the US Census Bureau's geocoder, as before.
2. If Census finds nothing or does not answer, it asks **Photon** (`photon.komoot.io`), komoot's free search over OpenStreetMap. Photon needs no key and no account.
3. Photon answers with the nearest thing it knows, so its answer is checked against what was typed (`src/lib/place/address-match.ts`):
   - **house:** the house number, the street and the state (when one was typed) all match. The point is the house, and the site treats it exactly like a Census match.
   - **street:** only the typed street matches, either a street or a crossing on it. The map moves to the street and says "Found the street, not the house". The point is not kept as the property, no pin is placed, and no block link is offered (**agent's call**: a point somewhere on a long street can be blocks away from the house).
   - anything else is refused, and the visitor is told neither search found the address.
4. **Drop a pin** (Kyle: "maybe the user can just drop a pin as well?"). On the home map, once zoomed in to street level, the visitor can click the house to mark it, and drag the pin to adjust it. After a street-only answer this turns on by itself. The dropped point is treated like a found address: it stays in this browser tab (`place-point.ts`), only its rounded block goes in the link, and nothing is sent to a locator.
5. Wherever a place found by Photon is shown, the line under the search box credits "OpenStreetMap data, © OpenStreetMap contributors", as the ODbL asks.

The privacy rules are the same for both searches:
- only the address is sent, from our server, not the visitor's browser;
- nothing is cached, logged or stored.

The privacy page, the data page, the place page's note and [`site-redesign-brief.md`](site-redesign-brief.md) section 8 name Photon.

## Why Photon

Tested 20 November 2026 on public addresses: office buildings and landmarks, never a home.

- **Census misses depend on coverage, not on typing.** The same address typed eight ways matched every time. Addresses on streets that are new or missing from Census's street ranges failed however they were typed: 1 Apple Park Way, Cupertino; 2 Lincoln Memorial Cir NW, Washington; 4059 Mt Lee Dr, Los Angeles. Retrying Census with different wording would not help.
- **Photon, through the site's match check:**

  | Address | Photon's answer |
  |---|---|
  | 1600 Amphitheatre Pkwy, Mountain View, CA | house |
  | 600 Montgomery St, San Francisco, CA | house |
  | 1401 Constitution Ave NW, Washington, DC | house |
  | 100 Universal City Plaza, Universal City, CA | house |
  | 1 Apple Park Way, Cupertino, CA | house (Census: none) |
  | 2 Lincoln Memorial Cir NW, Washington, DC | street (Census: none) |
  | 4059 Mt Lee Dr, Los Angeles, CA | street (Census: none) |
  | 1 Main St, Springfield, IL | street: North Main Street, which Photon places in Springfield |
  | 99999 Nowhere Rd, Boise, ID | none |

  Before the match check, Photon offered a clinic on South 6th Street for "1 Main St, Springfield, IL". The check exists for that.
- **Rejected:**
  - Esri's World Geocoding Service found all eight at house level, but its documentation says a token is required ([find address candidates](https://developers.arcgis.com/rest/geocode/find-address-candidates/)).
  - OpenStreetMap's Nominatim: its usage policy asks sites not to send personal data and caps a whole site at one request a second ([policy](https://operations.osmfoundation.org/policies/nominatim/)). A buyer's address is arguably personal data.
  - The US National Address Database's public feature service took 5 to 55 seconds a query, failed on DC, was empty for New York and Philadelphia, and has no California data.

## Photon's terms

Read on [photon.komoot.io](https://photon.komoot.io/), 20 November 2026: the API may be used for a project if use is fair; heavy use is throttled; availability is not guaranteed. The data is OpenStreetMap's, under the [ODbL](https://www.openstreetmap.org/copyright), which asks for the credit above.

So Photon is a second try, not the main search. If the site's traffic grows to where komoot would throttle it, Photon can be run on our own server from the same open code and data. That needs a server with room for the US extract (**not set up**).

## Not checked

- A visitor's real address. Kyle's address that failed was not used in testing; trying it through the live search is the check that matters.
- How often Photon throttles. The tests above were nine requests about a second apart.
