import type { Route } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Nav, Footer } from "@/components/shell/Shell";
import { PageHero, Section } from "@/components/marketing/page-shell";
import { safeNext } from "@/lib/safe-redirect";
import { LoginForm } from "./login-parts";

export const metadata = { title: "Sign in", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ next?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const next = safeNext((await searchParams).next, "");
  const carry = next ? `?next=${encodeURIComponent(next)}` : "";
  return (
    <>
      <Nav />
      <main id="main">
      {/*
        The lead previously read "Sign in to manage your subscription, seats, license
        keys, and downloads." All four of those are things that do not exist: nothing
        on this site is for sale, seat invitations are withdrawn, no license key is
        issued or checked anywhere in the product, and there is no build to download.
        Do not restore a list of account capabilities here unless each one is real.
        22 November 2026: an account now holds house report orders and their
        downloads (/account/reports), so the lead says that and nothing more.
      */}
      <PageHero
        kicker="sign in"
        title="Welcome back."
        lead="Your account holds your house reports: where each order is, and the finished report to download. Looking up a place never needs one."
        accent="var(--purple)"
      />
      <Section>
        <div style={{ maxWidth: 460, margin: "0 auto" }}>
          <Suspense fallback={<div className="card" style={{ padding: 24 }}>Loading…</div>}>
            <LoginForm mode="signin" />
          </Suspense>
          <p style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: "var(--muted)" }}>
            No account yet? <Link href={(`/signup${carry}`) as Route} style={{ color: "var(--ink)" }}>Create one →</Link>
          </p>
        </div>
      </Section>
      </main>
      <Footer />
    </>
  );
}
