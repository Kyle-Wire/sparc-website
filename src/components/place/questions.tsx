import type { PlaceRecord } from "@/lib/place/summary";

/**
 * Questions to take with you.
 *
 * What this is: a list of questions for the seller, the inspector and the
 * insurer, chosen from what the record shows for the place. Every item is a
 * question for someone who can answer it. None of them states a fact about
 * the house, a legal requirement or a cost, because this site knows none of
 * those; an item that needed such a claim to make sense was left out.
 *
 * The "because" line under a question quotes the record that prompted it, so
 * a reader can see why it is on their list and not on someone else's.
 */

interface Question {
  ask: string;
  because?: string;
}

interface Group {
  who: string;
  questions: Question[];
}

export function questionsFor(r: PlaceRecord): Group[] {
  const seller: Question[] = [
    { ask: "Has water ever come into the house, the basement, the crawl space or the garage? When, how deep, and what was done afterwards?" },
    { ask: "Has a flood insurance claim, or any insurance claim for water or storm damage, ever been made on this property?" },
    { ask: "Is the property insured against flood today, and what does the policy cost?" },
  ];
  const inspector: Question[] = [
    { ask: "Are there signs of past water: stains, a tide line, new drywall or paint low on the walls, rust on the furnace or water heater?" },
    { ask: "Where does roof and yard water go? Do the downspouts, the grading and the drains carry it away from the house?" },
    { ask: "Is there a sump pump, and a backflow valve on the sewer line? Do they work?" },
    { ask: "How old is the cooling system, how well is the top floor insulated, and which rooms take the afternoon sun?" },
  ];
  const insurer: Question[] = [
    { ask: "What would flood insurance cost for this address, and what would it cover?" },
    { ask: "What does the homeowner's policy exclude? Ask about flood, sewer backup, wind and anything this page shows for the area." },
  ];

  const sfha = r.zones.ok && r.zones.data.zones.some((z) => z.inSfha);
  if (sfha) {
    const because = "FEMA's map shows a Special Flood Hazard Area on this block.";
    seller.unshift({
      ask: "Is the house itself inside the Special Flood Hazard Area, and is there an elevation certificate for it?",
      because,
    });
    insurer.unshift({ ask: "Ask your lender whether it will require flood insurance for this property.", because });
  }

  if (r.claims.ok && r.claims.data.total > 0) {
    seller.push({
      ask: "Which streets and which houses nearby take water in a heavy storm? Ask the neighbours too.",
      because: `${r.claims.data.total.toLocaleString("en-US")} flood insurance ${r.claims.data.total === 1 ? "claim is" : "claims are"} on record in this census tract.`,
    });
  }

  if (r.storms.hurricanesNearby > 0) {
    inspector.push({
      ask: "How old is the roof, and has the house had wind or storm damage? Are there shutters or impact-rated windows?",
      because: `${r.storms.hurricanesNearby} ${r.storms.hurricanesNearby === 1 ? "storm has" : "storms have"} passed within 100 km at hurricane strength.`,
    });
  }

  if (r.risk.ok) {
    // Flood and hurricane already have their own questions above.
    const covered = new Set(["Coastal flooding", "Inland flooding", "Hurricane"]);
    for (const h of r.risk.data.hazards.filter((x) => x.rank >= 4 && !covered.has(x.hazard))) {
      insurer.push({
        ask: `Does the policy cover ${h.hazard.toLowerCase()} damage, and is there a separate deductible for it?`,
        because: `FEMA rates ${h.hazard.toLowerCase()} ${h.rating.toLowerCase()} for this census tract.`,
      });
    }
  }

  return [
    { who: "The seller, or the seller's agent", questions: seller },
    { who: "Your home inspector", questions: inspector },
    { who: "An insurance agent, and your lender", questions: insurer },
  ];
}

export function Questions({ record }: { record: PlaceRecord }) {
  const groups = questionsFor(record);
  return (
    <div className="questions">
      {groups.map((g) => (
        <section key={g.who} className="questions-group">
          <h3>{g.who}</h3>
          <ul>
            {g.questions.map((q) => (
              <li key={q.ask}>
                <span className="questions-box" aria-hidden />
                <span>
                  {q.ask}
                  {q.because && <small>On your list because: {q.because}</small>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
