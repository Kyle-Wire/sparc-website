import * as React from "react";
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { color, font, GRADIENT_RAMP } from "./tokens";
import {
  BRAND_SHORT,
  COMPANY,
  COMPANY_LEGAL,
  COPYRIGHT_YEAR,
  DOMAIN,
  EMAIL_PRIMARY,
  OFFICE_FULL,
  SITE_URL,
} from "@/lib/brand";

export interface LayoutProps {
  preview: string;
  children: React.ReactNode;
  /** If provided, rendered as a small line under the footer (e.g. transactional context). */
  footerNote?: string;
}

const main: React.CSSProperties = {
  backgroundColor: color.paper,
  fontFamily: font.sans,
  margin: 0,
  padding: "32px 12px",
  WebkitFontSmoothing: "antialiased",
  color: color.ink,
};

const card: React.CSSProperties = {
  backgroundColor: color.white,
  border: `1px solid ${color.line}`,
  borderRadius: 12,
  maxWidth: 560,
  margin: "0 auto",
  overflow: "hidden",
};

const stripe: React.CSSProperties = {
  height: 6,
  background: GRADIENT_RAMP,
};

const headerSection: React.CSSProperties = {
  padding: "24px 28px 0",
};

const wordmark: React.CSSProperties = {
  fontFamily: font.mono,
  fontSize: 12,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: color.muted,
  margin: 0,
};

const wordmarkBrand: React.CSSProperties = {
  color: color.crimson,
  fontWeight: 700,
};

const body: React.CSSProperties = {
  padding: "20px 28px 28px",
  fontSize: 15,
  lineHeight: 1.6,
  color: color.ink,
};

const footer: React.CSSProperties = {
  padding: "20px 28px 28px",
  borderTop: `1px solid ${color.line}`,
  backgroundColor: color.paper2,
  fontSize: 12,
  lineHeight: 1.55,
  color: color.muted,
};

const footerLink: React.CSSProperties = {
  color: color.muted,
  textDecoration: "underline",
};

export function Layout({ preview, children, footerNote }: LayoutProps) {
  return (
    <Html>
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={card}>
          <div style={stripe} />
          <Section style={headerSection}>
            <Text style={wordmark}>
              <span style={wordmarkBrand}>{BRAND_SHORT}</span>
              {"  ·  "}
              {COMPANY.toLowerCase()}
            </Text>
          </Section>
          <Section style={body}>{children}</Section>
          <Section style={footer}>
            {footerNote ? (
              <Text style={{ margin: "0 0 10px", color: color.muted }}>
                {footerNote}
              </Text>
            ) : null}
            <Text style={{ margin: "0 0 4px" }}>
              <strong style={{ color: color.ink2 }}>{COMPANY}</strong>
              {"  ·  "}
              <Link href={SITE_URL} style={footerLink}>
                {DOMAIN}
              </Link>
            </Text>
            <Text style={{ margin: "0 0 4px" }}>{OFFICE_FULL}</Text>
            <Text style={{ margin: "0 0 10px" }}>
              <Link href={`mailto:${EMAIL_PRIMARY}`} style={footerLink}>
                {EMAIL_PRIMARY}
              </Link>
            </Text>
            <Hr
              style={{
                borderColor: color.line,
                margin: "12px 0",
                borderTop: `1px solid ${color.line}`,
              }}
            />
            <Text style={{ margin: 0, fontSize: 11 }}>
              © {COPYRIGHT_YEAR} {COMPANY_LEGAL}. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default Layout;
