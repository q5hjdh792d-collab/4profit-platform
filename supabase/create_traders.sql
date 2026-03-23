-- Create traders table for 4BASE
create table if not exists public.traders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  strategy_type text,
  api_verified boolean default false,
  pnl_percentage numeric,
  bio text,
  created_at timestamptz default now()
);

-- Recommended RLS setup (adjust as needed)
-- alter table public.traders enable row level security;
-- create policy "read all" on public.traders for select using (true);
-- create policy "insert own" on public.traders for insert with check (auth.uid() = id);
