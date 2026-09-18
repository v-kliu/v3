-- grit — applied to project chyueowpeovvlwmkfawp (migration vkliu_prefix_and_grit).
-- Kept here as the record of the schema. Read/written by src/app/api/grit/route.ts.
-- Habit colors are kept unique app-side (a new habit gets the next free color).
--
-- Same security model as every other vkliu_ table: RLS enabled, no policies,
-- accessed only through route handlers with the secret key.

create table if not exists public.vkliu_grit_habits (
  id          text        primary key,               -- client-generated id
  name        text        not null,
  color       text        not null,
  start_date  date        not null,                  -- habit appears from this day on
  end_date    date,                                  -- last day it appears; null = ongoing
  position    integer     not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.vkliu_grit_checks (
  habit_id    text        not null references public.vkliu_grit_habits(id) on delete cascade,
  day         date        not null,
  checked_at  timestamptz not null default now(),
  primary key (habit_id, day)
);

create index if not exists vkliu_grit_checks_day_idx on public.vkliu_grit_checks (day);

-- One row per day: how the day went (1–10, independent of habit completion)
-- plus a free-form note. Candidate to feed the journal tab later.
create table if not exists public.vkliu_grit_days (
  day         date        primary key,
  rating      smallint    check (rating between 1 and 10),
  note        text        not null default '',
  updated_at  timestamptz not null default now()
);

alter table public.vkliu_grit_habits enable row level security;
alter table public.vkliu_grit_checks enable row level security;
alter table public.vkliu_grit_days   enable row level security;
