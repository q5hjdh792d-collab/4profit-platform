# 4BASE (formerly 4Profit) — Next.js + MongoDB

Marketplace directory where investors discover traders via transparent profiles and filters. No brokerage integrations, no custody, no investment advice.

## Tech
- Next.js 14 App Router + Tailwind + shadcn/ui
- MongoDB
- NextAuth (Credentials)
- Resend for email notifications
- Optional: Supabase client bootstrap + SQL for traders table (see supabase/create_traders.sql)

## Environment Variables (.env)
Required:
- MONGO_URL or MONGODB_URI
- DB_NAME (default: fourprofit)
- NEXTAUTH_SECRET
- NEXTAUTH_URL
- RESEND_API_KEY (for emails)
- EMAIL_FROM (e.g., "4BASE <noreply@4profit.dev>")
Recommended/Prod:
- SEED_ENABLED=false (disables /api/seed)
Optional (Supabase):
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

## Health & Ops
- GET /api/health → { ok: true, ts }
- GET /api/ops/reset-credits (admin only) → resets monthly credits if period_start older than ~30 days.

## Seeding & Roles (non‑prod only)
- Seed once: open /api/seed (idempotent; disabled in prod if SEED_ENABLED=false)
- Accounts:
  - admin@4base.pro / Passw0rd! (admin)
  - investor1@4base.pro / Passw0rd! (investor)
  - investor2@4base.pro / Passw0rd! (investor)
  - trader01..10@4base.pro / Passw0rd! (trader)

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

## Branding
- Site Identity: 4BASE (by ALVO13)
- Home grid includes a pinned “Founder Card” with live BTC/USDT ticker from Binance WebSocket

## Local Dev
- yarn
- yarn dev
- Visit /api/seed once (non‑prod)

## Deploy (Vercel)
1. Create a Vercel project from this repo (Root: /app)
2. Set env vars in Vercel dashboard:
   - MONGO_URL (or MONGODB_URI)
   - DB_NAME=fourprofit
   - NEXTAUTH_SECRET=<strong secret>
   - NEXTAUTH_URL=<your Vercel URL>
   - RESEND_API_KEY=<your Resend key>
   - EMAIL_FROM="4BASE <noreply@4profit.dev>"
   - SEED_ENABLED=false (recommended)
3. Deploy

## Monthly Credits Reset (cron)
- Call GET https://your-domain/api/ops/reset-credits (admin only)

## License
MIT
