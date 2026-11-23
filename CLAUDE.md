# Victor Liu Personal Website

@RULES.md

**`RULES.md` (imported above) is the workflow for every change: break down the request, branch,
build, verify with an independent subagent, add a Changelog entry, open a PR, and report back with
the PR and Vercel preview links. Follow it for every feature without being reminded.**

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
- Theme: the marketing page uses `:root` in `src/app/globals.css` (paper `--bg: #E8DEC8`, oxblood
  `--accent: #8B0000`). The dashboard overrides those tokens on `.dashboard-root` in
  `src/app/dashboard/dashboard.css` with a jcode-style light theme (white, near-black ink, three
  grays, hairline borders). Eve dev overrides them again under `[data-eve]` with Night Owl colors,
  purple in place of blue. Always reference the variables, never hardcode the hex values.
- Dashboard text uses JetBrains Mono, loaded once in `src/app/dashboard/layout.tsx` and exposed as
  `var(--mono)`. Tailwind's `font-mono` is remapped to it inside the dashboard.

## Design principles

- Minimal chrome — content is the focus, not decoration.
- Hierarchy through color: accent = interactive/important, muted = supporting.
- Generous whitespace — sections breathe.
- No AI-slop patterns — no gradient blobs, no bento boxes, no generic 3-column icon grids.

## Build note

Note: `npm run build` overwrites `.next` and will kill a running `npm run dev`. Restart dev
after building.

## Eve

Eve is the personal assistant project that lives behind the hidden dashboard. The `/dashboard/eve`
page is its build dashboard — a living document updated as the project progresses.

Eve-specific rules (PROGRESS.md entry, eveData.ts sync, no personal info) are in `RULES.md`.

### Key files

- `src/eve/eveData.ts` — all page content; edit here to update the dashboard.
- `src/app/dashboard/(protected)/eve/page.tsx` — renders eveData; layout only.
- `src/app/dashboard/(protected)/eve/eve.css` — Eve dev component styles (JetBrains Mono, ink/muted/faint,
  fading hairlines, violet as the only accent). Color tokens live in `dashboard.css` under `[data-eve]`.
  Use these classes on Eve pages instead of inline colors.
- `src/components/dashboard/EveHeader.tsx` — shared title and meta for Eve dev.
- `src/eve/changelog.ts` — Changelog data: one entry per feature with its PR numbers. Add to it
  for every feature (RULES.md step 6). Rendered by `src/components/dashboard/EveChangelog.tsx`.
- `docs/decisions/` — one file per architectural decision, numbered from 0001.
- `docs/eve/PROGRESS.md` — session-by-session log.
