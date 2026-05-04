import * as React from "react";
import { Heading, Text, Section } from "@react-email/components";
import { Layout } from "./_components/Layout";
import { BrandButton } from "./_components/Button";
import { color, font } from "./_components/tokens";
import { BRAND_SHORT } from "@/lib/brand";

export interface PasswordResetProps {
  firstName?: string;
  resetUrl: string;
  expiresInMinutes?: number;
  requestIp?: string;
}

export const subject = () => `Reset your ${BRAND_SHORT} password`;

export default function PasswordReset({
  firstName = "there",
  resetUrl,
  expiresInMinutes = 60,
  requestIp,
}: PasswordResetProps) {
  return (
    <Layout
      preview={`Reset your ${BRAND_SHORT} password. Link expires in ${expiresInMinutes} minutes.`}
      footerNote="If you didn't request a password reset, you can ignore this email — your password won't change unless the link above is used."
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
        Reset your password
      </Heading>
      <Text style={{ margin: "0 0 14px" }}>Hi {firstName},</Text>
      <Text style={{ margin: "0 0 18px" }}>
        Click below to choose a new password for your {BRAND_SHORT} account.
        This link expires in {expiresInMinutes} minutes and can only be used
        once.
      </Text>
      <Section style={{ margin: "22px 0" }}>
        <BrandButton href={resetUrl}>Choose a new password</BrandButton>
      </Section>
      <Text style={{ margin: "0 0 8px", color: color.muted, fontSize: 13 }}>
        Or paste this URL into your browser:
      </Text>
      <Text
        style={{
          margin: "0 0 14px",
          fontFamily: font.mono,
          fontSize: 12,
          color: color.ink2,
          wordBreak: "break-all",
        }}
      >
        {resetUrl}
      </Text>
      {requestIp ? (
        <Text style={{ margin: "12px 0 0", color: color.muted, fontSize: 12 }}>
          Request originated from <span style={{ fontFamily: font.mono }}>{requestIp}</span>.
        </Text>
      ) : null}
    </Layout>
  );
}
