import * as React from "react";
import { Heading, Text } from "@react-email/components";
import { Layout } from "./_components/Layout";
import { BrandButton } from "./_components/Button";
import { color } from "./_components/tokens";
import { COMPANY } from "@/lib/brand";

// Sent once, when the buyer has saved a card for a house report (the webhook,
// on the order's move to "card_saved"). Nothing is charged yet: the card is
// charged when the report is ready (Kyle, 22 November 2026). It says only what
// will happen, and the one promise it makes is the one the Terms make: the
// report within the stated number of working days, or no charge.

export interface ReportOrderReceivedProps {
  address: string;
  /** The price before any sales tax, e.g. "$149". */
  amount: string;
  deliveryDays: number;
  accountUrl: string;
  testMode?: boolean;
  /** "Tuesday, December 8": the last day of the promise. */
  readyBy?: string;
  /** "Friday, December 4": the buyer's inspection deadline, if given. */
  deadline?: string;
  /** The deadline comes before readyBy. */
  tight?: boolean;
}

export const subject = () => `${COMPANY}: your house report is ordered`;

export default function ReportOrderReceived({ address, amount, deliveryDays, accountUrl, testMode, readyBy, deadline, tight }: ReportOrderReceivedProps) {
  return (
    <Layout preview={`We have your order for ${address}. A person starts on it next.`}>
      <Heading as="h1" style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", margin: "4px 0 14px", color: color.ink }}>
        Your report is ordered.
      </Heading>
      {testMode ? (
        <Text style={{ margin: "0 0 14px", color: color.muted }}>
          This was a test-mode order. No money will move.
        </Text>
      ) : null}
      <Text style={{ margin: "0 0 14px" }}>
        Thank you. We have your order for <strong>{address}</strong>. Nothing has been charged.
      </Text>
      <Text style={{ margin: "0 0 14px" }}>
        What happens next: a person checks what our models can cover at this place, then runs them. If something
        cannot be modelled there, we tell you before going on. When the report is ready, we charge the card you saved{" "}
        {amount} plus any sales tax, and the report opens in your account. That is within {deliveryDays} working days,
        or we charge nothing.
      </Text>
      {readyBy ? (
        <Text style={{ margin: "0 0 14px" }}>
          <strong>Ready by {readyBy}</strong> at the latest.
          {deadline && !tight ? ` You told us your inspection period ends ${deadline}.` : ""}
          {deadline && tight
            ? ` You told us your inspection period ends ${deadline}, which is sooner. We put orders with the nearest deadline first, and if we cannot make it we will tell you, so you can cancel and pay nothing.`
            : ""}
        </Text>
      ) : null}
      <Text style={{ margin: "0 0 14px" }}>
        You can cancel any time before the report is ready, and nothing is charged. Questions: reply to this email. A
        person reads it.
      </Text>
      <BrandButton href={accountUrl}>See your order</BrandButton>
    </Layout>
  );
}
