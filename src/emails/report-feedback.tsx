import * as React from "react";
import { Heading, Text } from "@react-email/components";
import { Layout } from "./_components/Layout";
import { color } from "./_components/tokens";
import { COMPANY } from "@/lib/brand";

// Sent by hand, once, about 7 days after a report is delivered
// (scripts/report-order.ts feedback). Wording from
// business/17-reviews-and-consent.md: every buyer is asked, not only the
// happy ones; no reward; a quote only with written consent. The FTC consumer
// reviews rule (16 CFR 465) bans fake reviews, sentiment-dependent
// incentives and suppressing negative reviews.

export interface ReportFeedbackProps {
  /** Empty when the account has no name: the greeting is then "Hello". */
  firstName?: string;
  /** "November 30" */
  deliveredOn: string;
}

export const subject = () => `${COMPANY}: was your house report useful?`;

const QUESTIONS = [
  "Was anything in the report unclear?",
  "Did it change a question you asked, or a decision you made?",
  "What would you have paid for it?",
  "Who else should have one?",
];

export default function ReportFeedback({ firstName, deliveredOn }: ReportFeedbackProps) {
  return (
    <Layout preview="Four short questions. Answer as briefly as you like, or not at all.">
      <Heading as="h1" style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", margin: "4px 0 14px", color: color.ink }}>
        Was your report useful?
      </Heading>
      <Text style={{ margin: "0 0 14px" }}>{firstName ? `Hi ${firstName},` : "Hello,"}</Text>
      <Text style={{ margin: "0 0 14px" }}>
        You got your house report on {deliveredOn}. We are a small company and we would like to know honestly how it
        went, good or bad. Four questions; answer as briefly as you like by replying to this email:
      </Text>
      {QUESTIONS.map((q, i) => (
        <Text key={q} style={{ margin: "0 0 6px", paddingLeft: 4 }}>
          {i + 1}. {q}
        </Text>
      ))}
      <Text style={{ margin: "14px 0 14px" }}>
        If you are happy for us to quote what you write on our site, with your first name and city, say so. If not, we
        will not, and it helps just the same. There is no reward for replying and none for saying something nice.
      </Text>
      <Text style={{ margin: "0 0 0" }}>
        Thank you,
        <br />
        Kyle, {COMPANY}
      </Text>
    </Layout>
  );
}
