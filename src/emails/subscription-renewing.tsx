import * as React from "react";
import { Heading, Text, Section } from "@react-email/components";
import { Layout } from "./_components/Layout";
import { BrandButton } from "./_components/Button";
import { InfoTable } from "./_components/InfoTable";
import { color } from "./_components/tokens";
import { BRAND_SHORT, SITE_URL } from "@/lib/brand";

export interface SubscriptionRenewingProps {
  firstName?: string;
  planName: string;
  renewsOn: string; // pre-formatted date string
  amount?: string;
  currency?: string;
  manageUrl?: string;
}

export const subject = (props?: { planName?: string; renewsOn?: string }) =>
  `Your ${BRAND_SHORT} ${props?.planName ?? ""} subscription renews soon`.replace(/\s+/g, " ").trim();

export default function SubscriptionRenewing({
  firstName = "there",
  planName,
  renewsOn,
  amount,
  currency = "USD",
  manageUrl = `${SITE_URL}/account/subscription`,
}: SubscriptionRenewingProps) {
  return (
    <Layout
      preview={`Heads up: your ${BRAND_SHORT} ${planName} subscription renews on ${renewsOn}.`}
      footerNote="You're receiving this transactional reminder so there are no surprises on your statement. To cancel or change plans, use the link above."
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
        Heads up — renewal coming
      </Heading>
      <Text style={{ margin: "0 0 14px" }}>Hi {firstName},</Text>
      <Text style={{ margin: "0 0 18px" }}>
        Your {BRAND_SHORT} {planName} subscription will renew automatically on{" "}
        <strong>{renewsOn}</strong>. No action is needed if you&rsquo;d like to
        keep going — we just wanted to give you a clear heads up.
      </Text>
      <InfoTable
        rows={[
          { label: "Plan", value: <strong>{planName}</strong> },
          { label: "Renews on", value: renewsOn },
          ...(amount
            ? [{ label: "Amount", value: `${amount} ${currency}` }]
            : []),
        ]}
      />
      <Section style={{ margin: "22px 0 6px" }}>
        <BrandButton href={manageUrl}>Manage subscription</BrandButton>
      </Section>
      <Text style={{ margin: "18px 0 0", color: color.muted, fontSize: 13 }}>
        Need to pause or cancel? You can do it from the dashboard above with one
        click — no email loop required.
      </Text>
    </Layout>
  );
}
