# Website handoff

**18 November 2026.** Written by the agent that built the redesign, for Kyle and for whoever works on the site next. It says where the site stands, where it is heading, what to work on, and what is wrong or unfinished. Where something was not checked, it says so.

Read with: [`design/site-redesign-brief.md`](design/site-redesign-brief.md) (the direction and whose decision each point was) and [`design/roadmap.md`](design/roadmap.md) (the full list of what a one-stop shop needs).

## 1. Where it stands

**Live:** https://www.sparclabs.co, deployed from `main` by Vercel. Merging any pull request deploys the site.

A visitor can type any US address and get a page for the block around it:

- a large map with public layers (FEMA flood zones, sea level rise, storm tracks, tree canopy, paving) and a click anywhere to read the flood zone, elevation, canopy and paving at that spot;
- cards for the FEMA flood zone, ground height, flood insurance claims, disaster declarations, nearby tropical storms, FEMA's rating of eighteen hazards, tree canopy and paving;
- questions to take to the seller, the inspector and the insurer, chosen from the record;
- save a place with a note, compare up to four, copy the link, print;
- a plain glossary.

The paid part (flood model, heat model, what-if projects) is drawn as empty layouts with an "Ask for a report" button that goes to the contact form. **Nothing is on sale. No model runs from the site.**

**Open pull requests, as of writing:**

| PR | What | State |
|---|---|---|
| 26 | The site's own copy of three FEMA tables, a data-sources page, a monthly refresh job | All checks pass. Ready to merge. |
| this one | Sign in hidden, privacy page made true, contact-form email made true, this document | See its own description. |
| 17 to 21 | Design-system work from October, before the redesign | Not looked at. They were written against the old pages and probably no longer apply. Close or redo. |
| 15 | An October security bump for two packages | Overtaken by PR 23, which cleared the same advisories. Close. |

## 2. Where it is heading

Kyle's goal: "make planning available to everyone." A person buying or owning a home should leave able to say three things:

1. **I know what has happened here.** The public record, free, in plain words. This is built.
2. **I know what could happen here.** Our flood and heat models for the neighbourhood, with how sure each finding is. Paid. Not on the site yet.
3. **I know what to ask and what I could do.** Questions (built), then projects tried in the model, then a report.

Each hazard has three shelves: on record (free), modelled (paid), what if (paid). Flood and heat are there. Ground movement (from satellite radar) and wind are planned as two more rows.

**Rules that do not bend.** They come from Kyle and from the product work in the Climate Inspection repo.

- It is a screening tool. Not for engineering decisions.
- Free is public data only. The models, and satellite surface temperature, are paid.
- No dollar figures: no expected loss, no premiums, no payback.
- Nothing is called validated unless it has been compared with a measurement at that place.
- A panel with no run behind it shows no numbers. The build checks this (`npm run check:design`).
- The block, not the house. An address is used to find the place and is not kept.
- When a source is cited, it was opened. Definitions are the publisher's own.
- Nationwide. Do not design around one city or one storm.

## 3. How it is built

| Where | What |
|---|---|
| `src/app/page.tsx` | Home: the address search |
| `src/app/place/[slug]/` | A place page. The slug is a latitude and longitude rounded to three decimals |
| `src/app/compare`, `places`, `glossary`, `models`, `pricing`, `about`, `contact`, `privacy` | The other pages |
| `src/app/api/geocode`, `api/inspect` | Address to block; map click to what is at that spot |
| `src/lib/place/` | One file per source: `census`, `fema`, `openfema`, `nri`, `hurricanes`, `point`, `surroundings`. `summary.ts` gathers them. `lookup.ts` is the one way to ask a source, with retries |
| `src/components/place/` | The map, cards, questions, saved places |
| `src/components/system/placeholder.tsx` | The "no numbers here" panel used for the paid shelves |
| `src/data/` | Committed copies of public data, each with a manifest: hurricane tracks, and (after PR 26) FEMA's tables |
| `scripts/` | Data builders, the map-worker copy, the design gates |
| `.github/workflows/ci.yml` | Type check, lint, build, design gates, security audit on every push |

Hosting is Vercel. Supabase holds accounts and contact messages. Resend sends email. Lemon Squeezy is wired for billing and switched off.

## 4. Working on it

- **Preview from a production build, not `npm run dev`.** Dev mode is blocked by the site's own security header and by missing local Supabase settings. Write a temporary `.env.local` with placeholder `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, run `npm run build`, then `npx next start -p 3100`. Delete the file afterwards.
- **The map needs a real browser.** It is WebGL. Headless Edge with `--enable-unsafe-swiftshader` draws it.
- **Go easy on the agencies.** FEMA's map server, FEMA's open data service and the USGS elevation service all refused one machine after a few dozen test lookups. They recover in a minute or so. A failed card during testing is usually that, not a bug.
- **`fema.gov` pages refuse scripts** but open in a browser.
- **Before a pull request:** `npm run typecheck`, `npm run lint`, `npm run check:design`, `npm run build`, `npm run check:placeholders:rendered`, `npm run security:audit`.
- **Pull requests for Kyle:** always based on `main`, never stacked on another open branch, and the first line of the description says whether it is the only thing to merge. Say plainly whether it is safe to merge. Kyle merges; nobody else does.
- **Never open** `Insar_Pipeline_KF` or anything from Kleinfelder. Do not copy code from FloodSim, HeatSim or sparc-resilience into this repo.

## 5. What to work on, in order

