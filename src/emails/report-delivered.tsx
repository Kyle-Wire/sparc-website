import * as React from "react";
import { Heading, Text } from "@react-email/components";
import { Layout } from "./_components/Layout";
import { BrandButton } from "./_components/Button";
import { color } from "./_components/tokens";
import { COMPANY, SITE_URL } from "@/lib/brand";

const nextStepsUrl = `${SITE_URL}/next-steps`;

// Sent when the charge for a finished report goes through and the report
// unlocks (scripts/report-order.ts deliver, or the webhook after a buyer pays
// from their account).

export interface ReportDeliveredProps {
  address: string;
  accountUrl: string;
  note?: string;
  /** What was charged, tax included, e.g. "$157.94". */
  amount?: string;
  receiptUrl?: string;
  testMode?: boolean;
}

export const subject = () => `${COMPANY}: your house report is ready`;

export default function ReportDelivered({ address, accountUrl, note, amount, receiptUrl, testMode }: ReportDeliveredProps) {
  return (
    <Layout preview={`The report for ${address} is in your account.`}>
      <Heading as="h1" style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", margin: "4px 0 14px", color: color.ink }}>
        Your report is ready.
      </Heading>
      <Text style={{ margin: "0 0 14px" }}>
        The report for <strong>{address}</strong> is in your account. Read the first page first: it says what each
        finding rests on, and what to check at the house.
      </Text>
      <Text style={{ margin: "0 0 14px" }}>
        Some findings may be hard to read. They show what our models show in the storms and hot spells we ran, not
        what will happen. If one worries you, <a href={nextStepsUrl}>here is what to do next</a>: who can check it,
        and what to ask them.
      </Text>
      {amount ? (
        <Text style={{ margin: "0 0 14px" }}>
          We charged your card {amount}{testMode ? " (test mode: no money moved)" : ""}.
          {receiptUrl ? <> Your receipt: <a href={receiptUrl}>{receiptUrl}</a></> : null}
        </Text>
      ) : null}
      {note ? <Text style={{ margin: "0 0 14px" }}>{note}</Text> : null}
      <BrandButton href={accountUrl}>Open your report</BrandButton>
      <Text style={{ margin: "18px 0 0", fontSize: 13, color: color.muted }}>
        Questions about anything in it: reply to this email. A person reads it.
      </Text>
    </Layout>
  );
}
