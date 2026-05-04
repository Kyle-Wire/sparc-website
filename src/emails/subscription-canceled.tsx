import * as React from "react";
import { Heading, Text, Section } from "@react-email/components";
import { Layout } from "./_components/Layout";
import { BrandButton } from "./_components/Button";
import { InfoTable } from "./_components/InfoTable";
import { color } from "./_components/tokens";
import { BRAND_SHORT, SITE_URL } from "@/lib/brand";

export interface SubscriptionCanceledProps {
  firstName?: string;
  planName: string;
  endsOn: string; // pre-formatted date — when access ends
  reactivateUrl?: string;
}

export const subject = () =>
  `Your ${BRAND_SHORT} subscription has been canceled`;

export default function SubscriptionCanceled({
  firstName = "there",
  planName,
  endsOn,
  reactivateUrl = `${SITE_URL}/account/subscription`,
}: SubscriptionCanceledProps) {
  return (
    <Layout
      preview={`Your ${BRAND_SHORT} ${planName} subscription is canceled. Access continues until ${endsOn}.`}
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
        Subscription canceled
      </Heading>
      <Text style={{ margin: "0 0 14px" }}>Hi {firstName},</Text>
      <Text style={{ margin: "0 0 18px" }}>
        We&rsquo;ve canceled your {BRAND_SHORT} {planName} subscription. You
        will continue to have full access until <strong>{endsOn}</strong>, after
        which your account will switch to the free Wander tier.
      </Text>
      <InfoTable
        rows={[
          { label: "Plan", value: <strong>{planName}</strong> },
          { label: "Access ends", value: endsOn },
          { label: "Status", value: "Canceled — no further charges" },
        ]}
      />
      <Section style={{ margin: "22px 0 6px" }}>
        <BrandButton href={reactivateUrl}>Reactivate</BrandButton>
      </Section>
      <Text style={{ margin: "18px 0 0", color: color.muted, fontSize: 13 }}>
        If this was a mistake, you can reactivate any time before your access
        ends and pick up exactly where you left off. We&rsquo;d also love to
        hear what made you cancel — reply to this email if you have a minute.
      </Text>
    </Layout>
  );
}
