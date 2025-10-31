# 4Profit MVP (Next.js + MongoDB)

Marketplace directory where investors discover traders via transparent profiles and filters. No brokerage integrations, no custody, no investment advice.

## Tech
- Next.js 14 App Router + Tailwind + shadcn/ui
- MongoDB (via MONGO_URL)
- NextAuth (Credentials)

## Required env (.env)
- MONGO_URL=mongodb://localhost:27017
- DB_NAME=fourprofit
- NEXTAUTH_SECRET=your_strong_secret
- NEXTAUTH_URL=https://tradematch-2.preview.emergentagent.com

## Seed & roles
- Seed once: open /api/seed (idempotent)
- Accounts:
  - admin@4profit.dev / Passw0rd! (role=admin)
  - investor1@4profit.dev / Passw0rd! (role=investor)
  - investor2@4profit.dev / Passw0rd! (role=investor)
  - trader01..10@4profit.dev / Passw0rd! (role=trader)

## Core routes
- /traders — directory (badges + ordering: BOOST → PRO → VERIFIED → others)
- /traders/[slug] — profile (contacts masked unless accepted)
- /auth — credentials login
- /submit — trader onboarding (status=pending)
- /admin — moderation (approve/reject/edit; logs shown)
- /favorites — investor favorites
- /compare — compare up to 3
- /dashboard — trader analytics basics

## Contact flow (anti‑spam)
- Investors get 3 free contact credits/month
- Rate limit: 5 requests/hour per investor
- Trader Accept → investor sees unmasked contacts for 7 days

## Testing
1. /api/seed
2. Login investor → /traders → Request Contact
3. Login trader → /dashboard → Accept in Contact Requests (or /admin as admin)
4. Back as investor → profile unmasked for 7 days

## Legal
- Footer: Terms, Privacy, Cookies, Disclaimer

## Notes
- Minimal validation on client; server enforces consent + role-based auth
- Badges: BOOST (boosted_until > now), PRO (listing.is_pro), VERIFIED (is_verified)
