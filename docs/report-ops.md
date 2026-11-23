# Making and delivering a house report

**22 November 2026, updated 23 November** (charge on delivery, ground movement not sold until it passes, the atlas download, the buyer's inspection deadline, the weekly cap). The steps from an order (card saved, nothing charged) to a paid report in the buyer's account, who does each, and how long each takes. Read with [`payments.md`](payments.md) (how money moves) and Climate Home Inspection's `CLAUDE.md` and `AGENTS.md` (how the models run). This repository is public: no address, parcel number or report ever goes in it.

## The promise we have to keep

From `src/lib/payments/catalog.ts`: the report is finished within **10 working days** of the order (weekends and US federal holidays skipped, `src/lib/payments/turnaround.ts`), or the buyer may cancel and pays nothing. The card is charged only when `deliver` runs (see `payments.md`), so a late report costs the buyer nothing. The support inbox is still read every working day.

**The buyer's own deadline comes first.** The order form asks when their inspection period ends. Many are ten calendar days (the Pennsylvania standard form's default), shorter than our promise. If the deadline comes before our promise, the buyer was told so and ticked that they understand before saving a card. `list` sorts by whichever comes first, the deadline or the promise, and prints `INSPECTION DEADLINE` on those orders. Work them first, and if one cannot make its deadline, tell the buyer on day 1, not day 9.

## Day by day

