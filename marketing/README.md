# Street marketing kit

- `00-kit-overview.png`: every piece on one sheet.
- `01-street-strategy.md`: channels, sequence, budget tiers, Philly costs with sources, QR tracking.
- `02-talk-track.md`: openers, the bucket demo, the backyard story, hard questions.
- `print/`: vector PDFs to send to a printer. Cards, stickers and handout cards include a 0.125 in bleed (shelter 0.5 in); the flyer is plain letter size for a home printer.
- `preview/`: 300 dpi PNGs (large formats about 4000 px tall).
- `placements.csv`: one row per placed piece, to count scans.
- `src/build.py` + `src/render.cjs`: rebuild everything. `python3 src/build.py --code fl-07 && node src/render.cjs` tags every QR for one placement. Needs `pip install segno` and Node Playwright.

Print stock suggestions: cards 16 pt matte; handout cards 14 pt matte; stickers matte vinyl (weatherproof); booth sign on 3/16 in foam board. Every QR was decoded from the rendered PNGs before delivery.
Print only once the product is live: the what-if card presents the what-if tool as part of the house report.
Logo: `src/sparc-labs-mark.svg` (the cube mark, same file the reports use). Art: `src/iso.py` (abstract isometric block and yard).
Nothing has been ordered.

**Online kit (23 Nov):** `03-online-kit.md` (captions, bios, account setup, other channels) and `assets/online/` (LinkedIn and Instagram images). `assets/brand/` has the logo, hazard bar and art as separate SVG/PNG; `assets/street/` has every print piece as its own file. Rebuild the online set with `python3 src/social.py && node src/render_social.cjs`.

**In this repo:** `marketing/` sits outside `src/` and `public/`, is listed in `.vercelignore` and ignored by ESLint, so nothing here is deployed to sparclabs.co. `build/` and `build-social/` (intermediate HTML) are not committed; the scripts in `src/` recreate them.
