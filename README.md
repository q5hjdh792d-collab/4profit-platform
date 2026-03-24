# 4BASE — Next.js + Supabase (final preview)

Elite trader discovery by ALVO13.

## Tech
- Next.js 14 App Router + Tailwind + shadcn/ui
- Supabase (public traders table)
- Resend for email notifications (legacy flows paused in this Supabase-only preview)

## Environment Variables (Vercel)
Required for current preview:
- NEXT_PUBLIC_SUPABASE_URL=https://drvhyomgegwpudgswxvj.supabase.co
- NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRydmh5b21nZWd3cHVkZ3N3eHZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNDUyMTIsImV4cCI6MjA4OTkyMTIxMn0.nJPydLXg3Wo8AjQEmelNiligupFan0XcKc4h__RW9Z0

Optional (emails, not used in this public preview path):
- RESEND_API_KEY
- EMAIL_FROM

## Pages
- / — Founder Card (live BTC ticker) + Bento grid with filter chips
- /traders — Supabase-backed traders list with chips-only filtering
- /pricing — Plans UI only
- /api/health — readiness probe

## Notes
- MongoDB and NextAuth code paths have been purged/disabled for this preview. No /api/session.
- Traders are read from Supabase table `traders` (see supabase/create_traders.sql for schema).

## Deploy (Vercel)
1. Set env vars above
2. Deploy (root: /app)
3. Verify /api/health returns ok:true
