"use client";

import { useState } from "react";

/**
 * The inspection deadline on /report/buy. Optional. When the buyer's deadline
 * comes before the day we promise, we say so in plain words beside the field,
 * before any card is saved, and ask them to tick that they understand. The
 * server checks the same thing (src/lib/payments/order-input.ts), so a form
 * sent without this script is held to the same rule.
 *
 * `promisedBy` and `today` come from the server (src/lib/payments/turnaround.ts),
 * so the holiday calendar lives in one place.
 */
export function DeadlineField({
  today,
  promisedBy,
  promisedByText,
  workingDays,
  email,
}: {
  today: string;
  promisedBy: string;
  promisedByText: string;
  workingDays: number;
  email: string;
}) {
  const [deadline, setDeadline] = useState("");
  const tight = deadline !== "" && deadline >= today && deadline < promisedBy;

  return (
    <>
      <label className="label" htmlFor="b-deadline">
        When does your inspection period end? (optional)
      </label>
      <input
        id="b-deadline"
        name="deadline"
        type="date"
        className="input"
        min={today}
        value={deadline}
        onChange={(e) => setDeadline(e.target.value)}
        aria-describedby="b-deadline-hint"
      />
      <p id="b-deadline-hint" className="buy-hint">
        Many buyers have about ten days to inspect after an offer is accepted. We promise the report within{" "}
        {workingDays} working days, which for an order today is by <strong>{promisedByText}</strong>. Telling us your
        date helps us put the most urgent orders first.
      </p>
      {tight && (
        <div className="buy-deadline-warn" role="status">
          <p>
            <strong>Your deadline comes before the date we promise.</strong> We may not finish in time. A block we have
            modelled before can take a day or two; a new place takes longer. Before ordering you can write to{" "}
            <a href={`mailto:${email}?subject=${encodeURIComponent(`House report before ${deadline}`)}`}>{email}</a> and
            we will tell you honestly whether we can make it. If you order and we are late, you can cancel and pay
            nothing.
          </p>
          <label className="buy-agree">
            <input type="checkbox" name="deadline_ack" value="yes" required />
            <span>I understand the report may arrive after my inspection deadline.</span>
          </label>
        </div>
      )}
    </>
  );
}
