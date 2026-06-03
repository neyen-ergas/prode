-- Prode Mundial 2026 - Schema

create extension if not exists "pgcrypto";

-- Users
create table public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  pin_hash text not null,
  color text not null default '#3B82F6',
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Matches (synced from football-data.org)
create table public.matches (
  id text primary key,
  home_team text not null,
  away_team text not null,
  home_team_crest text,
  away_team_crest text,
  home_score integer,
  away_score integer,
  match_date timestamptz not null,
  status text not null default 'SCHEDULED',
  stage text not null,
  group_name text,
  matchday integer,
  updated_at timestamptz not null default now()
);

-- Predictions
create table public.predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  match_id text not null references public.matches(id) on delete cascade,
  home_score integer not null,
  away_score integer not null,
  points integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, match_id)
);

-- Champion predictions
create table public.champion_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade unique,
  team text not null,
  created_at timestamptz not null default now()
);

-- RLS (all reads public, writes only via service role from server)
alter table public.users enable row level security;
alter table public.matches enable row level security;
alter table public.predictions enable row level security;
alter table public.champion_predictions enable row level security;

create policy "public_read_users" on public.users for select using (true);
create policy "public_read_matches" on public.matches for select using (true);
create policy "public_read_predictions" on public.predictions for select using (true);
create policy "public_read_champion" on public.champion_predictions for select using (true);
