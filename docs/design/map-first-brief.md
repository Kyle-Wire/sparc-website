# Map-first site: design brief

**20 November 2026.** Based on an interview with Kyle (his answers quoted in short form) and his follow-up message. Written by the agent. Calls marked **agent's call** are open to Kyle.

This replaces the home page layout in [`site-redesign-brief.md`](site-redesign-brief.md) and narrows [`cabinet-frame.md`](cabinet-frame.md). The page content itself will be revised later, at Kyle's request ("we can get to that later"). This brief sets layout, feel, sources and the free/paid line, not final wording.

Kyle pointed to a Reddit thread on web design essentials. Reddit refused automated reading of it (403), so it was not read and is not a source here.

## 1. Who and what

- **Audience:** "All equally": buyers, owners and professionals.
- **First feeling:** "Curiosity: explore". The map is the invitation.
- **Main action:** "Search an address".
- **Voice:** "Warm guide": second person, short sentences, saying what a reading means for you. The repo's rules still hold:
  - name each quantity exactly;
  - mark model results as exploratory;
  - no loss, premium or payback figures.

## 2. Look

- **Arcade look:** "Tone it down".
  - The pixel font stays on the logo and the smallest labels only.
  - Stepped frames give way to plain 1 px rules.
  - The mist effect is kept on the logo at most (**agent's call**).
- **Colour:** "Mono plus one accent". Black, white and greys to match the black and white aerial, and one accent for actions and the pin. Map layers keep their publishers' colours, because those carry meaning.
- **Type:** "Sans plus mono". The sans is for text. The mono is for numbers, units, coordinates and small labels.

## 3. Home page: the map is the page

- **Layout:** full screen, nothing below ("Nothing: map only"). The footer's links move into the menu.
- **Header:** "Floating over map". The logo chip sits at top left and the menu chip at top right.
- **Menu:** Your places, The models, Pricing / report, About, Contact.
- **On the map:** one floating address bar ("Search bar only"). Three chips open their panels:
  - layers and legend;
  - homes for sale, still loaded on request, because each new area spends feed requests;
  - "?", a short explainer, with the full story on the About page ("Info chip and About").
- **Search:** Enter runs today's search: Census, then Photon (PR #34). **Suggestions as you type are postponed** ("we can wait on photon for the time being").
- **Start view:** the visitor's rough area, from Vercel's IP location headers (`x-vercel-ip-latitude` / `-longitude`, [Vercel request headers](https://vercel.com/docs/headers/request-headers)). Kyle: "Sounds good on location." This needs no permission prompt and no outside service.
  - It opens at town zoom, because IP location is rough (**agent's call**).
  - It falls back to the lower 48 when the headers are missing or the visitor is outside the US.
- **Click on the map:** "Both, pin first". The click drops the pin (PR #34) and opens a small card beside it with:
  - the free readings for that spot (section 6);
  - "The full public record for this block →";
  - one quiet "Get the house report" link.

  Clicking a listing still opens the listing.
- **Layers on at start:** FEMA flood zones only. Surface temperature (LST) is **in the paid report** (Kyle: "we'll keep LST in paid"), so there is no free heat layer.

## 4. Phone

"Stacked": search on top, then the map at a fixed height (about 65 % of the screen, **agent's call**), then the cards below it.

## 5. Place page

"Map plus verdicts": a large map of the block, with one line per hazard beside it (below it on a phone). The current sections follow in the quieter look, until the content revision.

## 6. Ground and wind records (agent's decision, as Kyle asked)

Kyle: "Please decide on the wind records and ground. Perhaps we show soil layers? USGS layers would be a good place to start." This follows "Shown with limits": each record is labelled for what it is and where it comes from, and none is presented as the house's own reading.

Every service below was opened and answered on 20 November 2026 unless marked otherwise.

### Ground (free)

| Record | Publisher | Service | Shown as |
|---|---|---|---|
| Landslide susceptibility, 90 m (Mirus et al. 2024) | USGS | `tiles.arcgis.com/tiles/v01gqwM5QqNysAAi/arcgis/rest/services/US_Landslide_Susceptibility/MapServer` (cached tiles, levels 0 to 12) | Map layer; the class at the clicked spot |
| Landslide inventory, version 3 | USGS | `services.arcgis.com/v01gqwM5QqNysAAi/.../US_Landslide_poly_v2/FeatureServer` and `US_Landslide_point_v2` | Mapped landslides near the spot, with distance |
| Quaternary faults, 2020 release | USGS | `earthquake.usgs.gov/arcgis/rest/services/haz/Qfaults/MapServer` | Map layer; nearest mapped fault and its distance |
| Soil map unit and its ratings | USDA NRCS, SSURGO | Soil Data Access: `sdmdataaccess.sc.egov.usda.gov` (WMS for the outlines; a query service for the ratings) | Soil name, drainage class, hydrologic group, flooding frequency and hydric share at the spot; outlines at street zoom |

Notes:
- **Landslide terms:** USGS marks the susceptibility data release CC0 ([data release](https://www.usgs.gov/data/slope-relief-threshold-landslide-susceptibility-models-united-states-and-puerto-rico), DOI 10.5066/P13KAGU3). The tile service was found through USGS's own viewer, linked from the [inventory and susceptibility tool page](https://www.usgs.gov/tools/us-landslide-inventory-and-susceptibility-map).
- **Soil comes from NRCS, not USGS.** NRCS is the national source for soil.
  - **Limit found while testing:** every Soil Data Access request timed out at 60 seconds, from both the WMS and the query service. One query answered after 61 s. So soil is asked from our server with a short timeout, and the card says "The soil survey did not answer" when it fails. That follows "a label, not a switch".
  - If it stays this slow, the fix is a copy of the soil ratings we keep ourselves (**open**).
  - Shrink-swell (soil that swells and shrinks with water, which matters for foundations) sits in the same survey at the layer level. It is added once the service answers reliably enough to test the query.
- **Not used yet:**
  - USGS karst map: its page answered 403.
  - USGS national subsidence map: no national service was found.
  - USGS 2023 seismic hazard model: its pages give data files only, no map service.

  Each stays **open**.

### Wind (free)

| Record | Publisher | Service | Shown as |
|---|---|---|---|
| Tornado, strong wind and hurricane ratings for the tract | FEMA, National Risk Index | already on the site (`nri.ts`: `TRND`, `SWND`, `HRCN`) | One line each, as now |
| How often each happens a year, by tract | FEMA, National Risk Index | `services.arcgis.com/XG15cJAlne2vxtgt/.../National_Risk_Index_Annualized_Frequency_Tornado/FeatureServer` and the `_Strong_Wind` and `_Hurricane` services (field e.g. `TRND_AFREQ`) | Map layer by tract; the count a year at the spot |

Notes:
- These are frequencies and ratings. The National Risk Index's expected annual loss is not shown (repo rule).
- **Hurricane tracks** (NOAA): the coast.noaa.gov service list redirected and was not resolved. **Open.**
- **Tornado tracks** (NOAA Storm Prediction Center): published as files, not a map service, so showing them means hosting our own copy. **Open.**
- **Building-code design wind speed** (ASCE 7): the tools found need a licence. If used at all, it belongs in the paid report. **Open.**

### Paid (our models and measurements)

- Flood depth at the house (FloodSim).
- Air temperature and outdoor comfort (HeatSim).
- Surface temperature against the neighbourhood (LST).
- Ground movement measured by radar (InSAR).
- Wind through the buildings (wind model).
- The lidar house model.

## 7. Free and paid: the balance (agent's decision, as Kyle asked)

Kyle: "deciding what amount of data in the free tier vs paid tier balance would have people want to buy the subscription or report without feeling pressured".

**The line:**
- **Free** answers "what is on public record around here?"
- **Paid** answers "what do our models and measurements say about this house?"

These are different questions, so the free part never has to be held back to sell the paid one.

**Rules:**
1. **Free is whole.** Every public record the site can read is shown in full, for any address, with no account. Nothing is blurred, cut short or held behind a sign-up.
2. **Free is about the area.** Its readings describe the block, tract or spot, and say so. They never claim to describe the house. That's honest, and it's also the natural reason the report exists.
3. **Each hazard names its open question once.** At the end of each free section there is one plain line saying what the record cannot tell you and that the report measures it. For example: "The flood map shows the zone. It cannot say how deep water gets beside this house; the house report models that." It ends in one link, never a banner.
4. **Show, don't promise.** The sample report (`/report/sample`) is one click from every paid link, so people see exactly what they would buy before deciding.
5. **No pressure devices.** None of the following:
   - countdowns;
   - "only n left";
   - pop-ups that interrupt;
   - "people are viewing this";
   - pre-ticked extras;
   - a paywall halfway through a page;
   - reminders that the visitor did not ask for.
6. **The paid link appears only once there is a house.** It shows after a search or a dropped pin, never on the bare map.
7. **Report and subscription stay distinct.**
   - The report is for someone deciding on one house, once.
   - The subscription is for an owner trying projects over time (what-ifs, re-runs).

   Each is offered only where it fits: the report on place pages, the subscription on the report and on Pricing.

This keeps the repo's rules: no loss or premium figures in either tier, and model results marked exploratory unless checked against a measurement.

## 8. Order of work (agent's call)

1. Full-screen map, floating header and menu, search bar, start view near the visitor, quieter look.
2. Click card with pin and its free readings: flood zone, ground height, landslide class, nearest fault, wind frequencies, soil (with its timeout label). Add the "?" chip and the About explainer.
3. Map layers: landslide susceptibility, faults, wind frequency by tract, soil outlines.
4. Place page: map plus verdicts, with the free/paid line from section 7.
5. Content revision, with Kyle.

Steps 1 to 4 can ship as one PR. Step 5 comes after, at Kyle's pace.

## 9. What was built, and what changed from this brief (20 November 2026)

Steps 1 to 4 are built in one PR. Differences from the plan, found while building:

- **Soil outlines on the map: dropped for now.** USDA's soil map server answered every map tile with "Mapserver dispatch failure" (HTTP 500), in both projections it lists. Its point query works, so soil is in the click card and on the place page, but not as a layer. **Open:** retry later, or draw outlines from our own copy.
- **Wind by tract on the map: not a layer.** FEMA's frequency data is a feature service, not a picture service, so it would mean loading tract outlines into the browser. Wind is read where you click, and on the place page. **Open.**
- **Landslide susceptibility at a point: not read.** Its service serves picture tiles only. It is a map layer, and the card counts the landslides mapped nearby instead.
- **Colours:** the warm paper and ink in `tokens.css` became neutral greys, with the accent unchanged. `check:colors` passes. The token file asks for a brand review before hex changes; this change follows Kyle's "Mono plus one accent".
- **The cabinet look is turned down in `src/styles/quiet.css`**, which loads last:
  - 1 px frames;
  - mono labels instead of the pixel font;
  - no mist.

  `cabinet.css` itself is unchanged, so the change can be read, or reverted, in one place.
- **The separate "Drop a pin" button is gone.** Any click on the home map drops the pin.
- **Left for the content pass:**
  - the per-hazard paid strips on the place page;
  - the header's "Ask for a report" button, which shows before there is a house (section 7, rule 6);
  - the About page's fuller explainer.

