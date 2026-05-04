# SPARC transactional emails

React Email templates for every automated email SPARC sends. Source of truth
lives in `src/emails/*.tsx`; static HTML exports live in `emails/dist/`.

## How to send from app code

```ts
import { sendEmail } from "@/lib/email";

await sendEmail({
  to: "user@example.com",
  template: "welcome",
  props: { firstName: "Alex" },
});
```

The helper renders HTML + plaintext, fills in `from`, sets an
`X-Entity-Ref-ID` trace header, and returns `{ ok, id?, error? }`.

## Templates

| Template | Triggered by |
| --- | --- |
| `account-confirmation` | Signup — confirm email address |
| `welcome` | First sign-in after confirmation |
| `password-reset` | Password reset request |
| `subscription-receipt` | LemonSqueezy `subscription_created` webhook (wired) |
| `subscription-renewing` | Daily cron, 7 days before renewal *(cron not yet wired — see below)* |
| `subscription-canceled` | LemonSqueezy `subscription_cancelled` webhook (wired) |
| `waitlist-confirmation` | `/api/waitlist` POST success (wired) |
| `demo-request-received` | `/api/account/request-demo` POST success (wired) |

## Local preview

```bash
npm run email:dev
```

Opens the React Email preview server at <http://localhost:3001>. Hot reload on
template edits.

## Static HTML export (for the Resend dashboard)

```bash
npm run email:build
```

Writes `emails/dist/*.html` with `{{placeholder}}` tokens in place of dynamic
props. Paste any of these into the Resend dashboard if you want UI-driven
editing for marketing variants. The `{{...}}` tokens are compatible with
Resend's variable interpolation syntax.

## Adding a template

1. Create `src/emails/my-template.tsx` exporting a default React component and a
   named `subject(props?)` helper.
2. Register it in `src/lib/email.ts` (add to the `EmailTemplate` union and the
   `registry` object — TypeScript will prompt you).
3. Add a job to `scripts/render-emails.ts` if you want a static export.

## Brand tokens

Email clients don't support CSS variables, so brand colors are duplicated in
`src/emails/_components/tokens.ts`. If `src/styles/tokens.css` changes, mirror
the relevant hex values there.

## Outstanding wiring (not implemented yet)

These templates exist and are sendable, but their automated trigger is not
yet wired:

- **`account-confirmation` + `password-reset`** — requires disabling Supabase's
  built-in confirmation/recovery emails and using
  `supabase.auth.admin.generateLink({ type: "signup" | "recovery" })` to
  produce the URL passed to the template.
- **`welcome`** — needs a `welcome_sent_at` column on `profiles` and a check
  in `src/app/auth/callback/route.ts` to send-and-stamp on first sign-in.
- **`subscription-renewing`** — needs a Vercel Cron at
  `/api/cron/renewal-reminders` running daily, plus a
  `renewal_reminder_sent_at` column on `subscriptions`.

See `/memories/session/plan.md` (in chat memory) for the full plan.
