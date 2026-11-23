import * as React from "react";
import { Heading, Text } from "@react-email/components";
import { Layout } from "./_components/Layout";
import { BrandButton } from "./_components/Button";
import { color } from "./_components/tokens";
import { COMPANY } from "@/lib/brand";

// Sent when the report is finished but the card saved at order could not be
// charged. The report stays locked until the buyer pays from their account.
// It gives the card's own reason and asks for nothing but the payment.

export interface ReportPaymentNeededProps {
  address: string;
  /** The price before any sales tax, e.g. "$149". */
  amount: string;
  /** The card's own reason, e.g. "Your card has insufficient funds." */
  reason: string;
  accountUrl: string;
  testMode?: boolean;
}

export const subject = () => `${COMPANY}: your house report is ready to pay for`;

export default function ReportPaymentNeeded({ address, amount, reason, accountUrl, testMode }: ReportPaymentNeededProps) {
  return (
    <Layout preview={`The report for ${address} is finished. The card did not go through.`}>
      <Heading as="h1" style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", margin: "4px 0 14px", color: color.ink }}>
        Your report is finished.
      </Heading>
      {testMode ? (
        <Text style={{ margin: "0 0 14px", color: color.muted }}>This was a test-mode order. No money will move.</Text>
      ) : null}
      <Text style={{ margin: "0 0 14px" }}>
        The report for <strong>{address}</strong> is done, but the card you saved did not go through. Your bank said:
        &ldquo;{reason}&rdquo;
      </Text>
      <Text style={{ margin: "0 0 14px" }}>
        Pay {amount} plus any sales tax from your account, with this card or another, and the report opens straight away.
      </Text>
      <BrandButton href={accountUrl}>Pay and open the report</BrandButton>
      <Text style={{ margin: "18px 0 0", fontSize: 13, color: color.muted }}>
        Something wrong? Reply to this email. A person reads it.
      </Text>
    </Layout>
  );
}