| Day | Step | Who | Time it takes |
|---|---|---|---|
| 0 | The buyer saves a card at Stripe (setup mode). **Nothing is charged.** The order shows **Card saved**; the buyer gets "ordered, nothing charged"; the inbox gets one line with the order id. What they agreed to (`terms_version`, `agreed_at`) and their inspection deadline are on the order (`show <id>`) | automatic | minutes |
| 0 to 1 | **Coverage check** (below), and read the deadline. If a section cannot be made, tell the buyer now; if the report cannot be made at all, `cannot-model` (nothing is charged, the card is removed). If the deadline cannot be met, say so now and offer `cancel` | person | 15 min |
| 1 | `report-order.ts start <id> "We have started on your report"`: the buyer sees **In progress** | person | 1 min |
| 1 | Write the private property key in Climate Home Inspection (`private/property-key-<ID>.json`, synthetic ID) and the place config (`configs/places/<block>.json`) | person | 30 min |
| 1 to 3 | **Flood:** set up the FloodSim project for the box, then `bash tools/gate2/stage_place.sh "<project>" <ida-event> "<ida-label>" <log>` (design storms, the site's past storm, sewer off). GPU, one job at a time; `wait_for_gpu.sh` queues it | machine, checked by a person | about 4 to 5 GPU hours a place (South Street: 29 runs in 4 h 12 min, `FLOOD-POC-RESULTS.md`) |
| 1 to 3 | **Heat:** HeatSim from the pinned clone for the place's month, then `heatsim street` | machine | 12 to 22 min CPU, plus the street layer |
| 1 to 3 | **Ground movement:** only once a reviewed ground reading exists and has passed its checks (Climate Home Inspection `tools/gate4`). Ground stays in the product (Kyle, 22 November 2026), but the site does not sell it before it ships: until then the report says on its first page that ground movement is not in it yet (`REPORT.isNot` in `catalog.ts`) | machine, checked by a person | depends on the InSAR stack |
| 3 to 4 | `bash tools/run_property.sh <ID>` (readings, evidence records, report), then `python tools/report/build_report.py <ID>` | machine | minutes |
| 4 to 5 | **Read the report before it leaves.** Checklist below | person | 30 to 60 min |
| 5 | Print to PDF, then `report-order.ts deliver <id> report.pdf`: **now** the card is charged $149 plus sales tax; the buyer gets an email and a download (or, if the card fails, a pay link in their account, and the report stays locked until paid) | person | 5 min |
| 5 | The package (D47): `python tools/package/package.py --buyer <ID>`, zip the folder it writes under `private/package/` (it must hold `START-HERE.html`), then `report-order.ts package <id> atlas.zip`. The buyer gets a second download, "the offline atlas, prints and data", once the report is delivered and paid. Running it again replaces the zip, which is how an update reaches the account | person | 5 min |
| 6 to 10 | Slack for a failed run, a GPU queue or a question back from the buyer | | |

A place already modelled (the same block as an earlier order) skips the flood and heat runs and is a one-day job.

## Updates after delivery

Policy: `business/15-update-policy.md` (option B, 23 November 2026): corrections are free for as long as the company exists; engine or label changes that move a finding, and new hazards, are free for 12 months after delivery.

1. Rebuild the report in Climate Home Inspection with the version and one paragraph on what changed, and the date, on its first page.
2. `report-order.ts update <id> correction|change|hazard report-v1.1.pdf "what changed, in one or two plain sentences"`. A correction or a change is the next minor version (v1.1), a new hazard the next major (v2.0). Each version is a new file; the old ones stay in the buyer's account, and the script never overwrites one. The buyer gets an email; for a correction its first line says we found a mistake. Nothing is charged.
3. If the package changed too, run `package` again with the new zip.
4. A buyer who replies "no more updates": `report-order.ts stop-updates <id>`. `update` then refuses everything but corrections for that buyer, and refuses changes and new hazards after 12 months for everyone.

## Coverage check, before any work

Answer each from the address, and write the answers in the order note:

1. **In the United States?** Outside it, `cancel`.
2. **Flood:** 3DEP 1 m lidar covers the box? Buildings: OpenStreetMap, or the national footprints with `--buildings` where OSM has none (Climate Home Inspection D36). A historic storm the site's FloodSim list holds?
3. **Heat:** not over snow, not in complex terrain, not where a sea breeze front dominates (HeatSim's own limits). If it is, the heat section says so.
4. **Ground movement:** not sold yet. If a reviewed reading for the place has passed its checks, it may go in; otherwise the report says plainly that ground movement is not in it yet.
5. **Wind** is not in reports until it passes its checks (Climate Home Inspection D43). Say so if the buyer asks.

## Read-before-delivery checklist

- [ ] The cover carries the screening line, and every model figure carries its label and the engine's own error.
- [ ] No word from the banned list in `VALIDATION-STATUS.md` §3.1 (predicts, accurate, validated, safe, risk score, sinking, hot days, any dollar figure).
- [ ] Surface temperature, air temperature and PET each under their own heading.
- [ ] The engine commits on the sources page match the pins in `docs/product/DEPENDENCIES.md`.
- [ ] Every scenario run's `summary.json` names its scenario (FloodSim silently runs existing conditions for a folder name with spaces).
- [ ] The property is the one ordered: compare the address in the order with the private key, not from memory.

## When something goes wrong

| Problem | What to do |
|---|---|
| A run fails | `stage_place.sh` keeps finished runs; run it again to carry on |
| The GPU is busy for days | Tell the buyer the new date on day 5 at the latest; `cancel` if past day 10 and they ask |
| The report cannot be made | `report-order.ts cannot-model <id> "<why, plainly>"`: nothing is charged and the saved card is removed |
| The buyer says the report is wrong | Reply within the support reply time. Read it with them. Materially wrong about what it says it describes (wrong property, a number that does not match its own records, a missing label or limit): refund in full (Terms) and log the fault in Climate Home Inspection. A finding the buyer dislikes, or one a later storm contradicts, is not by itself materially wrong: explain the label and the limits, and log it as a model check |
| The buyer disputes the charge with their bank | Answer in the Stripe Dashboard with: the order's `agreed_at` and `terms_version` and the sentence they ticked (`AGREE_STATEMENT` in `catalog.ts`), the delivery email, and the download time. Never argue with the buyer by email while a dispute is open |
| Too many orders | Set `ORDERS_WEEKLY_CAP` (see `payments.md`). New buyers are told "not this week" before saving a card; nobody already in is affected |

## Capacity

One GPU and one person. Log the minutes each step takes on every soft-launch order (step, minutes, what slowed it); the real number decides the price of time, the weekly cap and what to automate first. At 4 to 5 GPU hours a new place and one to two hours of a person's time per order, the bottleneck is the person at about two to three orders a week alongside other work, and the GPU at about four new places a day if nothing else is running. Revisit before open sale.
