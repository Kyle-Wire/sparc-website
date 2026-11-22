# Brand and conversion brief

**22 November 2026.** Written by the branding thread after Kyle asked for a marketing and branding lead who uses "psychology tricks lol in a fun way", alongside a writer, a business/billing thread and a validation thread. Calls marked **agent's call** are open to Kyle. This brief sits on top of [`map-first-brief.md`](map-first-brief.md) and changes none of Kyle's decisions there (map-only home, mono plus one accent, sans plus mono, warm guide voice, the free/paid line and its no-pressure rules).

## 1. Positioning

**One idea:** *Your inspector checks the house. Who checks the block?*

A home inspection stops at the walls. Flood, heat, ground movement and wind start outside them, and the records about them are public but scattered. SPARC Labs reads the block for free and models the house for a fee.

- **Category we claim:** the outside-the-walls check for a home buyer. Not insurance, not a risk score, not engineering.
- **Against:** a listing's one flood-zone letter, and the "climate score" sites that give a house a single number. Our edge is the opposite of a single number: every record with its source, every model result with how much evidence stands behind it.
- **Product names (agent's call):** *the block record* (free) and *the house report* (paid). They pair, they say what each covers (area against house), and "report" avoids implying a licensed home inspection.
- **Personality:** a sharp friend who happens to know hydrology. Warm, a bit funny, allergic to hype. Brags about its receipts, including the failed ones.

## 2. Who, and the job they hire us for

| Who | Moment | Job |
|---|---|---|
| Buyer, under contract or close | Days before an offer or the inspection deadline | "Tell me what I'd regret not asking." |
| Owner | A storm, a hot summer, a neighbour's basement | "What's going on around my house, and what could I do?" |
| Agents, inspectors | Preparing a client | "Something I can hand over that I'd stand behind." |

## 3. Visual identity

Kept: ink and grey neutrals, the darkened crimson as the one action colour, Inter for text and JetBrains Mono for numbers and labels, publishers' own colours on map layers.

Added (`src/styles/brand.css`, `src/components/marketing/brand.tsx`):

1. **The hazard bar.** Four short segments in the four hazard hues, flood, heat, ground, wind, always in that order. The brand's signature: under a hero, on the link preview, above a closing call. Decoration only, never data.
2. **The stamp.** A mono, upper-case label in a 1 px frame, like the tag an inspector leaves on a meter. Used for section kickers, "open question", "paid · one house", verdicts. Its words carry the meaning.
3. **The property line.** A dashed lot with a house in it and the four hazards reaching in from outside. It is the positioning, drawn, and it is the hero art on `/how-it-works`.
4. **Ink bands.** Pages alternate paper and one inked band (the place page head, the hero, "things we will never tell you").
5. **Link preview** (`src/app/opengraph-image.tsx`): ink ground, hazard bar, the one question, the domain.

## 4. Page structure and the conversion path

The home page stays the map (Kyle). `/how-it-works` is the new marketing page, for anyone arriving from a link, a post or a search, and it is in the nav, the map menu and the footer.

```
arrive ─┬─ map (home) ── click/search ── pin card ── block record (place page) ── open question ── sample report ── report request
        └─ /how-it-works ── search ─────────────────┘
```

`/how-it-works`, in order: hero with the search box → what your block remembers → the two questions (free/paid) → three steps → receipts → things we will never tell you → closing search.

Place page additions: the **record meter** in the head and an **open question** line at the end of each hazard's free section, linking to the sample report (map-first brief s.7 rules 3 and 4, which were left for this pass).

## 5. The psychology, and the honesty rule each one keeps

Kyle asked for persuasion tricks "in a fun way". Each play below is a real, documented effect, used only in a way that stays true if the visitor looks behind it. The ban list in map-first brief s.7 rule 5 stands untouched.

| Play | Where | How we use it | The line we don't cross |
|---|---|---|---|
| **Curiosity gap** | Hero question; "what your block remembers" tiles | Ask the questions the record answers, without the answers, so the search is the only way to close the loop | The questions are ones the free record really answers for any US address |
| **Reciprocity** | Free block record, questions to take with you | Give the whole record away first, with no sign-up | Nothing blurred or cut short to make the paid part look better |
| **Endowed progress / Zeigarnik** | Record meter on the place page | Show what the public record answered for this block, and the four questions only a model can answer as open slots | The count is real lookups that came back; open slots are the four hazards, the same for every block |
| **Pratfall effect** | Receipts; "things we will never tell you" | Admit limits and failures loudly. Admitting a flaw makes a competent source more believable | Failures shown at the same size as passes; rungs never rolled into one score (validation thread's rules) |
| **Specificity and authority** | Source line under every tile and card | Name the agency and the dataset, not "trusted data" | Only sources we have opened |
| **Show, don't promise** | Every paid link goes to the sample report first | Remove uncertainty about what is being bought | The sample is layout until a public sample exists |
| **Loss framing, honest version** | "Find out before you sign" (writer's call on wording) | The real loss is not asking a question while you still can | No dollar figures, no fear words, no countdowns, no "safe" |
| **Commitment, small first** | Save this place, compare | A free, private micro-yes before any ask | Saved places stay in the browser; no email gate |
| **Anchoring** | Pricing (business thread) | Set the report beside what a buyer already spends on checks at closing, with sourced figures | Only figures with a cited source; no fake "was" prices |
| **Default and decoy** | Pricing (business thread) | One clearly recommended option among three | Every option is a real product someone would pick |
| **Social proof** | Reserved slot, empty today | Real quotes from real customers, with permission | No invented testimonials, counters or "people are viewing" |
| **Peak-end** | Closing section of every page | End on a light, warm line and one action | One action, no pop-up on exit |

Words never used, in any play (Climate Home Inspection `VALIDATION-STATUS.md` s.3.1): predicts, accurate, validated (of a result), safe, will flood, likely, risk score (ours), sinking, rising, any dollar figure, premium, loss, hot days.

## 6. Who owns what

- **Words:** the writer thread. Every marketing line is in `src/lib/copy/marketing.ts`; layout never holds copy.
- **Receipts:** the validation thread, in `src/lib/copy/receipts.ts` (from its PR 38). The page renders through `visibleReceipts()` so unmerged work stays hidden.
- **Pricing, checkout, account, Lemon Squeezy:** the business thread. This brief only links to `/pricing` and `/start`.
- **Identity, layout, conversion structure:** this brief.

## 7. Open

- The nav's "Ask for a report" button shows on pages with no house in view (map-first brief s.7 rule 6). It lives in `NavUserStatus.tsx`, next to the account work; left for the business thread.
- A per-place link preview (the block record as a shareable card) is the natural next play (curiosity plus sharing). It needs the records at preview time, which means our own copy of the map-shaped sources first.
- A public sample report with real numbers from a block Kyle is happy to show.
- The logo is unchanged. A wordmark that carries the hazard bar is worth a look once the copy settles.
