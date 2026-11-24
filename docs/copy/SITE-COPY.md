# Site copy, page by page

*22 Nov 2026. Copy agent, for Kyle. Voice rules: `VOICE.md`. Every claim is held to climate-home-inspection `docs/validation/VALIDATION-STATUS.md` (VS below) at `4c25efc`, and to the engine files named in the receipts table at the end. Lines marked **[ships when]** depend on work not yet merged; leave them out until it is.*

Pages already in code are edited in this PR (`src/lib/engines.ts`, `src/app/about/page.tsx`, `src/app/models/page.tsx`). The rest is copy ready to drop in. Who owns which file: branding owns layouts and `src/lib/copy/marketing.ts` (its lines get rewritten from this deck), business owns `/pricing` and `/start` (prices from there), validation owns `src/lib/copy/receipts.ts` (the "Passed / Not yet" lines below are offered to it as wording, not added here).

---

## Taglines (pick one; `SITE_TITLE` stays as it is until Kyle picks)

1. **Your flood zone is one letter. Your street has a whole story.**
2. **The public record, read for you. Our models, with the receipts.**
3. **A first look at flood, heat and ground around a home, with every limit on the label.**

**More in the same line (Kyle liked 1, 22 Nov 2026).** Each sets one official label against the fuller public record, and none promises an outcome:

4. Your flood zone fits in one letter. Your street needs a few more pages.
5. Zone X is a letter, not a forecast. Read the rest of the block.
6. The listing shows every room. None of the photos show where the water goes.
7. One letter from FEMA. A whole block of public record, free.
8. The listing shows the kitchen. We show the block.
9. Before you sign for the house, read the block.
10. Flood zone: one letter. Storms, ground, heat: the rest of the alphabet.
11. Your flood zone is one letter. Your block's record is the whole sentence.

Pairs well with branding's positioning line, "Your inspector checks the house. Who checks the block?": use 1 (or 4) as the map hero and branding's line on How it works.

Meta description (fits 155 characters): *Free flood, storm and ground records for any US address. Flood, heat and ground models of the block, each labelled with what it has been checked against.*

---

## Home map, the "?" panel

**What is this?**
Drop a pin on any US address. We pull what FEMA, USGS, NOAA and the land cover survey already publish about that block and put it on one map. Free, no account, no catch.

**And the paid part?**
Our own models of the neighbourhood: where water goes in a hard storm, how warm the street air gets at night, and whether the ground under the block moves differently from the ground around it. Each one comes with a label saying how much has been checked. Spoiler: nothing has been measured at your house yet, and we'll always say so.

**Is my address stored?**
No. It finds the block, then it's dropped. Pages and links carry the neighbourhood, not the house.

---

## About

**Hero.** Making the planning toolkit available to everyone.
**Lead.** SPARC Labs builds flood, heat, ground and wind models and puts the public record where a home buyer can actually read it. Founded in 2024 in Philadelphia. One person and a lot of benchmarks.

**Why this exists.**
A home is the biggest purchase most people make. Engineers and planners have tools for asking where storm water goes and how hot a street gets. A buyer mostly has a listing and a flood-zone letter. That gap is lowkey wild, and we want to close some of it.

The site does two things. It gathers what public agencies already publish about a place and shows it plainly, free. And it offers our own models of the neighbourhood around a property, so you can see what a hard storm or a hot week looks like there in the model, and try out what you could do about it.

It's a screening tool. It gives you more to go on before you talk to an inspector, an engineer or an insurer. It doesn't replace any of them.

**Principles.**
- **01 · Public data should be readable.** Flood maps, claims records and storm tracks are public. Most people never see them because nobody shows them where to look. Putting them on one page for any address is the free part, and it stays free.
- **02 · Findings first, receipts right behind.** A result leads with what it means. How much stands behind it, its limits and its sources sit one tap away, never hidden.
- **03 · Measured beats modelled, every time.** A model result that hasn't been compared with a measurement at the place says so, on the result, at full size. A panel with no run behind it shows no numbers, and the build checks that, not our good intentions.
- **04 · We post our misses.** When a model fails a check, the failure goes on the page next to the passes. You can't trust a scoreboard that only shows wins.
- **05 · A block, not a house.** An address finds the place and is dropped. Only a report you ask for is tied to a property, and it stays with you.

---

## Models page

**Hero kicker.** the models · paid · not on sale yet
**Hero.** What the public record can't tell you.
**Lead.** A flood zone is a line on a map. It doesn't say where the water goes on your street in a hard storm, how warm the block stays on a July night, or whether the ground under it moves differently from the ground around it. That takes a model of the neighbourhood. We built four.

