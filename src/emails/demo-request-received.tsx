import * as React from "react";
import { Heading, Text } from "@react-email/components";
import { Layout } from "./_components/Layout";
import { color } from "./_components/tokens";
import { BRAND_SHORT, SITE_URL } from "@/lib/brand";

export interface DemoRequestReceivedProps {
  firstName?: string;
}

export const subject = () =>
  `Thanks — your ${BRAND_SHORT} demo request is in`;

export default function DemoRequestReceived({
  firstName = "there",
}: DemoRequestReceivedProps) {
  return (
    <Layout
      preview={`We received your ${BRAND_SHORT} demo request and will be in touch shortly.`}
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
        We got it.
      </Heading>
      <Text style={{ margin: "0 0 14px" }}>Hi {firstName},</Text>
      <Text style={{ margin: "0 0 14px" }}>
        Thanks for reaching out about {BRAND_SHORT}. Your request is in our
        queue — a real person will read it and follow up shortly to schedule a
        demo and answer any questions.
      </Text>
      <Text style={{ margin: "0 0 14px" }}>
        In the meantime, you can sign in or browse the product at{" "}
        <a href={`${SITE_URL}/login`} style={{ color: color.crimson }}>
          {SITE_URL.replace(/^https?:\/\//, "")}/login
        </a>
        .
      </Text>
      <Text style={{ margin: "18px 0 0", color: color.muted, fontSize: 13 }}>
        Replying to this email goes straight to the team.
      </Text>
    </Layout>
  );
}
