import * as React from "react";
import { Heading, Text, Link } from "@react-email/components";
import { Layout } from "./_components/Layout";
import { color } from "./_components/tokens";
import { COMPANY } from "@/lib/brand";

// Sent when someone joins the house report waitlist (migration 0012). It says
// where they stand and how long that is likely to take, as arithmetic on our
// pace, not a promise, and how to leave.

export interface ReportWaitlistJoinedProps {
  name: string;
  address: string;
  /** The plain note from waitNote(): position, estimate, what happens next. */
  waitNote: string;
  /** Set when the wait is likely to miss the inspection deadline they gave. */
  deadlineWarning?: string;
  leaveUrl: string;
}

export const subject = () => `${COMPANY}: you are on the waitlist for a house report`;

export default function ReportWaitlistJoined({ name, address, waitNote, deadlineWarning, leaveUrl }: ReportWaitlistJoinedProps) {
  return (
    <Layout preview={`You are on the list for ${address}. Here is how long it is likely to be.`}>
      <Heading as="h1" style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", margin: "4px 0 14px", color: color.ink }}>
        You are on the list.
      </Heading>
      <Text style={{ margin: "0 0 14px" }}>
        Thank you, {name}. We have your place for a report on <strong>{address}</strong>.
      </Text>
      <Text style={{ margin: "0 0 14px" }}>{waitNote}</Text>
      {deadlineWarning ? (
        <Text style={{ margin: "0 0 14px" }}>
          <strong>{deadlineWarning}</strong>
        </Text>
      ) : null}
      <Text style={{ margin: "0 0 14px" }}>
        When your turn comes, we email you a link. Questions: reply to this email. A person reads it.
      </Text>
      <Text style={{ margin: "0 0 14px", color: color.muted }}>
        Changed your mind? <Link href={leaveUrl}>Leave the list</Link>. We then delete the address you gave us.
      </Text>
    </Layout>
  );
}