### Level (flood, FloodSim engine)

Builds a 1 m model of the neighbourhood from public data (terrain survey, building outlines, streets, land cover, soils, official rainfall statistics) and follows the water through it street by street, on your own graphics card. One metre is the detail of the map, not its accuracy.

**Passed:** 88 of 94 of the UK Environment Agency's 2D flood benchmark checks against the spread of the professional packages; 22 of 22 exact pipe-and-street cases; a median difference under a centimetre from HEC-RAS (the US Army Corps model) on four of the same benchmark tests.
**Not yet:** against measured flood levels in real storms elsewhere, mostly beside rivers, it was off by 0.6 to 0.85 m, and its own bar is 0.15 m. In a Louisiana test tract it put water against almost no house where FEMA paid rain claims. Nothing has been measured at any house we report on, so every result is labelled exploratory.

### Sundial (heat, HeatSim engine)

Models street air temperature hour by hour, and PET, an outdoor comfort index, in sun, building shade and tree shade. Surface temperature measured by satellite sits beside it as a measurement, not a model.

**Passed:** at night, street air had an hourly error of about 1.46 K (2.6 °F) across 13 temperate cities, none in Philadelphia, each held out whole, against 1.86 K for the weather station alone. Those street sensors also helped develop the model, so treat it as a development score.
**Not yet:** in the afternoon it does no better than the weather station alone. It hasn't been checked against a street sensor in Philadelphia. PET has never been compared with a measurement. Indoor temperature isn't modelled at all.

### Plumb (ground movement, SPARC InSAR engine)

Reads how the ground under a block has moved over years from NASA's OPERA satellite radar product, which passes over on a regular repeat schedule, through cloud and at night. A reading covers about a hundred metres around the house, along the satellite's slanted line of sight, compared with the ground around it.

**Passed:** the engine's own record shows a pass against 7 GNSS stations around Houston (about 3 mm a year); the result files behind it are being restored.
**Not yet:** its checks against GNSS in Oklahoma, California and an Australian mine did not pass. At our places no GNSS check has been run, and a planted-movement test passed at one of three. The tools for the GNSS check are built and tested on made-up data, not yet on real radar. Exploratory throughout.

### Vane (wind, WindSim engine)

Two layers. **Layer 1** carries a storm's gusts in from the airport anemometers around a place, through the land cover upwind. **Layer 2** is a computational fluid dynamics model of wind between the buildings.

