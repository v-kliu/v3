-- 向上 / ascend — already applied to project chyueowpeovvlwmkfawp.
-- Kept here as the record of the schema. Mirrors public.todo_content exactly.
--
-- Security model, matching todo_content: RLS is ENABLED with NO policies, so
-- the anon/publishable key cannot read or write this table at all. The Next.js
-- route handlers talk to it with the sb_secret_ key (held in SUPABASE_ANON_KEY,
-- server-side only), which bypasses RLS. Access is gated in src/middleware.ts.
--
-- Do NOT add a permissive anon policy here — that would make every track
-- publicly readable and writable with the publishable key.

create table if not exists public.growth_content (
  id          serial primary key,
  name        text        not null default 'track',
  icon        text        not null default 'sparkles',
  steps       jsonb       not null default '[]'::jsonb,
  position    integer     not null default 0,
  updated_at  timestamptz default now()
);

create index if not exists growth_content_position_idx
  on public.growth_content ("position");

alter table public.growth_content enable row level security;

-- Starter tracks. Only seeds when the table is empty, so re-running is safe.
insert into public.growth_content (name, icon, steps, "position")
select * from (values
  ('diet', 'utensils', '[
    {"id":"d1","title":"cut liquid calories","note":"no soda, no juice, black coffee","status":"done"},
    {"id":"d2","title":"protein at every meal","note":"~1g per lb bodyweight","status":"active"},
    {"id":"d3","title":"cook 5 nights a week","note":"","status":"todo"},
    {"id":"d4","title":"dial in a maintenance baseline","note":"","status":"todo"}
  ]'::jsonb, 0),
  ('skincare', 'droplets', '[
    {"id":"s1","title":"cleanser + spf every morning","note":"until it is automatic","status":"done"},
    {"id":"s2","title":"add a nightly moisturizer","note":"","status":"active"},
    {"id":"s3","title":"introduce retinol, 2x a week","note":"ramp slowly","status":"todo"},
    {"id":"s4","title":"targeted serum","note":"only once the base routine is boring","status":"todo"}
  ]'::jsonb, 1),
  ('weight', 'scale', '[
    {"id":"w1","title":"weigh in daily, same time","note":"trend line, not the number","status":"done"},
    {"id":"w2","title":"first cut phase","note":"","status":"active"},
    {"id":"w3","title":"hold the new weight 8 weeks","note":"","status":"todo"},
    {"id":"w4","title":"lean bulk","note":"","status":"todo"}
  ]'::jsonb, 2),
  ('reading', 'book', '[
    {"id":"r1","title":"10 pages before bed","note":"phone in another room","status":"active"},
    {"id":"r2","title":"finish one book a month","note":"","status":"todo"},
    {"id":"r3","title":"keep notes on what stuck","note":"","status":"todo"}
  ]'::jsonb, 3),
  ('gym', 'dumbbell', '[
    {"id":"g1","title":"show up 3x a week","note":"consistency before intensity","status":"done"},
    {"id":"g2","title":"learn the big lifts light","note":"squat, bench, deadlift, row","status":"done"},
    {"id":"g3","title":"progressive overload, logged","note":"add weight or reps every session","status":"active"},
    {"id":"g4","title":"push/pull/legs, 5x a week","note":"","status":"todo"},
    {"id":"g5","title":"1/2/3/4 plates","note":"","status":"todo"}
  ]'::jsonb, 4)
) as v(name, icon, steps, "position")
where not exists (select 1 from public.growth_content);