1. **Merge PR 26, then switch on one GitHub setting** (Settings, Actions, General, Workflow permissions, "Allow GitHub Actions to create and approve pull requests"). Run the "data refresh" job once by hand from the Actions tab to see it work. *Done when* a pull request titled "Data: copy of FEMA tables" appears.
2. **Kyle's own test of the live site** (the list is in section 8). *Done when* anything wrong for a block he knows is written down and fixed or explained.
3. **Protect the two open lookups.** `/api/geocode` and `/api/inspect` pass requests on to public agencies. Rate limiting only switches on if the Upstash settings exist in Vercel, and whether they do was not checked. *Done when* a burst from one visitor is refused before it reaches an agency.
4. **FloodSim in the site, guided.** Pick a preset storm, watch the water, read findings with their confidence labels. Check the visitor's device before anything is paid for. This is the first thing nobody else offers, and it depends on engine work in the FloodSim repo. *Done when* a visitor with a capable laptop can run one storm for their block from a place page.
5. **A sample report that can be shown publicly.** The proof-of-concept report names its block and stays private. *Done when* the models page links to a real report for a place that can be shown.
6. **Accounts that do something:** saved places across devices. Then reword the sign-in and sign-up pages and put the links back.
7. **Cards that arrive one by one.** Today the page waits for every source before showing anything but the loading screen. *Done when* the map and the quick cards appear at once and slow ones fill in.
8. **Terms, and a lawyer's read of the privacy page.**
9. **HeatSim on a server,** then the heat shelf.

## 6. What is wrong or unfinished

**Could break for a visitor**

- **Three sources are still asked live on a first visit:** flood zones, ground height, land cover. If the agency does not answer, the card says so and offers "Try again" (after PR 26). Under real traffic this will happen. A real fix needs paid storage.
- **The contact form was not tested on the live site.** If a Turnstile secret is set in Vercel, the form will be refused, because the page has no Turnstile widget. Send one message through it to find out.
- **The contact form keeps one message per email address.** A second message from the same person replaces the first in the database (the notification email still arrives).
- **FEMA's claims download is slow and breaks off.** One complete copy took three tries. A monthly refresh may fail and need running again.
- **First visit to a place takes 3 to 6 seconds.** Comparing four new places takes 10 to 20 seconds with no loading screen.

**Says something untrue or out of date**

- `/terms` and `/data-use` were written for the old product and have not been read since the redesign.
- `/login` and `/signup` still read "Request access to SPARC". They are no longer linked from the menus.
- The pages under `/account` (downloads, devices, licence keys, seats, usage) are for a desktop application that does not exist.
- Seven of the eight email templates in `src/emails` are for the old product (welcome, subscription receipts and so on). Only the contact-form reply was rewritten. Whether any of the others can still be sent was not checked.
- `docs/*.md` outside `docs/design` (what-is-sparc, scenarios, uncertainty and the rest), `TIER1_HANDOFF.md` and `CLOUDFLARE_VERCEL_DNS_SETUP.md` describe the old site.

**Not checked**

- Alaska, Hawaii and Puerto Rico beyond one page each. The land cover survey used covers the lower 48 only.
- The terms of use of each data source for a commercial site, and any limits on how often they may be asked.
- Whether census tract numbers from the Census Bureau's current geocoder always match the tract numbers in FEMA's tables.
- Accessibility. The map has one keyboard route ("Read the middle of this place") and no audit has been done.
- Printing on paper. Only the print preview was looked at.
- Any competitor's product.

**No tests.** Nothing in `src/lib/place` has a unit test: the coordinate rounding, the storm-distance maths, the small TIFF reader, the summaries. The build gates check design rules, not arithmetic. Worth adding before the models arrive.

## 7. Decisions waiting on Kyle

1. **"Ask for a report" is live.** Are you ready to receive requests, and what will you say to the first one?
2. **Counting visits.** Vercel's page-view counting is switched on for the live site. The privacy page now says so. Keep it, or remove it?
3. **Paid storage** for flood zones, elevation and land cover. Recommended: wait and see how often cards fail.
4. **Search engines.** Place pages are hidden from them on purpose. City pages that can be found are a separate decision.
5. **The October pull requests** (15, 17 to 21). Recommended: close them; redo what still matters against the new pages.
6. **What a report costs and what a subscription includes.** Nothing can go on sale until this is written down.

## 8. Test list for the live site

On a laptop first, then items 1, 2, 3 and 9 on a phone. Each line says what to do and what should happen.

1. **Your own block.** Type an address you know well. The page should name the right town. The address bar should show two numbers with three decimals, not the address. A dot should sit on the address. Does the record match what you know?
2. **Click the map.** Click a corner you know, then a spot you know is lower. Each should give a flood zone, an elevation, tree canopy and paving, and the lower spot should read lower.
3. **Layers.** Turn sea level rise to 6 ft near a tidal river or the coast and look for water. Turn on storm tracks: the map should zoom out and draw lines.
4. **The coast.** From the home page open "Charleston, SC". Expect Zone AE, several hundred flood insurance claims, and the 3 ft sea level layer covering streets.
5. **Inland.** Open "Sacramento, CA". Expect no storm tracks, an empty sea level layer, and a flood zone card that mentions a levee.
6. **Something that should fail politely.** Type "10 Downing Street, London": expect a sentence saying it was not found. Open `/place/0.000,0.000`: expect a not-found page.
7. **Questions.** They should read as sensible questions, and any that says "On your list because" should quote a figure from the page. "Print or save as PDF" should show cards and questions without the menu.
8. **Save and come back.** Save a place, add a note, close the tab, reopen the site. "Your places" should still have it.
9. **Compare.** Save a second place, tick both, press Compare. One column per place; each row says what area it describes.
10. **The contact form.** Send one message. You should see "Thank you" on the page, get an email that says "We have your message", and find the message in the inbox.

Most useful to hear back, in order: where the record is wrong for a block you know; what you expected to see and did not; sentences you read twice; anything slow.
