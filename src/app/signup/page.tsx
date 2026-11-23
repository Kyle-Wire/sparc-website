import type { Route } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Nav, Footer } from "@/components/shell/Shell";
import { PageHero, Section } from "@/components/marketing/page-shell";
import { safeNext } from "@/lib/safe-redirect";
import { LoginForm } from "../login/login-parts";

export const metadata = { title: "Create an account", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ next?: string }> };

export default async function SignupPage({ searchParams }: Props) {
  const next = safeNext((await searchParams).next, "");
  const carry = next ? `?next=${encodeURIComponent(next)}` : "";
  return (
    <>
      <Nav />
      <main id="main">
      <PageHero
        kicker="create account"
        title="Create an account."
        lead="An account is where your house reports live. Email and a password; we send one link to confirm the email. Looking up a place never needs one."
        accent="var(--crimson)"
      />
      <Section>
        <div style={{ maxWidth: 460, margin: "0 auto" }}>
          <Suspense fallback={<div className="card" style={{ padding: 24 }}>Loading…</div>}>
            <LoginForm mode="signup" />
          </Suspense>
          <p style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: "var(--muted)" }}>
            Already have an account? <Link href={(`/login${carry}`) as Route} style={{ color: "var(--ink)" }}>Sign in →</Link>
          </p>
        </div>
      </Section>
      </main>
      <Footer />
    </>
  );
}
