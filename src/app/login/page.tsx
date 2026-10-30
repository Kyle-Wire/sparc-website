import Link from "next/link";
import { Suspense } from "react";
import { Nav, Footer } from "@/components/shell/Shell";
import { PageHero, Section } from "@/components/marketing/page-shell";
import { LoginForm } from "./login-parts";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <>
      <Nav />
      {/*
        The lead previously read "Sign in to manage your subscription, seats, license
        keys, and downloads." All four of those are things that do not exist: nothing
        on this site is for sale, seat invitations are withdrawn, no license key is
        issued or checked anywhere in the product, and there is no build to download.
        Do not restore a list of account capabilities here unless each one is real.
      */}
      <PageHero
        kicker="sign in"
        title="Welcome back."
        lead="An account records who has asked for access. There is no subscription to manage, no license key to retrieve and no build to download yet."
        accent="var(--purple)"
      />
      <Section>
        <div style={{ maxWidth: 460, margin: "0 auto" }}>
          <Suspense fallback={<div className="card" style={{ padding: 24 }}>Loading…</div>}>
            <LoginForm mode="signin" />
          </Suspense>
          <p style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: "var(--muted)" }}>
            Don&apos;t have an account? <Link href="/signup" style={{ color: "var(--ink)" }}>Request access →</Link>
          </p>
        </div>
      </Section>
      <Footer />
    </>
  );
}
