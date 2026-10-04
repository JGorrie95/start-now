# Start Now — Project Handoff

A calm, ADHD-friendly web app that turns "I'm overwhelmed" into one small, doable next step.
Plus a social layer: streaks, friends, and a leaderboard to stay motivated.

**Live:** https://start-now-orcin.vercel.app
**Repo:** https://github.com/JGorrie95/start-now (auto-deploys to Vercel on push to `main`)

---

## Tech stack
- **Next.js 16.2.4** (App Router, Turbopack) — NOTE: this is a newer/modified Next.js. Per `AGENTS.md`, always read the relevant guide in `node_modules/next/dist/docs/` before writing code. Conventions differ from older versions (e.g. `middleware` is now `proxy`, `themeColor` lives in a `viewport` export).
- **React 19**
- **Supabase** — auth (magic links), Postgres database, and Storage (avatars)
- **Resend** — transactional email (SMTP) for magic links
- Styling is **inline styles** (no Tailwind, despite the dep being present). Warm cream `#FAF8F3` background, amber `#f59e0b` accent, Georgia serif headings + system-ui body.

---

## What's built and working
- ✅ Landing page (`/`) — task input + quick-starts, routes to `/stuck`
- ✅ `/stuck` — rule-based "next step" engine (keyword matching in `getNextStep`)
- ✅ Magic-link auth (`/auth`) — passwordless email sign-in
- ✅ Streaks — "✓ I did it!" button on `/stuck`, once-per-day, with confetti animation
- ✅ Profiles (`/profile`) — username, streak stats, invite link, profile picture upload
- ✅ Friends (`/friends`) — username search, friend requests, streak leaderboard, avatars
- ✅ Invite links (`/invite/[code]`) — auto-add to a friend's circle
- ✅ PWA — installable to home screen (manifest + apple-icon + viewport in `app/layout.tsx`)

---

## Architecture notes

### Auth flow (IMPORTANT — uses token_hash, not PKCE code exchange)
- `/auth/page.tsx` calls `signInWithOtp` → sends magic link.
- The Supabase **"Magic Link" email template** was customized to:
  `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink`
- `/auth/confirm/route.ts` calls `verifyOtp({ type, token_hash })` and redirects to `/profile`.
- The older `/auth/callback/route.ts` (PKCE `exchangeCodeForSession`) is kept as a fallback but the token_hash flow is what actually works reliably for email links.
- `proxy.ts` (Supabase session refresh middleware) runs on every request.
- Supabase clients: `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (server).

### Server actions (`app/actions.ts`)
`completeStep`, `createProfile`, `sendFriendRequest`, `acceptFriendRequest`, `addFriendByInvite`.

### Database tables (Supabase, all with RLS)
- `profiles` (id, username, streak_count, longest_streak, last_completed_date, invite_code, avatar_url)
- `friendships` (requester_id, addressee_id, status: pending/accepted)
- `streak_completions` (user_id, completed_date — unique per day)

### Storage
- Bucket `avatars` (public), path `{user_id}/avatar.{ext}`, with RLS policies for public read + owner write.

### Environment variables (in Vercel)
- `NEXT_PUBLIC_SUPABASE_URL` — must be the BASE url `https://<ref>.supabase.co` (NOT the `/rest/v1/` Data API url — that bug caused hours of debugging)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Cost guardrails (keep these in mind)
- `vercel.json` caps serverless function duration at 10s.
- App is mostly static → ~$0/month on free tiers.
- RULE: never add a paid per-request API (AI, email, SMS) without rate limiting first.

---

## Known limitations / what's left before real users

1. **Email only reaches the owner.** Resend is using the `onboarding@resend.dev` sender, which ONLY delivers to the Resend account's own email. **To let real users sign up, verify a domain in Resend** and change the sender address.
2. **New-user signups need a template fix.** When a brand-new email signs up, Supabase sends the **"Confirm signup"** template, not "Magic Link." Update that template the same way: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup`.
3. **No custom domain yet.** App runs on `start-now-orcin.vercel.app`. "startnow.app" is taken. Considering alternatives (e.g. `getunstuck.app`). "Start Now" is a generic phrase = weak trademark; a more distinctive name is recommended for brand protection.

---

## Possible next steps
- Buy + connect a custom domain (Vercel Domains is simplest), verify it in Resend → unlock real-user signups.
- Update the "Confirm signup" email template (see above).
- Expand `getNextStep` rules, or swap in the Claude API for real AI suggestions (WITH rate limiting).
- Capacitor wrapper for the iOS App Store (needs native features to pass Apple review 4.2).

---

## Gotchas learned (so you don't repeat them)
- The `NEXT_PUBLIC_SUPABASE_URL` must NOT include `/rest/v1/`.
- Email magic links: use the `token_hash` + `verifyOtp` flow, not the PKCE code exchange.
- Supabase's built-in email is capped at ~2/hour — that's why custom SMTP (Resend) was added.
- This Next.js version renamed `middleware` → `proxy` and moved `themeColor` to a `viewport` export.
