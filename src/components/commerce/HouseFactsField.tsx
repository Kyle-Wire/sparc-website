import { BASEMENT_CHOICES, EARLIEST_YEAR, MAX_STOREYS } from "@/lib/payments/order-input";

/**
 * Four optional questions about the house on /report/buy. We ask the buyer
 * because the public records that hold these facts in Philadelphia are not
 * cleared for commercial use, and we use only open data. The report prints the
 * answers as the buyer's, not as something we inspected. The server checks the
 * same choices (src/lib/payments/order-input.ts).
 */
const BASEMENT_LABEL: Record<(typeof BASEMENT_CHOICES)[number], string> = {
  full: "Yes, under the whole house",
  partial: "Yes, under part of it",
  none: "No basement",
};

export function HouseFactsField({ thisYear }: { thisYear: number }) {
  return (
    <fieldset className="buy-facts" aria-describedby="b-facts-hint">
      <legend className="label">About the house (optional)</legend>
      <p id="b-facts-hint" className="buy-hint">
        If you know them from the listing or the seller, these help us read the flood and heat results for this house.
        Leave any you are not sure of blank. The report shows them as your answers; we do not inspect the house.
      </p>
      <div className="buy-facts-grid">
        <label className="buy-fact">
          <span>Basement</span>
          <select name="basement" className="input" defaultValue="">
            <option value="">Not sure</option>
            {BASEMENT_CHOICES.map((c) => (
              <option key={c} value={c}>
                {BASEMENT_LABEL[c]}
              </option>
            ))}
          </select>
        </label>
        <label className="buy-fact">
          <span>Central air conditioning</span>
          <select name="central_air" className="input" defaultValue="">
            <option value="">Not sure</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>
        <label className="buy-fact">
          <span>Year built</span>
          <input
            name="year_built"
            className="input"
            inputMode="numeric"
            pattern="\d{4}"
            min={EARLIEST_YEAR}
            max={thisYear + 1}
            placeholder="e.g. 1925"
          />
        </label>
        <label className="buy-fact">
          <span>Storeys above ground</span>
          <select name="storeys" className="input" defaultValue="">
            <option value="">Not sure</option>
            {Array.from({ length: MAX_STOREYS }, (_, i) => i + 1).map((n) => (
              <option key={n} value={String(n)}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
    </fieldset>
  );
}
