import * as React from "react";
import { Heading, Text } from "@react-email/components";
import { Layout } from "./_components/Layout";
import { color, font } from "./_components/tokens";
import { COMPANY } from "@/lib/brand";

// The automatic reply to anyone who sends the contact form.
//
// Rewritten 2026-11-18. It used to say "You're on the SPARC waitlist", that
// spatial scientists were being onboarded in batches, that a seat would be
// ready, and that build notes went out every other week. None of that is true
// of the site today: the contact form is where someone asks for a flood and
// heat report or asks a question, there is no waitlist, no seat and no
// newsletter. An automatic email is a commitment made to each person who
// writes in, so it says only what happens next: a person reads the message.
//
// The file and template keep the name "waitlist-confirmation" because the
// route, the database table and the email registry use it. Do not add a
// response time, a queue position or a promise of delivery here until someone
// is accountable for meeting it (the same rule as on /contact).

export interface WaitlistConfirmationProps {
  email: string;
  /** No longer shown: there is no queue. Kept so existing callers type-check. */
  position?: number;
  ticket?: string;
}

export const subject = () => `${COMPANY}: we have your message`;

export default function WaitlistConfirmation({ email, ticket }: WaitlistConfirmationProps) {
  return (
    <Layout preview={`${COMPANY} has your message. A person reads this inbox and will reply.`}>
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
        We have your message.
      </Heading>
      <Text style={{ margin: "0 0 14px" }}>
        Thank you for writing to {COMPANY}. One person reads this inbox, and we will reply to{" "}
        <strong>{email}</strong>.
      </Text>
      <Text style={{ margin: "0 0 14px" }}>
        If you asked for a flood and heat report: the models are not on the site yet, so a report is run by
        hand. We will tell you what we can and cannot model for the place before anything is agreed, and we
        will ask for the property&rsquo;s address by email if we go ahead.
      </Text>
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
        You can reply to this email to add anything. If you did not send us a message, ignore this one.
      </Text>
    </Layout>
  );
}
