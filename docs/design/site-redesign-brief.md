# Site redesign brief: environmental screening for home buyers

**17 November 2026.** Written by the agent from a design conversation with Kyle on the same day. Kyle's decisions are marked **Kyle**. Calls the agent made where nothing was specified are marked **agent's call**; Kyle can overrule any of them.

This replaces the old site, which pitched a causal heat model and a desktop application. The repo, the sign-in, the billing hooks, the email and the design tokens are kept. The content is new.

## 1. What the site is

A place where anyone can look up a US address and see what is on the public record about flood, storms, sea level and heat around it, for free. Paying adds SPARC Labs' own models for the neighbourhood around the property, the chance to try home projects in those models, and a report.

Kyle's goal: "make planning available to everyone." People do not have access to this data if they do not know how to use it, and a home is a big investment.

**It is a screening tool (Kyle).** It gives a home buyer more information about the area: past environmental problems and possible future ones. It does not guide engineering decisions, and the site says so on every map and report.

## 2. Who it is for

1. **Home buyers**, and the agents and inspectors helping them. They want a report on one place and are then done.
2. **Home owners** who want to try projects before paying for them: a rain garden, a French drain, removing paving, rain barrels, planting trees.
3. Residents and community groups who want to understand their block. The free tier serves them without any extra design.

Engineers and planners are not the audience. FloodSim's full workbench (pipe networks, grading, outlet structures) is not what a buyer needs.

## 3. Nationwide, with the property in the middle

