-- grit — PROPOSED, NOT YET APPLIED. The page currently stores everything in
-- localStorage (src/components/grit/store.ts) with these same shapes.
-- Habit colors are kept unique app-side (add picks a free color, recolor swaps).
--
-- Same security model as todo_content / growth_content: RLS enabled, no
-- policies, accessed only through route handlers with the secret key.

create table if not exists public.grit_habits (
  id          text        primary key,               -- client-generated id
  name        text        not null,
  color       text        not null default '#E4572E',
  start_date  date        not null,                  -- habit appears from this day on
  end_date    date,                                  -- last day it appears; null = ongoing
  position    integer     not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.grit_checks (
  habit_id    text        not null references public.grit_habits(id) on delete cascade,
  day         date        not null,
  checked_at  timestamptz not null default now(),
  primary key (habit_id, day)
);

create index if not exists grit_checks_day_idx on public.grit_checks (day);

alter table public.grit_habits enable row level security;
alter table public.grit_checks enable row level security;

-- One row per day: how the day went (1–10, independent of habit completion)
-- plus a free-form note. Candidate to feed the journal tab later.
create table if not exists public.grit_days (
  day         date        primary key,
  rating      smallint    check (rating between 1 and 10),
  note        text        not null default '',
  updated_at  timestamptz not null default now()
);

alter table public.grit_days enable row level security;
