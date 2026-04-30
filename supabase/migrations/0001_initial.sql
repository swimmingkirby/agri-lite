-- ============================================================
-- 0001_initial.sql
-- Agri-Lite schema (PRD section 7)
-- ============================================================

create table plots (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 60),
  created_at timestamptz not null default now()
);

create table readings (
  id uuid primary key default gen_random_uuid(),
  plot_id uuid not null references plots(id) on delete cascade,
  moisture numeric(5,2) not null check (moisture between 0 and 100),
  temperature numeric(5,2) not null check (temperature between -20 and 60),
  light numeric(8,2) not null check (light between 0 and 120000),
  recorded_at timestamptz not null default now()
);
create index readings_plot_recorded_idx on readings(plot_id, recorded_at desc);

create table thresholds (
  id uuid primary key default gen_random_uuid(),
  plot_id uuid not null references plots(id) on delete cascade,
  parameter text not null check (parameter in ('moisture','temperature','light')),
  min_value numeric,
  max_value numeric,
  updated_at timestamptz not null default now(),
  unique (plot_id, parameter),
  check (min_value is null or max_value is null or min_value <= max_value)
);

create table notes (
  id uuid primary key default gen_random_uuid(),
  plot_id uuid not null references plots(id) on delete cascade,
  body text not null check (length(body) between 1 and 500),
  recorded_at timestamptz not null default now()
);
create index notes_plot_recorded_idx on notes(plot_id, recorded_at desc);

-- Row Level Security (NFR8)
alter table plots      enable row level security;
alter table readings   enable row level security;
alter table thresholds enable row level security;
alter table notes      enable row level security;

create policy "anon read plots"      on plots      for select using (true);
create policy "anon read readings"   on readings   for select using (true);
create policy "anon read thresholds" on thresholds for select using (true);
create policy "anon read notes"      on notes      for select using (true);
-- Service role bypasses RLS by default. No explicit policies needed.
-- Anon role has no INSERT/UPDATE/DELETE policies, so writes are blocked.
