# 4Profit MVP (Next.js + MongoDB)

Marketplace directory where investors discover traders via transparent profiles and filters. No brokerage integrations, no custody, no investment advice.

## Tech
- Next.js 14 App Router + Tailwind + shadcn/ui
- MongoDB
- NextAuth (Credentials)
- Resend for email notifications

## Environment Variables (.env)
Required:
- MONGO_URL or MONGODB_URI
- DB_NAME (default: fourprofit)
- NEXTAUTH_SECRET
- NEXTAUTH_URL
- RESEND_API_KEY (for emails)
- EMAIL_FROM (e.g., "4Profit <noreply@4profit.dev>")
Recommended/Prod:
- SEED_ENABLED=false (disables /api/seed)

## Health & Ops
- GET /api/health → { ok: true, ts }
- GET /api/ops/reset-credits (admin only) → resets monthly credits if period_start older than ~30 days.

## Seeding & Roles
- Seed once: open /api/seed (idempotent; disabled in prod if SEED_ENABLED=false)
- Accounts:
  - admin@4profit.dev / Passw0rd! (role=admin)
  - investor1@4profit.dev / Passw0rd! (role=investor)
  - investor2@4profit.dev / Passw0rd! (role=investor)
  - trader01..10@4profit.dev / Passw0rd! (role=trader)

## Core Routes
- /traders — directory (badges + ordering: BOOST → PRO → VERIFIED → others)
- /traders/[slug] — profile (contacts masked unless accepted)
- /auth — credentials login
- /submit — trader onboarding (status=pending; inline validation)
- /admin — moderation (approve/reject/edit; logs; listing controls; settings)
- /favorites — investor favorites
- /compare — compare up to 3
- /dashboard — trader analytics basics
- /pricing — Free / Pro / Boost info

## Contact Flow (anti‑spam)
- Investors get monthly_free_credits (default 3, editable in Admin → Settings)
- Rate limit: 5 requests/hour per investor
- Trader Accept → investor sees unmasked contacts for 7 days
- Notifications via Resend on create/accept/decline

## Local Dev
- yarn
- yarn dev
- Visit /api/seed once

## Deploy (Vercel)
1. Create a new project from this repo (Root: /app)
2. Set env vars in Vercel dashboard:
   - MONGO_URL (or MONGODB_URI)
   - DB_NAME=fourprofit
   - NEXTAUTH_SECRET=<strong secret>
   - NEXTAUTH_URL=<your Vercel URL>
   - RESEND_API_KEY=<your Resend key>
   - EMAIL_FROM="4Profit <noreply@4profit.dev>"
   - SEED_ENABLED=false (recommended)
3. Deploy
4. Optionally run seed locally only; do not enable in production

## Monthly Credits Reset (cron)
- Call GET https://your-domain/api/ops/reset-credits (admin only)
- For now, trigger manually or via an internal scheduler

## License
MIT