- **Anywhere in the US (Kyle).** Nothing is designed around Philadelphia or around one storm.
- **The property sits at the centre of every map and report; what is modelled and shown is the neighbourhood (Kyle).**
- **The address is used to find the place and is then dropped (agent's call).** The page address carries the location rounded to about a block. The exact point is kept only in the visitor's own browser for that visit, so the map can mark the property for them and nobody else. Nothing typed into the search box is stored.

## 4. The shape: hazards as rows, three shelves each

Every hazard has the same three shelves. A new hazard is a new row, so ground movement and wind fit without a redesign.

| Hazard | On record (free) | Modelled (paid) | What if (paid) |
|---|---|---|---|
| Flood | FEMA flood zones; flood insurance claims nearby; federal disaster declarations; past hurricane tracks; sea level rise | FloodSim for the neighbourhood: default storms, design-your-own storm, live radar | Projects a home owner can do: French drain, rain garden, removing paving, rain barrels, permeable paving |
| Heat | Tree canopy and paving share | Land surface temperature; HeatSim air temperature and outdoor comfort | Trees, removing paving, cool roofs, cool pavement |
| Ground (coming) | To be decided | Ground movement measured from satellite radar (InSAR) | The measured rate carried forward: how things are likely to continue and when they could matter |
| Wind (coming) | Hurricane tracks | How wind moves through the seasons, as a map | Possibly: how planting changes it |

Decisions behind the table:

- **Free is public data only, nothing that needs a model run (Kyle).** FEMA flood maps, hurricane tracks, sea level rise, and the other public planning layers.
- **The models are paid, and fully available to paying users (Kyle).** Default storm scenarios, the user's own storms, live radar.
- **Land surface temperature is paid (Kyle).** Free access to it would undercut the air temperature maps.
- **Tree canopy and paving share are free (agent's call).** They are public data and do not replace the air temperature map.
- **Flood what-ifs are things one owner can do (Kyle).** Not neighbourhood infrastructure.
- **Guided by default (Kyle agreed).** A buyer picks from preset storms and preset projects. The full FloodSim workbench stays one click away for those who want it.
- **Insurance history is part of the product (Kyle).** Past claims now; more later. No premiums, no expected annual loss, no payback figures.
- **Ground what-if is a projection of the measured rate (Kyle).** InSAR here means Kyle's own `insar_pipeline` only.
- **Wind is a map of seasonal movement, not a detailed model (Kyle).**

## 5. How a finding is shown

Carried over from the report (Climate Inspection `DIRECTIVE.md` section 7): a card with what it is about, the figure large, the sentence, and a small label.

- **On-record cards** say where the fact comes from and its date. They are read from a register, so they carry the source, not a confidence class.
- **Modelled cards** carry one of the four labels (well supported, moderately supported, limited evidence, insufficient information), set by the fixed rules in the Climate Inspection repo.
- **What-if cards** carry a plain note beside the result (Kyle): this is modelled; it has not been checked at this place; it is a physics model scored in other cities; these are its margins. No promise is made.
- The reasons, limits and sources sit one click behind the findings, never in front of them (Kyle, report decision D17).
- **A methods paper is owed (Kyle: "we basically just need a white paper for all of this").** Every model page links to it. It does not exist yet, and the site says so until it does.
- **Heat what-ifs:** HeatSim's own model card rules out statements of the form "this measure cools this street by X". Tree and roof scenarios show a neighbourhood-scale change with its range. Sun against shade at street scale is the one fine-scale contrast the model card allows.

**A place panel: what the models have to work with here (agent's call, idea raised by the product session).** Terrain source and date, whether a drain network is published for the city, whether HeatSim's learned terms apply, how old the FEMA map is. Nationwide, data quality varies a lot, and this says so in one place.

## 6. Accounts and paying

- **Use it without an account; an account saves things (Kyle: "a Zillow vibe").**
- **Two ways to pay (Kyle, still open on detail):**
  - **A report, bought once.** For a buyer: pay, get the report, done.
  - **A subscription.** For an owner testing projects over time. Flood runs happen on the user's own computer; heat runs cost server time, so a monthly allowance of heat runs is likely (agent's call).
- **To start, it can be a service Kyle provides himself (Kyle).** Someone asks for a report; Kyle runs it. The first draft of the site is built this way: paid shelves show their layout and a "request a report" button, with no checkout.
- **No prices are published** until every line is something SPARC Labs LLC can be held to. That rule from the old pricing page stands.
- **Terms and agreements come later (Kyle).** Not drafted here.

## 7. Where the computing happens

| Thing | Where it runs | Cost to SPARC per visitor |
|---|---|---|
| Public record lookups | SPARC's server asks the agencies and keeps the answer for a day | Small |
| FloodSim | The visitor's own graphics card, in Chrome or Edge | Almost nothing: a data proxy |
| HeatSim | A server (Python) | Real, per run |
| Report | A server | Small |

Open, and Kyle wants to be ambitious here:

- **Visitors whose device cannot run FloodSim.** To be looked into: cloud GPUs; a coarse run downscaled; emulators trained per place. Until one exists, the site checks the device before it takes money and says plainly what will not run.
- **Speed.** Kyle wants coarse runs downscaled and, later, trained emulators for both models. That is engine work happening elsewhere. The site shows progress and saves runs to the account; no page depends on today's run times.
- **Cities with no published drain network.** The flood model runs mainly on the surface there. The place panel in section 5 says which case applies.

Run times seen so far, for scale only: on Kyle's GPU a 1-hour storm on a 1 m model of a few blocks took 53 to 71 seconds and a 24-hour storm 13 to 18 minutes (Climate Inspection `FLOOD-POC-RESULTS.md` section 2). A month of hourly air temperature for a 40 km area at 300 m took about 12 minutes (`HEAT-POC-RESULTS.md` section 10.1). No cloud GPU has been priced.

## 8. Privacy

- No account is needed to look a place up.
- The typed address goes from the visitor to SPARC's server and from there to the US Census Bureau's geocoder. It is not written to a database or a log by SPARC's code.
- The page address holds the block, not the house.
- Map tiles are fetched by the visitor's browser straight from USGS, FEMA, NOAA and MRLC, so those agencies see which map area is on screen.
- A spot clicked on the map goes to SPARC's server and from there to FEMA, USGS and the land cover server. It is not stored.
- Saved places, notes and the recently viewed list are kept in the visitor's browser and never sent to SPARC. They hold the block and the town's name, not an address.
- A paid report needs the real address. It stays private to the account that ordered it.

## 9. What the first version leaves out

Dollar figures; basement flooding; indoor heat; counts of hot days; FloodSim's engineering workbench as the default; the desktop-application account pages; published prices; terms of service changes; anything called validated.

## 10. The first draft in this pull request

Built:

- **Home:** a search box, the hazard table from section 4, and how it works.
- **Place page:** for any US address. A map with the place at the centre and switchable public layers (FEMA flood zones, sea level rise at three heights, tree canopy, paving, hurricane tracks). Cards for the FEMA flood zone, flood insurance claims in the census tract, federal disaster declarations in the county, and tropical cyclones that tracked nearby.
- **Paid shelves** on the place page and the models page, drawn as layouts with no numbers in them, using the site's placeholder register, with a "request a report" button.
- **Models, pricing and about pages** rewritten for the new direction.
- Old pages for the causal heat model removed and redirected.

Added in the second pass, after Kyle asked for a bigger map, a click to read any spot, a way to come back, and a list of everything a one-stop shop needs ([`roadmap.md`](roadmap.md)):

- **The map** takes a wider container and most of the window's height.
- **Click anywhere on the map** to read that spot: FEMA flood zone, ground elevation (USGS), tree canopy and paving (land cover survey).
- **The place at a glance:** the five headline records in one row under the title.
- **Every hazard FEMA rates:** FEMA's National Risk Index for the census tract, eighteen hazards, rating words only. The index's dollar figures are left out on purpose (agent's call, in line with the rule against loss figures).
- **Questions to take with you:** for the seller, the inspector and the insurer, chosen from what the record shows. Questions only; no statement about the house, the law or a cost.
- **Your places:** save a place with a note and a snapshot of that day's record; a recently viewed list; compare up to four places. All of it lives in the visitor's browser. No account, nothing sent to the server (agent's call: it works today and needs no database change; an account that carries it across devices comes next).
- **Copy link, and print or save as PDF.**

Added in the third pass ("finish the free tier"):

- **Tree canopy and paving as numbers:** the block against the square kilometre around it, with a bar for each.
- **Ground height:** how much higher or lower the block's typical ground is than the area's, and how much of the area lies lower.
- **A plain glossary** at `/glossary`: every term a place page uses, written from the publisher's own definition, linked and dated. Each card links to its entry.
- **A loading screen** that appears at once and names who is being asked. A first visit to a place takes a few seconds.
- The comparison and the questions list use the new numbers.

Not built yet, in rough order:

1. Our own copy of the slower sources, so a page does not depend on six public services answering live (see [`roadmap.md`](roadmap.md)).
2. Saved places carried by an account, across devices.
3. The place panel from section 5.
4. A sample report that can be shown publicly. The proof-of-concept report names its block and stays private.
5. FloodSim in the site, guided mode first.
6. HeatSim runs on a server.
7. Checkout.
8. The desktop-application pages under `/account` (downloads, devices, licence keys, seats) retired, and the sign-in and sign-up pages reworded. They still say "Request access to SPARC".
9. The privacy page brought up to date with section 8, when terms are written.
10. The old reader's guides in `docs/` (causal model, scenarios, uncertainty) removed or rewritten. They describe the retired product.

How the first draft was checked: type check, lint, the design gates and a production build all pass. The home page, a place page at desktop and phone width, the address search and each map layer were looked at in a headless browser on 17 November 2026, using public buildings as addresses. Nothing has been deployed.

Found on the way, not fixed here:

- `next build` stops every other run with a notice that the installed Next.js (16.4.3) has a known security advisory; 16.4.6 is current. `npm run security:audit` also fails on `main` for two unrelated packages (`ws`, `source-map-js`). Both need a dependency bump of their own.
- In development mode the site's own security header blocks the tools React needs, and without local Supabase settings the nav's sign-in status throws. Neither is new. The draft was previewed from a production build.
- The cookie notice says "no analytics" while the layout loads Vercel Analytics. Not checked further.

## 11. Sources used by the first draft

Each was opened and queried on 17 November 2026 before being used.

| What | Publisher | Service |
|---|---|---|
| Address to location and census tract | US Census Bureau | `geocoding.geo.census.gov/geocoder` |
| Flood zones and map panel dates | FEMA, National Flood Hazard Layer | `hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer` (layers 28 and 3) |
| Flood insurance claims | FEMA OpenFEMA, `NfipClaims` version 3 | `www.fema.gov/api/open/v3/NfipClaims` |
| Disaster declarations | FEMA OpenFEMA, `DisasterDeclarationsSummaries` version 2 | `www.fema.gov/api/open/v2/DisasterDeclarationsSummaries` |
| Hurricane and tropical storm tracks | NOAA National Hurricane Center, HURDAT2 | `www.nhc.noaa.gov/data/hurdat/` (Atlantic 1851 to 2025, Northeast and Central Pacific 1949 to 2025) |
| Sea level rise | NOAA Office for Coastal Management | `coast.noaa.gov/arcgis/rest/services/dc_slr` |
| Hazard ratings for the tract | FEMA, National Risk Index (version December 2025) | `services.arcgis.com/XG15cJAlne2vxtgt/.../National_Risk_Index_Census_Tracts/FeatureServer/0` |
| Ground elevation at a clicked spot | USGS 3D Elevation Program | `epqs.nationalmap.gov/v1/json` |
| Ground height of the block and the area | USGS 3D Elevation Program | `elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer` |
| Tree canopy and paving of the block and the area | National Land Cover Database 2021 | `www.mrlc.gov/geoserver/mrlc_download/wcs` |
| Tree canopy and paving | USGS and partners, NLCD 2021 | `www.mrlc.gov/geoserver/mrlc_display/wms` |
| Base map | USGS, The National Map | `basemap.nationalmap.gov` |

The map is drawn with maplibre-gl 6. Releases up to 6.4.0 carry a critical advisory (GHSA-jrc7-96c5-q579), so the older single-file builds are not used; version 6 needs its worker script served by the site, which `scripts/copy-map-worker.mjs` does before every `dev` and `build`.

Two things found while testing:

- FEMA's map server drops connections when asked many things at once. The site keeps each answer for a day and shows "did not answer, try again" for a card whose source is down, without failing the page.
- NOAA's sea level rise service cannot reliably answer "is this point inside the mapped area". Sea level rise is therefore a map layer only, with no sentence about the place.
