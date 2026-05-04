import * as React from "react";
import { Heading, Text, Section } from "@react-email/components";
import { Layout } from "./_components/Layout";
import { BrandButton } from "./_components/Button";
import { color, font } from "./_components/tokens";
import { BRAND_SHORT } from "@/lib/brand";

export interface AccountConfirmationProps {
  firstName?: string;
  confirmUrl: string;
  expiresInHours?: number;
}

export const subject = () => `Confirm your ${BRAND_SHORT} account`;

export default function AccountConfirmation({
  firstName = "there",
  confirmUrl,
  expiresInHours = 24,
}: AccountConfirmationProps) {
  return (
    <Layout
      preview={`Confirm your ${BRAND_SHORT} account to start exploring spatial intelligence.`}
      footerNote="You're receiving this because someone — likely you — created an account at sparclabs.co. If it wasn't you, you can safely ignore this email."
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
        Confirm your email
      </Heading>
      <Text style={{ margin: "0 0 14px" }}>Hi {firstName},</Text>
      <Text style={{ margin: "0 0 18px" }}>
        Thanks for joining {BRAND_SHORT}. Confirm your email address to finish
        setting up your account and unlock the desktop app, API keys, and your
        seat dashboard.
      </Text>
      <Section style={{ margin: "22px 0" }}>
        <BrandButton href={confirmUrl}>Confirm my email</BrandButton>
      </Section>
      <Text style={{ margin: "0 0 8px", color: color.muted, fontSize: 13 }}>
        This link expires in {expiresInHours} hours. If the button doesn&rsquo;t
        work, paste this URL into your browser:
      </Text>
      <Text
        style={{
          margin: "0 0 4px",
          fontFamily: font.mono,
          fontSize: 12,
          color: color.ink2,
          wordBreak: "break-all",
        }}
      >
        {confirmUrl}
      </Text>
    </Layout>
  );
}
