import * as React from "react";
import { Heading, Text, Section, Link } from "@react-email/components";
import { Layout } from "./_components/Layout";
import { BrandButton } from "./_components/Button";
import { color } from "./_components/tokens";
import { BRAND_SHORT, SITE_URL } from "@/lib/brand";

export interface WelcomeProps {
  firstName?: string;
  dashboardUrl?: string;
  docsUrl?: string;
  downloadUrl?: string;
}

export const subject = () => `You're in — welcome to ${BRAND_SHORT}`;

export default function Welcome({
  firstName = "there",
  dashboardUrl = `${SITE_URL}/account`,
  docsUrl = `${SITE_URL}/docs`,
  downloadUrl = `${SITE_URL}/download`,
}: WelcomeProps) {
  return (
    <Layout
      preview={`Welcome to ${BRAND_SHORT}. Here's how to get started.`}
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
        Welcome to {BRAND_SHORT}.
      </Heading>
      <Text style={{ margin: "0 0 14px" }}>Hi {firstName},</Text>
      <Text style={{ margin: "0 0 14px" }}>
        Your account is live. {BRAND_SHORT} pairs a neural model with built-in
        causal inference so you can simulate adaptation, not just describe the
        world. Three things to do next:
      </Text>
      <Text style={{ margin: "0 0 8px" }}>
        <strong style={{ color: color.ink }}>1.</strong>{" "}
        <Link href={downloadUrl} style={{ color: color.crimson }}>
          Install the desktop app
        </Link>{" "}
        — runs locally, talks to a sidecar on :8008.
      </Text>
      <Text style={{ margin: "0 0 8px" }}>
        <strong style={{ color: color.ink }}>2.</strong>{" "}
        <Link href={`${SITE_URL}/account/api-keys`} style={{ color: color.crimson }}>
          Generate an API key
        </Link>{" "}
        and wire it into your pipeline.
      </Text>
      <Text style={{ margin: "0 0 18px" }}>
        <strong style={{ color: color.ink }}>3.</strong>{" "}
        <Link href={docsUrl} style={{ color: color.crimson }}>
          Skim the docs
        </Link>{" "}
        — start with the causal-graph quickstart.
      </Text>
      <Section style={{ margin: "22px 0" }}>
        <BrandButton href={dashboardUrl}>Open my dashboard</BrandButton>
      </Section>
      <Text style={{ margin: "0", color: color.muted, fontSize: 13 }}>
        Hit reply with any question — a real human reads it.
      </Text>
    </Layout>
  );
}
