import * as React from "react";
import { Heading, Text, Link } from "@react-email/components";
import { Layout } from "./_components/Layout";
import { BrandButton } from "./_components/Button";
import { color } from "./_components/tokens";
import { COMPANY } from "@/lib/brand";

// Sent by scripts/waitlist.ts invite, in the order people joined. The place is
// held for INVITE_DAYS; after that it goes to the next person.

export interface ReportWaitlistInviteProps {
  name: string;
  address: string;
  email: string;
  orderUrl: string;
  /** "Tuesday, December 1": the last day the place is held. */
  holdUntil: string;
  /** "$149". */
  amount: string;
  deliveryDays: number;
  leaveUrl: string;
}

export const subject = () => `${COMPANY}: your place for a house report is open`;

export default function ReportWaitlistInvite({ name, address, email, orderUrl, holdUntil, amount, deliveryDays, leaveUrl }: ReportWaitlistInviteProps) {
  return (
    <Layout preview={`Your turn has come. We are holding a place for you until ${holdUntil}.`}>
      <Heading as="h1" style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", margin: "4px 0 14px", color: color.ink }}>
        Your turn has come.
      </Heading>
      <Text style={{ margin: "0 0 14px" }}>
        {name}, a place has opened for your report on <strong>{address}</strong>. We are holding it for you until{" "}
        <strong>{holdUntil}</strong>.
      </Text>
      <Text style={{ margin: "0 0 14px" }}>
        To order, sign in or make an account with this email address ({email}), so we know the place is yours. You save a
        card; nothing is charged until the report is ready, within {deliveryDays} working days. Then we charge {amount}{" "}
        plus any sales tax. If the report cannot be made, we charge nothing.
      </Text>
      <BrandButton href={orderUrl}>Order your report</BrandButton>
      <Text style={{ margin: "18px 0 14px" }}>
        No longer need it? Do nothing and the place goes to the next person after {holdUntil}, or{" "}
        <Link href={leaveUrl}>leave the list</Link> now. Questions: reply to this email. A person reads it.
      </Text>
      <Text style={{ margin: "0 0 14px", color: color.muted }}>We will not email you about this again unless you write to us.</Text>
    </Layout>
  );
}
