import * as React from "react";
import { Heading, Text } from "@react-email/components";
import { Layout } from "./_components/Layout";
import { BrandButton } from "./_components/Button";
import { color } from "./_components/tokens";
import { COMPANY } from "@/lib/brand";

// Sent by hand when a new version of a delivered report is in the buyer's
// account (scripts/report-order.ts update). Policy: business/15-update-policy.md
// (option B, 23 November 2026). If a finding was wrong, the first line says so.
// It is about something the buyer bought, so it is a transactional message;
// a reply is still enough to stop updates, and corrections go regardless.

export interface ReportUpdatedProps {
  address: string;
  accountUrl: string;
  /** "1.1" */
  version: string;
  kind: "correction" | "change" | "hazard";
  /** One or two plain sentences: what changed and why. */
  whatChanged: string;
  /** "December 3, 2027": the end of the free update year. */
  updatesUntil?: string;
}

const FIRST: Record<ReportUpdatedProps["kind"], string> = {
  correction: "We found a mistake in your house report, and we have corrected it.",
  change: "Something we learned changes a finding in your house report, so we have updated it.",
  hazard: "Your house report has a new section.",
};

export const subject = (p?: ReportUpdatedProps) =>
  p?.kind === "correction"
    ? `${COMPANY}: a correction to your house report (v${p.version})`
    : `${COMPANY}: your house report is updated${p ? ` (v${p.version})` : ""}`;

export default function ReportUpdated({ address, accountUrl, version, kind, whatChanged, updatesUntil }: ReportUpdatedProps) {
  return (
    <Layout preview={`${FIRST[kind]} Version ${version} is in your account.`}>
      <Heading as="h1" style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", margin: "4px 0 14px", color: color.ink }}>
        {kind === "correction" ? "A correction to your report." : "Your report is updated."}
      </Heading>
      <Text style={{ margin: "0 0 14px" }}>
        <strong>{FIRST[kind]}</strong>
      </Text>
      <Text style={{ margin: "0 0 14px" }}>{whatChanged}</Text>
      <Text style={{ margin: "0 0 14px" }}>
        Version {version} of the report for <strong>{address}</strong> is in your account. Its first page says what
        changed and when. Your earlier versions stay there too; we never replace one quietly.
      </Text>
      <BrandButton href={accountUrl}>Open version {version}</BrandButton>
      <Text style={{ margin: "18px 0 0", fontSize: 13, color: color.muted }}>
        This costs nothing. Corrections are free for as long as {COMPANY} exists
        {updatesUntil ? <>, and other updates are free until {updatesUntil}</> : null}. If you would rather not hear
        about updates, reply &ldquo;no more updates&rdquo; and we will stop; we will still tell you if we find a
        mistake, because it is about something you bought. Questions: reply to this email. A person reads it.
      </Text>
    </Layout>
  );
}
