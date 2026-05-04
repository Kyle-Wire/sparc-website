import * as React from "react";
import { Heading, Text } from "@react-email/components";
import { Layout } from "./_components/Layout";
import { color, font } from "./_components/tokens";
import { BRAND_SHORT } from "@/lib/brand";

export interface WaitlistConfirmationProps {
  email: string;
  position?: number;
  ticket?: string;
}

export const subject = () => `You're on the ${BRAND_SHORT} waitlist`;

export default function WaitlistConfirmation({
  email,
  position,
  ticket,
}: WaitlistConfirmationProps) {
  return (
    <Layout
      preview={`You're on the ${BRAND_SHORT} waitlist. We'll be in touch when your seat is ready.`}
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
        You&rsquo;re on the list.
      </Heading>
      <Text style={{ margin: "0 0 14px" }}>
        Thanks for joining the {BRAND_SHORT} waitlist. We&rsquo;re onboarding
        spatial scientists in batches as we expand sidecar capacity, and
        we&rsquo;ll reach out at <strong>{email}</strong> when your seat is
        ready.
      </Text>
      {typeof position === "number" ? (
        <Text style={{ margin: "0 0 14px" }}>
          You&rsquo;re currently <strong>#{position}</strong> in the queue.
        </Text>
      ) : null}
      {ticket ? (
        <Text style={{ margin: "8px 0 14px", fontSize: 13, color: color.muted }}>
          Reference:{" "}
          <span
            style={{
              fontFamily: font.mono,
              color: color.ink2,
              padding: "2px 6px",
              backgroundColor: color.paper2,
              borderRadius: 4,
            }}
          >
            {ticket}
          </span>
        </Text>
      ) : null}
      <Text style={{ margin: "12px 0 0" }}>
        In the meantime, we&rsquo;re sharing build notes and research updates
        roughly every other week. If you have a specific use case in mind, just
        reply to this email — it helps us prioritize.
      </Text>
    </Layout>
  );
}
