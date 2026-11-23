import { Nav, Footer } from "@/components/shell/Shell";
import { PageHero, Section } from "@/components/marketing/page-shell";
import { PasswordForm } from "./password-form";

export const metadata = { title: "Choose a new password", robots: { index: false, follow: false } };

// Reached from a reset link (/login/forgot), which signs the buyer in first,
// or from the account page by anyone signed in. src/middleware.ts sends a
// visitor who is not signed in to /login.
export default function PasswordPage() {
  return (
    <>
      <Nav />
      <main id="main">
        <PageHero kicker="your account" title="Choose a new password." lead="At least 8 characters. You stay signed in on this device." accent="var(--purple)" />
        <Section>
          <div style={{ maxWidth: 460, margin: "0 auto" }}>
            <PasswordForm />
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
