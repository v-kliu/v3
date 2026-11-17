# Victor Liu Personal Website

Next.js App Router site with a password-gated personal dashboard.
Stack, scripts, and layout are all derivable from `package.json` and `src/` — read those.

## Gotchas

- **`src/middleware.ts` is the live middleware, not the root `middleware.ts`.** The root file
  is a stale duplicate with an older matcher. Next.js prefers `src/` when it exists, so edits
  to the root file do nothing. New protected API routes must be added to the `matcher` in
  `src/middleware.ts` or they are publicly reachable.
- **`SUPABASE_SECRET_KEY` holds a `sb_secret_` key, which bypasses RLS entirely.** It is
  server-side only. Never prefix it with `NEXT_PUBLIC_`, never reach for it in a client
  component, and never use it in code that ships to the browser.
- **Every table has RLS enabled with zero policies.** That is deliberate: the anon/publishable
  key can touch nothing, and the app reads and writes with the secret key from route handlers.
  Do not "fix" a table by adding a permissive anon policy — that makes it world-writable.
  `vkliu_journal_jobs` is the one exception, with 3 policies of its own.
- **Every table in this site is prefixed `vkliu_`.** The Supabase project is shared with other
  side projects, so the prefix is how this site's tables are told apart. New tables must use it.
- `src/App.tsx` is the marketing page body, imported by `src/app/page.tsx`. The real root
  layout is `src/app/layout.tsx`.

## Conventions

- TypeScript throughout — no `any`.
- Dashboard pages are styled with **inline styles plus CSS variables**, not Tailwind utilities.
  Tailwind is installed and used on the marketing page; match whichever the file already uses.
- Theme lives in `:root` in `src/app/globals.css` — paper `--bg: #E8DEC8`, oxblood
  `--accent: #8B0000`. Always reference the variables, never hardcode the hex values.
- Monospace (`SFMono-Regular, Consolas, …`) for dashboard UI text; this is declared per-file
  as a `mono` constant.

## Design principles

- Minimal chrome — content is the focus, not decoration.
- Hierarchy through color: accent = interactive/important, muted = supporting.
- Generous whitespace — sections breathe.
- No AI-slop patterns — no gradient blobs, no bento boxes, no generic 3-column icon grids.

## Build requirement

Every coding session ends with a passing `npm run build`. Fix all errors before considering
the task complete. A broken build is an incomplete task.

Note: `npm run build` overwrites `.next` and will kill a running `npm run dev`. Restart dev
after building.

## Eve

Eve is the personal assistant project that lives behind the hidden dashboard. The `/dashboard/eve`
page is its build dashboard — a living document updated as the project progresses.

### Rules for all Eve work

- **Explain in plain English first, then technical detail.** Spell out every acronym on first use.
- **For any architectural change, propose exactly 2 options with trade-offs and wait for a decision
  before writing any code.**
- **Every architectural decision gets a record in `docs/decisions/NNNN-title.md`** with four fields:
  context, options considered, what we chose, why we chose it, and what would make us revisit it.
- **At the end of every session:** append one entry to `docs/eve/PROGRESS.md` (date, what changed,
  what's next) and update `src/eve/eveData.ts` to reflect any new decisions, phases, concepts, or
  ideas discussed.
- All Eve tables in Supabase are prefixed `vkliu_eve_` to stay consistent with the site convention.
- Never put personal information about real people on the `/dashboard/eve` page — it is the build
  dashboard, not Eve's memory store.

### Key files

- `src/eve/eveData.ts` — all page content; edit here to update the dashboard.
- `src/app/dashboard/(protected)/eve/page.tsx` — renders eveData; layout only.
- `src/app/dashboard/(protected)/eve/eve.css` — Eve dev component styles (JetBrains Mono, ink/muted/faint,
  fading hairlines, violet as the only accent). Color tokens live in `dashboard.css` under `[data-eve]`.
  Use these classes on Eve pages instead of inline colors.
- `src/components/dashboard/EveHeader.tsx` — shared title, meta and tabs for every Eve dev page.
- `docs/decisions/` — one file per architectural decision, numbered from 0001.
- `docs/eve/PROGRESS.md` — session-by-session log.

## Git workflow

After every completed task where the build passes: stage all changes, write a concise commit
message, commit and push to the current branch. Do not commit if the build is failing.
