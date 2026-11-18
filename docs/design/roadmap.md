# Roadmap: a one-stop shop for buying and owning a home

**17 November 2026.** Written by the agent on Kyle's instruction: "develop a list of items that would really make this a one stop shop for people and leave them feeling confident with their decisions." It sits beside [`site-redesign-brief.md`](site-redesign-brief.md), which holds the direction. Kyle can strike or reorder anything here.

## The test for every item

Someone is about to spend more money than they ever have, on a place they have visited twice. They should leave this site able to say three things:

1. **I know what has happened here.** The record, in one place, in plain words.
2. **I know what could happen here.** A model of the neighbourhood, with how sure it is.
3. **I know what to ask and what I could do.** Questions for the seller, the inspector and the insurer; projects that would help; a way to come back to all of it.

An item earns its place if it moves a visitor toward one of those. Nothing goes on the site to look impressive.

## What would make a larger company notice

Not the number of layers. Four things which, as far as the agent knows, nobody offers together. That is a belief, not a finding: no competitor's product was opened and checked for this list.

- **The record is free and readable for any address**, with its source and date on every card, and no account.
- **The model is run for this neighbourhood, at street detail, and the buyer can change it.** A score for a property cannot be questioned. A model can be: change the storm, add a rain garden, watch what moves.
- **It says how sure it is, and what it cannot say**, on the finding itself. No score pretends to be a fact.
- **It does not sell the visitor.** No leads to agents, no address list, no advertising. The address is dropped after the lookup.

## Status key

**Built** in the open pull request · **Next** can be built now from public data or existing code · **Engine** waits on FloodSim, HeatSim or InSAR work · **Kyle** needs a decision, money or a legal answer · **Check** the source or licence has not been opened yet, so the item is an idea until it is.

## 1. Know the place: the record (free)

| Item | Status |
|---|---|
| FEMA flood zones, with the map panel date | Built |
| Flood insurance claims in the census tract, by year | Built |
| Federal disaster declarations for the county | Built |
| Hurricane and tropical storm tracks since 1851 | Built |
| Sea level rise at 1, 3 and 6 ft (map layer) | Built |
| Tree canopy and paving (map layers) | Built |
| FEMA's National Risk Index: eighteen hazards rated for the tract (wildfire, earthquake, tornado, heat wave, and the rest) | Built |
| Click anywhere on the map: flood zone, ground elevation, tree canopy and paving at that spot | Built |
| The place at a glance: the five headline records in one row | Built |
| Tree canopy and paving as numbers: the block against the square kilometre around it | Built |
| Tree canopy and paving against the whole city | Next |
| Ground height: the block against the square kilometre around it (is this block a low spot?) | Built |
| Sea level rise as a sentence for the block, not only a layer | Next (needs a different NOAA product; the map service cannot answer for a point) |
| Flood insurance policies in force nearby (how many neighbours carry it) | Next (OpenFEMA `NfipPolicies`) |
| Repeatedly flooded properties in the area, as a count | Next (OpenFEMA `NfipMultipleLossProperties`) |
| High-tide flooding days at the nearest tide gauge, past and projected | Check (NOAA CO-OPS) |
| Levees and dams upstream, and whether the block sits behind a levee | Check (National Levee Database, National Inventory of Dams) |
| Soils: drainage class, shrink and swell, depth to water table | Check (USDA SSURGO; FloodSim already reads it) |
| Wildfire: risk to homes and distance to past fire perimeters | Check (USFS Wildfire Risk to Communities; NIFC perimeters) |
| Earthquake: shaking hazard and mapped faults | Check (USGS) |
| Sinkholes and karst | Check (USGS; state surveys) |
| Radon zone | Check (EPA) |
| Contaminated sites nearby: Superfund, brownfields, underground tanks | Check (EPA) |
| Drinking water system and its violations | Check (EPA SDWIS) |
| Air quality: ozone and fine particles, and wildfire smoke days | Check (EPA AQS) |
| Typical summer heat and how it has changed: normals and trends at the nearest station | Check (NOAA) |
| Heat and health index for the ZIP code | Check (CDC) |
| Old maps: former streams, marsh and fill under today's streets | Check (USGS historical topographic maps) |
| Past storms at this place: the wettest days on record, named | Next (FloodSim already builds this list from NOAA and IEM data) |
| Local records where a city publishes them: 311 flooding reports, basement backups, sewer type | Check, city by city |

## 2. See what could happen: the models (paid)

