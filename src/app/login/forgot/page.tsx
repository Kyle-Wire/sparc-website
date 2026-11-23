import { Nav, Footer } from "@/components/shell/Shell";
import { PageHero, Section } from "@/components/marketing/page-shell";
import { ForgotForm } from "./forgot-form";

export const metadata = { title: "Reset your password", robots: { index: false, follow: false } };

// Until 24 November 2026 there was no way to reset a password, so a buyer who
// forgot theirs could not reach a report they had paid for. Supabase sends the
// link (resetPasswordForEmail); /auth/callback signs the buyer in with it and
// sends them to /account/password to choose a new one.
export default function ForgotPasswordPage() {
  return (
    <>
      <Nav />
      <main id="main">
        <PageHero
          kicker="sign in"
          title="Reset your password."
          lead="Give the email you signed up with. We send a link that lets you choose a new password and takes you back to your reports."
          accent="var(--purple)"
        />
        <Section>
          <div style={{ maxWidth: 460, margin: "0 auto" }}>
            <ForgotForm />
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
