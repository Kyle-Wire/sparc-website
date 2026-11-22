import * as React from "react";
import { Heading, Text } from "@react-email/components";
import { Layout } from "./_components/Layout";
import { BrandButton } from "./_components/Button";
import { color } from "./_components/tokens";
import { COMPANY } from "@/lib/brand";

// Sent by scripts/report-order.mjs when a person marks a report delivered.

export interface ReportDeliveredProps {
  address: string;
  accountUrl: string;
  note?: string;
}

export const subject = () => `${COMPANY}: your house report is ready`;

export default function ReportDelivered({ address, accountUrl, note }: ReportDeliveredProps) {
  return (
    <Layout preview={`The report for ${address} is in your account.`}>
      <Heading as="h1" style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", margin: "4px 0 14px", color: color.ink }}>
        Your report is ready.
      </Heading>
      <Text style={{ margin: "0 0 14px" }}>
        The report for <strong>{address}</strong> is in your account. Read the first page first: it says what each
        finding rests on, and what to check at the house.
      </Text>
      {note ? <Text style={{ margin: "0 0 14px" }}>{note}</Text> : null}
      <BrandButton href={accountUrl}>Open your report</BrandButton>
      <Text style={{ margin: "18px 0 0", fontSize: 13, color: color.muted }}>
        Questions about anything in it: reply to this email. A person reads it.
      </Text>
    </Layout>
  );
}