| Item | Status |
|---|---|
| The shelves drawn as layout, with no numbers, until a run exists | Built |
| A report run by hand on request | Built (as a contact route) |
| FloodSim in the site, guided: pick a storm, watch the water, read the findings | Engine |
| Design your own storm; replay a named past storm; live radar ("is my street taking water now") | Engine |
| HeatSim on a server: street air temperature by day and night, comfort in sun and shade | Engine, Kyle (server cost) |
| Land surface temperature from satellite, block against neighbourhood and city | Engine |
| A device check before any payment: can this computer run the flood model | Next |
| Runs for people whose device cannot: cloud GPUs, downscaled coarse runs, emulators | Engine, Kyle |
| Ground movement from satellite radar, and the rate carried forward | Engine |
| Wind through the seasons, as a map | Engine |
| What the models have to work with here: terrain source and date, drain network or not, which model terms apply | Next (first version from public catalogues) |
| Future conditions: heavier rain and hotter summers, stated as scenarios with their source | Kyle (the directive rules out future-climate claims for now) |
| Basement and sewer backup | Engine |
| Indoor heat: what the house itself does with a hot week | Engine |

## 3. Decide: what to ask and what to do

| Item | Status |
|---|---|
| Questions to take with you: for the seller, the inspector and the insurer, chosen from what the record shows | Built |
| Print or save a place page | Built |
| What-if projects in the model: rain garden, French drain, less paving, rain barrels, trees, cool roof | Engine |
| The buyer report: findings first, evidence behind, what to check at the house | Engine (the generator exists in the Climate Inspection repo) |
| A public sample report | Kyle (the proof of concept names its block; needs a place that can be shown) |
| A plain guide to each project: what it is, where it works, who installs it, what permits it tends to need | Next (writing; each claim needs a source) |
| What flood insurance is, who must carry it, and how to get a quote | Next (writing, from FEMA's own pages; no premium figures) |
| Reading a seller's disclosure against the record: what each state requires a seller to tell you about flooding | Check (state law; needs care) |
| An owner's yearly check: before storm season, before summer | Next |
| Help finding a professional (inspector, drainage contractor, arborist) | Kyle (a referral business changes what the site is; the list above says it does not sell the visitor) |
| Dollar figures: loss, premiums, payback | Kyle (ruled out for now; see the financial modelling roadmap in the Climate Inspection repo) |

## 4. Come back: memory

| Item | Status |
|---|---|
| Save a place, with a note and a snapshot of what the record said that day | Built (kept in the browser, no account) |
| Recently viewed places | Built (kept in the browser; one button clears it) |
| Compare up to four places side by side | Built |
| An account that carries saved places across devices | Next (database migration to write and apply; Kyle applies it) |
| Run history: every model run kept with its storm, settings and result, reopenable | Engine |
| What changed since you saved it: a new FEMA map, a new declaration, a new claim year | Next |
| Alerts: a storm heading for a saved place; a flood map revision | Kyle (email sending, consent) |
| Share a place or a comparison with a partner, an agent or an inspector | Built for places (the link holds the block); reports later |
| A home's file: reports, runs, notes and photos for one property over years of ownership | Later |

## 5. Trust

| Item | Status |
|---|---|
| Source and date on every record card; "did not answer" instead of a blank when a source is down | Built |
| No numbers in a panel with no run behind it, checked by the build | Built |
| Address dropped after lookup; links hold the block; the exact point stays in the visitor's browser | Built |
| A methods paper for each model: what it is, what it has been tested against, its margins | Kyle, Engine |
| Confidence labels on every modelled finding, set by fixed rules | Engine (rules exist in the Climate Inspection repo) |
| A plain glossary: every term on a place page, from the publisher's own definition, linked and dated | Built |
| Our own copy of the slower sources (claims, declarations, hazard ratings, land cover), refreshed on a schedule, so a page does not wait on an agency's server or fail when one throttles | Next, Kyle (storage cost; the agencies throttled a single machine during testing) |
| A loading screen that names who is being asked, shown at once while a place is read | Built |
| Tell us what you saw: "this street floods", "it did not", with a date and a photo | Kyle (moderation, privacy; it is also the cheapest validation data there is) |
| Validation, published: every place where the model has been compared with a measurement, good and bad | Engine |
| A data log: when each source was last fetched and what version | Next |
| Who we are and how we are paid, in a paragraph | Next |
| Accessibility pass: keyboard map controls, screen reader text for every layer, contrast | Next |
| Spanish | Later |
| Terms, privacy policy, disclaimers | Kyle (said to come later) |

## 6. Reach

| Item | Status |
|---|---|
| A page an agent or inspector can send a client | Next (the place link already works for this) |
| An embeddable card for a listing page | Later |
| An interface for partners (lenders, listing sites, insurers) to request the record for a place | Kyle |
| City and neighbourhood pages that can be found by search | Kyle (place pages are hidden from search engines today, on purpose) |
| Coverage beyond the lower 48 for land cover; Alaska, Hawaii and Puerto Rico checked end to end | Next |

## Order suggested for the next three steps

1. ~~Numbers for trees, paving and ground height, and the plain glossary.~~ Done on 17 November 2026.
2. **Our own copy of the slower sources.** Every place page asks six public services live. In testing, FEMA and USGS both began refusing one machine after a few dozen lookups. This is what stands between the free tier and real traffic.
3. **An account for saved places** and the "what changed" check. They finish "come back".
4. **FloodSim guided mode in the site** with the device check. It is the first thing nobody else has.
