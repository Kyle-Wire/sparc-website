// Centralized transactional email sender. Wraps Resend, renders React Email
// templates to HTML + plaintext, and exposes a typed `sendEmail` API.
//
// Usage:
//   await sendEmail({
//     to: "user@example.com",
//     template: "welcome",
//     props: { firstName: "Alex" },
//   });

import { Resend } from "resend";
import { render } from "@react-email/render";
import * as React from "react";
import { randomUUID } from "node:crypto";

import AccountConfirmation, {
  subject as accountConfirmationSubject,
  type AccountConfirmationProps,
} from "@/emails/account-confirmation";
import Welcome, {
  subject as welcomeSubject,
  type WelcomeProps,
} from "@/emails/welcome";
import PasswordReset, {
  subject as passwordResetSubject,
  type PasswordResetProps,
} from "@/emails/password-reset";
import SubscriptionReceipt, {
  subject as subscriptionReceiptSubject,
  type SubscriptionReceiptProps,
} from "@/emails/subscription-receipt";
import SubscriptionRenewing, {
  subject as subscriptionRenewingSubject,
  type SubscriptionRenewingProps,
} from "@/emails/subscription-renewing";
import SubscriptionCanceled, {
  subject as subscriptionCanceledSubject,
  type SubscriptionCanceledProps,
} from "@/emails/subscription-canceled";
import WaitlistConfirmation, {
  subject as waitlistConfirmationSubject,
  type WaitlistConfirmationProps,
} from "@/emails/waitlist-confirmation";
import DemoRequestReceived, {
  subject as demoRequestReceivedSubject,
  type DemoRequestReceivedProps,
} from "@/emails/demo-request-received";

export type EmailTemplate =
  | { template: "account-confirmation"; props: AccountConfirmationProps }
  | { template: "welcome"; props: WelcomeProps }
  | { template: "password-reset"; props: PasswordResetProps }
  | { template: "subscription-receipt"; props: SubscriptionReceiptProps }
  | { template: "subscription-renewing"; props: SubscriptionRenewingProps }
  | { template: "subscription-canceled"; props: SubscriptionCanceledProps }
  | { template: "waitlist-confirmation"; props: WaitlistConfirmationProps }
  | { template: "demo-request-received"; props: DemoRequestReceivedProps };

type Registry = {
  [K in EmailTemplate as K["template"]]: {
    Component: React.ComponentType<K["props"]>;
    subject: (props?: K["props"]) => string;
  };
};

const registry: Registry = {
  "account-confirmation": {
    Component: AccountConfirmation,
    subject: accountConfirmationSubject,
  },
  welcome: { Component: Welcome, subject: welcomeSubject },
  "password-reset": {
    Component: PasswordReset,
    subject: passwordResetSubject,
  },
  "subscription-receipt": {
    Component: SubscriptionReceipt,
    subject: subscriptionReceiptSubject,
  },
  "subscription-renewing": {
    Component: SubscriptionRenewing,
    subject: subscriptionRenewingSubject,
  },
  "subscription-canceled": {
    Component: SubscriptionCanceled,
    subject: subscriptionCanceledSubject,
  },
  "waitlist-confirmation": {
    Component: WaitlistConfirmation,
    subject: waitlistConfirmationSubject,
  },
  "demo-request-received": {
    Component: DemoRequestReceived,
    subject: demoRequestReceivedSubject,
  },
};

export interface SendEmailBase {
  to: string | string[];
  replyTo?: string;
  /** Optional override for the auto-generated subject. */
  subject?: string;
  /** Idempotency / trace id. Auto-generated if omitted. */
  refId?: string;
}

export type SendEmailArgs = SendEmailBase & EmailTemplate;

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
}

const FROM_DEFAULT = "SPARC Labs <onboarding@resend.dev>";

export async function sendEmail(args: SendEmailArgs): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY not set" };
  }
  const from = process.env.RESEND_FROM ?? FROM_DEFAULT;

  const entry = registry[args.template];
  if (!entry) {
    return { ok: false, error: `unknown template: ${args.template}` };
  }

  // The discriminated union guarantees `args.props` matches `entry.Component`,
  // but TypeScript can't narrow through the registry index. Cast is safe.
  const Component = entry.Component as React.ComponentType<unknown>;
  const element = React.createElement(Component, args.props as unknown as object);

  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);

  const subject =
    args.subject ?? entry.subject(args.props as never);
  const refId = args.refId ?? randomUUID();

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from,
    to: args.to,
    replyTo: args.replyTo,
    subject,
    html,
    text,
    headers: { "X-Entity-Ref-ID": refId },
  });

  if (result.error) {
    return { ok: false, error: result.error.message ?? "send failed" };
  }
  return { ok: true, id: result.data?.id };
}
