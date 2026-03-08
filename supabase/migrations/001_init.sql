-- AudSep Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard → SQL Editor

-- ─── USERS ────────────────────────────────────────────────────────────────────
create table if not exists public.users (
  id                    uuid primary key default gen_random_uuid(),
  clerk_id              text unique not null,
  email                 text,
  name                  text,
  plan                  text not null default 'free',  -- 'free' | 'pro' | 'team'
  credits_used_today    int  not null default 0,
  credits_reset_at      timestamptz not null default now(),
  lemon_customer_id     text,
  lemon_subscription_id text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ─── JOBS ─────────────────────────────────────────────────────────────────────
create table if not exists public.jobs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.users(id) on delete cascade,
  status       text not null default 'queued',  -- 'queued' | 'processing' | 'done' | 'failed'
  input_url    text,           -- Supabase Storage path (inputs bucket)
  output_urls  jsonb,          -- { vocals: "...", drums: "...", bass: "...", other: "..." }
  model        text default 'htdemucs',
  category     text default 'music',
  vocal_only   boolean default false,
  filename     text,
  error        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Index for dashboard queries (latest jobs for a user)
create index if not exists jobs_user_id_created_at on public.jobs(user_id, created_at desc);
create index if not exists jobs_status on public.jobs(status);

-- ─── API KEYS ─────────────────────────────────────────────────────────────────
create table if not exists public.api_keys (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.users(id) on delete cascade,
  key_hash     text unique not null,  -- SHA-256 of the raw key (never store raw)
  name         text not null,
  last_used_at timestamptz,
  revoked_at   timestamptz,
  created_at   timestamptz not null default now()
);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
alter table public.users   enable row level security;
alter table public.jobs    enable row level security;
alter table public.api_keys enable row level security;

-- Service role bypasses RLS (used server-side), anon/authenticated are restricted
-- Users can only see their own rows (add policies if using browser client directly)

-- ─── STORAGE BUCKETS ──────────────────────────────────────────────────────────
-- Run separately, or create via Supabase dashboard:
-- insert into storage.buckets (id, name, public) values ('inputs', 'inputs', false);
-- insert into storage.buckets (id, name, public) values ('outputs', 'outputs', false);
