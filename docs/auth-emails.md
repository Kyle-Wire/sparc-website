# Sign-in emails: what Kyle checks in Supabase

Supabase sends three emails for us: the signup confirmation, the password
reset (new: `/login/forgot`), and an email-change confirmation. They are set in
the Supabase dashboard, not in this repo, so nobody here can see them. Before
the first invited buyer, check these in **Authentication**:

1. **URL configuration → Redirect URLs** includes
   `https://sparclabs.co/auth/callback**`. Signup and the reset link both
   return there; a reset whose `redirectTo` is not on the list falls back to
   the Site URL and never reaches `/account/password`.
2. **SMTP settings → custom SMTP** is on. Supabase's built-in sender is for
   testing: it is rate-limited to a few emails an hour and comes from a
   Supabase address, so a buyer's confirmation can arrive late or in spam.
   Use Resend, which already sends our order emails (host, port, user and the
   API key as password are on Resend's SMTP page). Sender: `hello@sparclabs.co`,
   name `SPARC Labs`.
3. **Email templates**: "Confirm signup" and "Reset password" should read like
   our other emails. Short versions to paste:
   - Confirm signup. Subject: `Confirm your email for SPARC Labs`. Body: "Click
     to confirm this email and open your account, where your house reports
     live: <a href="{{ .ConfirmationURL }}">Confirm my email</a>. If you did
     not make an account at sparclabs.co, ignore this email."
   - Reset password. Subject: `Choose a new SPARC Labs password`. Body: "Click
     to choose a new password. The link works once:
     <a href="{{ .ConfirmationURL }}">Choose a new password</a>. If you did not
     ask, ignore this email and your password stays as it is."

`src/emails/account-confirmation.tsx` and `password-reset.tsx` are not sent by
anything yet (see `emails/README.md`), and the confirmation one still describes
the old product (desktop app, API keys, seats).
