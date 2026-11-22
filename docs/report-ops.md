# Making and delivering a house report

**22 November 2026.** The steps from an order (card saved, nothing charged) to a paid report in the buyer's account, who does each, and how long each takes. Read with [`payments.md`](payments.md) (how money moves) and Climate Home Inspection's `CLAUDE.md` and `AGENTS.md` (how the models run). This repository is public: no address, parcel number or report ever goes in it.

## The promise we have to keep

From `src/lib/payments/catalog.ts`: the report is finished within **10 working days** of the order, or the buyer may cancel and pays nothing. The card is charged only when `deliver` runs (see `payments.md`), so a late report costs the buyer nothing. The support inbox is still read every working day.

## Day by day

| Day | Step | Who | Time it takes |
|---|---|---|---|
| 0 | Stripe confirms payment. The order shows **Paid**; the buyer gets an email; the inbox gets one line with the order id | automatic | minutes |
| 0 to 1 | **Coverage check** (below). If a section cannot be made, tell the buyer now; if the report cannot be made at all, `cannot-model` (nothing is charged) | person | 15 min |
| 1 | `report-order.ts start <id> "We have started on your report"`: the buyer sees **In progress** | person | 1 min |
| 1 | Write the private property key in Climate Home Inspection (`private/property-key-<ID>.json`, synthetic ID) and the place config (`configs/places/<block>.json`) | person | 30 min |
| 1 to 3 | **Flood:** set up the FloodSim project for the box, then `bash tools/gate2/stage_place.sh "<project>" <ida-event> "<ida-label>" <log>` (design storms, the site's past storm, sewer off). GPU, one job at a time; `wait_for_gpu.sh` queues it | machine, checked by a person | about 4 to 5 GPU hours a place (South Street: 29 runs in 4 h 12 min, `FLOOD-POC-RESULTS.md`) |
| 1 to 3 | **Heat:** HeatSim from the pinned clone for the place's month, then `heatsim street` | machine | 12 to 22 min CPU, plus the street layer |
| 3 to 4 | `bash tools/run_property.sh <ID>` (readings, evidence records, report), then `python tools/report/build_report.py <ID>` | machine | minutes |
| 4 to 5 | **Read the report before it leaves.** Checklist below | person | 30 to 60 min |
| 5 | Print to PDF, then `report-order.ts deliver <id> report.pdf`: the card is charged; the buyer gets an email and a download (or, if the card fails, a pay button) | person | 5 min |
| 6 to 10 | Slack for a failed run, a GPU queue or a question back from the buyer | | |

A place already modelled (the same block as an earlier order) skips the flood and heat runs and is a one-day job.

## Coverage check, before any work

Answer each from the address, and write the answers in the order note:

1. **In the United States?** Outside it, `cancel`.
2. **Flood:** 3DEP 1 m lidar covers the box? Buildings: OpenStreetMap, or the national footprints with `--buildings` where OSM has none (Climate Home Inspection D36). A historic storm the site's FloodSim list holds?
3. **Heat:** not over snow, not in complex terrain, not where a sea breeze front dominates (HeatSim's own limits). If it is, the heat section says so.
4. **Ground movement and wind** are not in reports yet. Say so if the buyer asks.

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
| The buyer says the report is wrong | Read it with them. Materially wrong about what it says it describes: refund (Terms) and log the fault in Climate Home Inspection |

## Capacity

One GPU and one person. At 4 to 5 GPU hours a new place and one to two hours of a person's time per order, the bottleneck is the person at about two to three orders a week alongside other work, and the GPU at about four new places a day if nothing else is running. Revisit before open sale.
