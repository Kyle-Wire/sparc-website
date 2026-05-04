/* eslint-disable no-console */
// Render every React Email template in src/emails/* to a static HTML file
// under emails/dist/<name>.html. Variable props are passed as literal
// `{{handlebars}}` placeholders so the output can be pasted directly into
// the Resend dashboard's template editor.
//
// Run: npx tsx scripts/render-emails.ts

import { mkdir, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as React from "react";
import { render } from "@react-email/render";

import AccountConfirmation from "../src/emails/account-confirmation";
import Welcome from "../src/emails/welcome";
import PasswordReset from "../src/emails/password-reset";
import SubscriptionReceipt from "../src/emails/subscription-receipt";
import SubscriptionRenewing from "../src/emails/subscription-renewing";
import SubscriptionCanceled from "../src/emails/subscription-canceled";
import WaitlistConfirmation from "../src/emails/waitlist-confirmation";
import DemoRequestReceived from "../src/emails/demo-request-received";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "..", "emails", "dist");

interface Job {
  name: string;
  element: React.ReactElement;
}

const jobs: Job[] = [
  {
    name: "account-confirmation",
    element: React.createElement(AccountConfirmation, {
      firstName: "{{firstName}}",
      confirmUrl: "{{confirmUrl}}",
      expiresInHours: 24,
    }),
  },
  {
    name: "welcome",
    element: React.createElement(Welcome, {
      firstName: "{{firstName}}",
    }),
  },
  {
    name: "password-reset",
    element: React.createElement(PasswordReset, {
      firstName: "{{firstName}}",
      resetUrl: "{{resetUrl}}",
      expiresInMinutes: 60,
    }),
  },
  {
    name: "subscription-receipt",
    element: React.createElement(SubscriptionReceipt, {
      firstName: "{{firstName}}",
      planName: "{{planName}}",
      amount: "{{amount}}",
      currency: "{{currency}}",
      nextBillingDate: "{{nextBillingDate}}",
      invoiceUrl: "{{invoiceUrl}}",
      manageUrl: "{{manageUrl}}",
    }),
  },
  {
    name: "subscription-renewing",
    element: React.createElement(SubscriptionRenewing, {
      firstName: "{{firstName}}",
      planName: "{{planName}}",
      renewsOn: "{{renewsOn}}",
      amount: "{{amount}}",
      currency: "{{currency}}",
      manageUrl: "{{manageUrl}}",
    }),
  },
  {
    name: "subscription-canceled",
    element: React.createElement(SubscriptionCanceled, {
      firstName: "{{firstName}}",
      planName: "{{planName}}",
      endsOn: "{{endsOn}}",
      reactivateUrl: "{{reactivateUrl}}",
    }),
  },
  {
    name: "waitlist-confirmation",
    element: React.createElement(WaitlistConfirmation, {
      email: "{{email}}",
      ticket: "{{ticket}}",
    }),
  },
  {
    name: "demo-request-received",
    element: React.createElement(DemoRequestReceived, {
      firstName: "{{firstName}}",
    }),
  },
];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  for (const job of jobs) {
    const html = await render(job.element, { pretty: true });
    const out = resolve(OUT_DIR, `${job.name}.html`);
    await writeFile(out, html, "utf8");
    console.log(`✓ ${job.name}.html`);
  }
  console.log(`\nWrote ${jobs.length} templates to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
