# 4Profit Production Guide

## Required ENV
- MONGO_URL
- DB_NAME
- NEXTAUTH_URL
- NEXTAUTH_SECRET
- RESEND_API_KEY (Resend.com API key)
- EMAIL_FROM (e.g., "4Profit <noreply@4profit.dev>")
- SEED_ENABLED=false (disable /api/seed in production)

## Healthcheck
- GET /api/health → { ok: true, ts }

## Seeding
- /api/seed is idempotent and should be disabled in production with SEED_ENABLED=false

## Roles & Routes
- investor: /traders, favorites, compare, request contact
- trader: /submit, /dashboard, view contact requests
- admin/mod: /admin moderation, settings, listing controls

## Monthly Credits Reset
- Endpoint: GET /api/ops/reset-credits (admin only)
- Idempotent: resets credits_used=0 and period_start=now if period_start older than ~30 days
- Cron example (adjust domain, ensure auth cookie or run internally):
  curl -s https://your-domain/api/ops/reset-credits

## Listing Controls
- In /admin → per trader: toggle Pro (is_pro), set Boost (boosted_until), view ordering key
- Ordering: boost desc → pro desc → verified desc → created_at desc

## Email Notifications
- Provider: Resend
- EMAIL_FROM must use a verified domain 
- Events:
  - contact-created → Subject: "New contact request on 4Profit"
  - contact-accepted → Subject: "Your contact request was accepted"
  - contact-declined → Subject: "Your contact request was declined"

## Deployment
- Ensure envs set
- Verify health /api/health
- Disable seed
- Set up monthly reset via cron
