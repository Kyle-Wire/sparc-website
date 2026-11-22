import * as React from "react";
import { Heading, Text } from "@react-email/components";
import { Layout } from "./_components/Layout";
import { BrandButton } from "./_components/Button";
import { color } from "./_components/tokens";
import { COMPANY } from "@/lib/brand";

// Sent once, when the payment for a house report lands (the webhook, on the
// order's move to "paid"). It says only what will happen, and the one promise
// it makes is the one the Terms make: the report, or a full refund, within the
// stated number of working days.

export interface ReportOrderReceivedProps {
  address: string;
  amount: string;
  deliveryDays: number;
  accountUrl: string;
  receiptUrl?: string;
  testMode?: boolean;
}

export const subject = () => `${COMPANY}: your house report is ordered`;

export default function ReportOrderReceived({ address, amount, deliveryDays, accountUrl, receiptUrl, testMode }: ReportOrderReceivedProps) {
  return (
    <Layout preview={`We have your order for ${address}. A person starts on it next.`}>
      <Heading as="h1" style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", margin: "4px 0 14px", color: color.ink }}>
        Your report is ordered.
      </Heading>
      {testMode ? (
        <Text style={{ margin: "0 0 14px", color: color.muted }}>
          This was a test-mode order. No money moved.
        </Text>
      ) : null}
      <Text style={{ margin: "0 0 14px" }}>
        Thank you. We have your order for <strong>{address}</strong>, paid {amount}.
      </Text>
      <Text style={{ margin: "0 0 14px" }}>
        What happens next: a person checks what our models can cover at this place, then runs them. If something
        cannot be modelled there, we tell you before going on. You get the report in your account within{" "}
        {deliveryDays} working days, or your money back in full.
      </Text>
      <BrandButton href={accountUrl}>See your order</BrandButton>
      {receiptUrl ? (
        <Text style={{ margin: "18px 0 0", fontSize: 13, color: color.muted }}>
          Your receipt: <a href={receiptUrl}>{receiptUrl}</a>
        </Text>
      ) : null}
    </Layout>
  );
}
