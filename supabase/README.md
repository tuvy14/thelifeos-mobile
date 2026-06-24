# Supabase setup (cloud sync)

The app already has the client wired (`src/lib/supabase.ts`) and the public env
in `.env.local`. The only thing your Supabase project needs is the schema and an
auth choice.

## 1. Apply the schema

Dashboard → **SQL Editor** → **New query** → paste all of [`schema.sql`](./schema.sql) → **Run**.

This creates `user_state` (one row per user), a server-side `updated_at` trigger,
and Row Level Security so each user only ever touches their own row. It's
idempotent — safe to re-run.

## 2. Auth settings

Dashboard → **Authentication** → **Sign In / Providers** → **Email**:

- **Confirm email = OFF** → fastest for testing. `Create account` signs you in
  immediately, no inbox round-trip.
- **Confirm email = ON** → production-safe. The app already handles it: sign-up
  shows "Check your email to confirm, then sign in." Supabase's built-in mailer
  is fine for low volume; add a custom SMTP sender before launch.

Email + password is all the mobile app uses today (Google / Apple sign-in are a
later add). Min password length is 6 (enforced both client- and server-side).

## 3. Verify

In the app: **More → Account** → Create account → make a change → it auto-backs
up. The Account screen shows "Synced just now". Sign in with the same account on
another device (or the web app) to confirm it pulls down.
