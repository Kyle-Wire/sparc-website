import * as React from "react";
import { Heading, Text, Section } from "@react-email/components";
import { Layout } from "./_components/Layout";
import { BrandButton } from "./_components/Button";
import { InfoTable } from "./_components/InfoTable";
import { color } from "./_components/tokens";
import { BRAND_SHORT, SITE_URL } from "@/lib/brand";

export interface SubscriptionReceiptProps {
  firstName?: string;
  planName: string;
  amount: string; // formatted, e.g. "$49.00"
  currency?: string;
  nextBillingDate?: string; // ISO or pre-formatted
  invoiceUrl?: string;
  manageUrl?: string;
}

export const subject = (props?: { planName?: string }) =>
  `Your ${BRAND_SHORT} ${props?.planName ?? ""} subscription is active`.replace(/\s+/g, " ").trim();

export default function SubscriptionReceipt({
  firstName = "there",
  planName,
  amount,
  currency = "USD",
  nextBillingDate,
  invoiceUrl,
  manageUrl = `${SITE_URL}/account/subscription`,
}: SubscriptionReceiptProps) {
  return (
    <Layout
      preview={`Your ${BRAND_SHORT} ${planName} subscription is active. Receipt enclosed.`}
    >
      <Heading
        as="h1"
        style={{
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          margin: "4px 0 14px",
          color: color.ink,
        }}
      >
        Subscription confirmed
      </Heading>
      <Text style={{ margin: "0 0 14px" }}>Hi {firstName},</Text>
      <Text style={{ margin: "0 0 18px" }}>
        Thanks for subscribing to {BRAND_SHORT} {planName}. Your account is
        active and ready to use. Here are the details for your records:
      </Text>
      <InfoTable
        rows={[
          { label: "Plan", value: <strong>{planName}</strong> },
          { label: "Amount", value: `${amount} ${currency}` },
          ...(nextBillingDate
            ? [{ label: "Next billing date", value: nextBillingDate }]
            : []),
        ]}
      />
      <Section style={{ margin: "22px 0 6px" }}>
        <BrandButton href={manageUrl}>Manage subscription</BrandButton>
      </Section>
      {invoiceUrl ? (
        <Text style={{ margin: "10px 0 0", fontSize: 13 }}>
          Need a receipt?{" "}
          <a href={invoiceUrl} style={{ color: color.crimson }}>
            Download your invoice
          </a>
          .
        </Text>
      ) : null}
      <Text style={{ margin: "18px 0 0", color: color.muted, fontSize: 13 }}>
        Questions about billing? Just reply to this email.
      </Text>
    </Layout>
  );
}
