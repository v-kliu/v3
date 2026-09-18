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
  `journal_jobs` is the one exception, with 3 policies of its own.
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

## Git workflow

After every completed task where the build passes: stage all changes, write a concise commit
message, commit and push to the current branch. Do not commit if the build is failing.