**Passed [ships when WindSim's Layer 1 branch merges]:** for ordinary storms (not thunderstorms), gusts carried in to an airport left out of the set landed within 25 % of what it measured for 87 to 98 % of storm-and-airport pairs, at six places with enough stations. Thunderstorm gusts passed at Miami only. This run came after two rule fixes, so a blind re-check is next.
**Not yet:** the step from an airport into a city street hasn't been tested, because that needs an anemometer in a city. The street model (Layer 2) passes the one-building wind-tunnel case and fails every case with more than one building, so it stays out of reports. Nothing about wind at a house is in a report yet.

### Said plainly (replaces the current list)

- **Not on the site yet.** None of the four runs from the site today. A report is run by hand when someone asks.
- **Nothing measured at your house.** No model has been checked against a measurement at any property we report on. Each result says how much stands behind it.
- **The neighbourhood, not the inside.** No basement, no first floor, no indoor temperature.
- **No dollar figures.** No expected loss, no premium, no payback.
- **Methods paper: coming.** A plain write-up of each model, what it was tested against and its margins. Until it's out, treat every result as a first look.

**What-if paragraph (replaces the one with "likely").** For heat, a project shows as a change across the neighbourhood, not a promise about one street. We're not promising an outcome. We're giving you a way to see the problem and what each option changes in the model.

---

## Report sample

**Hero.** How a report reads.
**Lead.** Findings first. How much stands behind each one, printed on it in words. Reasons, limits and sources at the back. This page is the layout; no finding on it is real.

**The cover line (every report).** A screening report. Every model result here is exploratory unless it says otherwise. No model was checked against a measurement at this house.

**The four labels, in buyer words.**
- *Held back*: a check hasn't passed, so you don't see it.
- *Exploratory*: the model passes its solver tests; no real-world check has met its own bar yet.
- *Screening-checked*: it met its bar against real measurements in places like this one, held out.
- *Field-checked here*: compared with a measurement at this place and passed a mark set in advance. The only time we say "validated", and only "validated at this place".

---

## Pricing (words only; numbers from the pricing thread)

**Hero.** The public record is free. The models are the paid part.
**Lead.** Looking up what's on record costs nothing and needs no account. Our flood, heat and ground models are what you pay for, one report at a time, or a subscription if you're testing your own projects.
**Under every price.** You're paying for model runs and a person reading them, not for a guarantee. Every result is labelled with how much stands behind it.

---

## FAQ

**Is this validated?**
Not at your house, and we won't say it is. Flood, heat and ground pass their solver tests; the wind street model doesn't yet. Some have real-world checks elsewhere (the receipts are on the Models page). "Validated" only shows up as "validated at this place", after a measurement there.

**So what's the point?**
A flood-zone letter tells you about the insurance map. This tells you, in the model, which side of the house water reaches in the model's hundred-year design storm, how warm the street air stays at night next to the rest of the city, and whether the block's ground moves on its own. That's a better set of questions to bring to an inspector.

**Will my house flood?**
We can't tell you that, and anyone who says they can without a survey is guessing. We can tell you what water did around it in every storm we modelled.

**Does it work outside Philadelphia?**
The public-record map works for any US address. The models have been run at three test places so far, two in Philadelphia and one in Louisiana, and each new place gets its own checks.

**Why no risk score?**
A single score hides which model it came from and how much stands behind it. We'd rather show you three honest findings than one confident number.

**What about wind?**
Coming. Regional storm gusts are close; the between-the-buildings model is still in the wind tunnel and stays there until it passes.

---

## Microcopy

| Where | Copy |
|---|---|
| Empty panel, no run | No run here yet, so no numbers. That's on purpose. |
| Section held back | Held back: this check hasn't passed here yet. Here's why. |
| Model failed a check at this place | The check of this answer failed here. It's shown, labelled, with the reason. |
| GPU check fails | Your graphics card can't run Level in this browser. Try Chrome or Edge on a desktop, or ask us to run it. |
| Request sent | Got it. A person reads every request. You'll hear back by email. |
| Footer line | A screening tool. Not an engineering study, not for engineering decisions. |

---

## Receipts: where each claim comes from

| Claim on the site | Source |
|---|---|
| FloodSim 88 of 94 EA checks | VS §1.1; `FloodSim/benchmarks/ea/results/score.txt`; total stated in `FloodSim/docs/METHODS.md:995` |
| 22 of 22 coupled cases | VS §1.1; `FloodSim/benchmarks/gatec/coupled/score.md` |
| Median difference under a centimetre from HEC-RAS (0.1 to 0.8 cm) | VS §1.1; `FloodSim/benchmarks/gatec/results/hecras-ea.json` |
| Off by 0.6 to 0.85 m against measured levels; bar 0.15 m | VS §1.1; `FloodSim/docs/ACCEPTANCE.md:49`, `benchmarks/validation/history.json` |
| Louisiana miss | VS §1.1; `docs/validation/THIRD-PLACE-NATIONAL.md:64` (CHI) |
| HeatSim night 1.46 K vs 1.86 K, 13 cities, development numbers | VS §1.3; `HeatSim/validation/results/rescore/b_0.5.0_hybrid_absolute.json`; `HeatSim/docs/model_card.md:39-41` |
| Day no better than station; no Philadelphia sensor; PET unchecked | VS §1.3; `HeatSim/docs/validation.md:62-65`, `model_card.md:46` |
| InSAR Houston pass, four fails | VS §1.5; `insar_pipeline/evidence.yaml:40-208` (stated: result files missing on disk) |
| Planted-movement test 1 of 3; GNSS not run at our places | VS §1.5; `docs/validation/GROUND-POC-RESULTS.md:87-111` (CHI) |
| GNSS tools built on synthetic data | CHI branch `claude/project-thread-dtcz3g`, commit `15a6519` (not merged) |
| Layer 1 87 to 98 % within 25 %, non-thunderstorm; Miami-only thunderstorm; calibration; city step untested | WindSim branch `claude/project-thread-fnbdyl`, `docs/validation.md` "Layer 1: run 4" (not merged) |
| Street CFD passes Case A only | VS §1.4; WindSim `CLAUDE.md` |
| Three test places | CHI `CLAUDE.md` |
| Founded 2024 | `src/lib/brand.ts` `FOUNDED_YEAR` (Kyle to confirm) |
| Address found, then dropped | existing About copy; `src/lib/place/coords.ts`, `src/app/api/geocode/route.ts` (to re-check against the code path) |
| "No run, no numbers" checked by the build | `npm run check:placeholders` (`scripts/check-placeholders.mjs`) |
