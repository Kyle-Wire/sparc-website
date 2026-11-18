# The cabinet frame

**18 November 2026.** Written by the agent. Kyle's decisions are marked **Kyle**; calls the agent made are marked **agent's call**, and Kyle can overrule any of them.

## 1. What was decided

The site takes the look of the InSAR Pipeline app (`insar_pipeline/app/app_assets/app.css`), but only as a **frame and labels** (**Kyle**, choosing between "frame and labels only" and "full cabinet"). Of the three directions that [`README.md`](README.md) listed as open (instrument / field report / cabinet), this one is cabinet.

What is carried over:

| From the app | On the site | Where |
|---|---|---|
| Pixel borders: four hard edges, no corners | Every card, panel, input and button, drawn with `box-shadow` so the layout does not move | `src/styles/cabinet.css`, "the frame" |
| Press Start 2P | Labels only: kickers, pills, table and legend heads, step numbers, form labels | "the labels" |
| Banners: the page inverted | One per page: `.page-hero` and the place page's head, ink ground and paper text | "the banner" |
| The mist (an interferogram drawn in the browser) | The banner's lower edge, a hovered button, the example-place chips | `src/components/system/Mist.tsx` |
| Hard drop shadow under a raised control; pressed state moves it | Buttons | "controls" |

What is not carried over (**agent's call**, following the research in section 3):

- No scanlines over the page, no blinking cursors on links, no second pixel font for body text.
- Body text and headings stay in Inter. The brand colours, the crimson accent button and the data ramps are unchanged. No brand hex was edited; three role tokens were added (`--ban`, `--ban-ink`, `--ban-muted`), and `check:colors` now holds them to 4.5:1 on ink.
- The mist is decoration under the same rule as the brand ramp: no text colour, no control boundary, no data encoding. It is drawn from a formula, never from a place's data.

**The base map is the USGS aerial photo in black and white, on every map, with no switch (Kyle, 18 November 2026: "Can we actually use just the black and white aerial? It looks a lot better.").** The topographic map and the Map / Aerial photo / Black and white controls were removed. The aerial carries no place names, so at national zoom the home map has no city or state labels. It works like a photo: zoom in to read the streets.

The font is copied from the app with its licence (`public/fonts/PressStart2P-OFL.txt`, SIL Open Font License 1.1).

## 2. Layout changes, measured

At a 1440 x 900 window, production build, before against after:

| Page | Height before | Height after | Map starts at |
|---|---|---|---|
| Home | 4,120 px | 3,529 px | the top (unchanged) |
| Place page (Charleston, SC) | 9,268 px | 7,189 px | 582 px, was below the fold |
| Home on a phone (375 px) | 7,524 px | 6,625 px | |

What moved:

- **Spacing comes from the `--space-*` scale.** Sections went from 80 + 80 px apart to 48 + 8 px when they share a ground. A full gap is kept where the ground changes (`section.band`).
- **Home.** The example places became a strip of chips under the map, replacing a 150 px band that held one line. The three shelf cards and the hazard table said the same thing twice, so they became one table whose column heads are the shelves. The screening note joined the "how it works" section, which now ends on two actions.
- **Place page.**
  - The title, the five headline records, the save/share buttons and the request for a report are one banner above the map.
  - "On this page" is a strip that stays under the nav.
  - Each hazard's two placeholder panels are now one strip. The strip says in words what a run would give and has one button; the panels open from it on a click.
  - Questions to take with you moved to the end, before the sources.
  - The full source table folds behind a click, since every card already names its source. It still prints in full.
- **Reading.** Body text went from 13 to 15 px. Card text is capped near 72 characters.
- **Phones.** The map legend starts closed. The five headline records are one row that scrolls sideways.
- **One accent per screen.** "Save this place" was a second crimson button on the place page and is now a plain one. The accent is left for "Get a report".

Two bugs were found and fixed on the way:

- `body { overflow-x: hidden }` made the body a scroll container, so nothing on the site could stick, the nav included. It is now `overflow-x: clip`.
- The `<section>` parts of the homes-for-sale panel carried a page section's 80 px of bottom padding.

## 3. The research behind it

Every source below was opened. A claim that could not be checked is marked as such and was not used.

- **Spacing is grouping.** Items close together read as one group. The fix for a busy page is tighter gaps inside a group and wider ones between groups, not less space overall. A border can do the grouping in place of a gap. Sources: [NN/g, proximity](https://www.nngroup.com/articles/gestalt-proximity/); [Laws of UX, common region](https://lawsofux.com/law-of-common-region/); [NN/g, white space in forms](https://www.nngroup.com/articles/form-design-white-space/). This is why the frame replaces padding, and why dividers inside a group are dashed while a group's edge is solid.
- **The first screen gets the most attention.** 57% of viewing time fell above the fold in 2018. A layout that looks finished stops the reader. Source: [NN/g, scrolling and attention](https://www.nngroup.com/articles/scrolling-and-attention/). Hence the map above the fold on the place page.
- **Skeletons mean "loading".** Source: [NN/g, skeleton screens](https://www.nngroup.com/articles/skeleton-screens/). The paid shelves are not loading, so the strip says "not run" in words instead of showing a grey layout.
- **One thing that differs is remembered**, and colour should not be the only cue. Source: [Laws of UX, von Restorff](https://lawsofux.com/von-restorff-effect/). Hence one accent button per screen, with the crimson paired with a hard ink shadow.
- **Fewer choices, deferred detail.** Sources: [Laws of UX, Hick's law](https://lawsofux.com/hicks-law/); [NN/g, progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/). Free records come first and paid layouts are one click down, with no third level.
- **First and last are recalled best, and an experience is judged by its end.** Sources: [Laws of UX, serial position](https://lawsofux.com/serial-position-effect/); [Laws of UX, peak-end](https://lawsofux.com/peak-end-rule/). The place page now ends on questions to take to a viewing, and the home page ends on two actions rather than a caveat.
- **Looks buy goodwill, which can hide problems in testing.** Source: [NN/g, aesthetic-usability effect](https://www.nngroup.com/articles/aesthetic-usability-effect/). Measure task success, not praise.
- **Credibility is read from the most prominent elements.** Sources: [NN/g, prominence-interpretation](https://www.nngroup.com/articles/prominence-interpretation-theory/); [NN/g, trustworthy design](https://www.nngroup.com/articles/trustworthy-design/). The pixel look stays in the frame and the labels, while the figures and the sources stay plain.
- **Brutalist styling works on the visuals, not on navigation or controls.** Source: [NN/g, brutalism](https://www.nngroup.com/articles/brutalism-antidesign/). Decorative fonts slow reading. Source: [NN/g, legibility](https://www.nngroup.com/articles/legibility-readability-comprehension/). Hence pixel type for labels only.
- **Line length is 50 to 75 characters.** Source: [Baymard](https://baymard.com/blog/line-length-readability). **Text spacing:** [WCAG 2.1 SC 1.4.12](https://www.w3.org/WAI/WCAG21/Understanding/text-spacing.html). The place page was tested with the 1.4.12 overrides: no clipped text and no sideways scroll.
- **Spacing on a 4/8 px grid.** Source: [Material Design (2014), metrics and keylines](https://m1.material.io/layout/metrics-keylines.html).

Not used: the claim that white space raises comprehension by about 20%. Its usual citation, Lin (2004), does not appear to support it, and no source with the figure could be opened.

## 4. Checks

`npm run check:design`, `npm run check:placeholders:rendered` (27 panels across 17 pages, no digits), `npm run lint`, `npm run typecheck` and `npm test` (25 of 25) pass.

Screens were checked at 1440, 768 and 375 px. The legend stays closed on a phone, and the nav and the place page's strip stay in view.

## 5. Open

- The heights in section 2 are for one place. A place with more storms or claims runs longer.
- Press Start 2P is set at 8 px, its own grid. No study of pixel-font legibility at that size was found. If Kyle or a reader finds the labels hard to read, the fallback is `--font-pixel: var(--font-mono)` in `cabinet.css`, which changes them all at once.
- Dark mode and the account pages were not part of this pass.
