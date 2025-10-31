Manual test checklist (MVP):
- GET /api/seed -> { ok: true }
- Visit /auth, login investor1@4profit.dev / Passw0rd!
- GET /api/traders returns masked contacts
- POST /api/contact/request { trader_id } as investor -> ok
- Login as respective trader (trader01), open /dashboard to Accept, then investor can see unmasked contacts in /traders & /traders/[slug]
