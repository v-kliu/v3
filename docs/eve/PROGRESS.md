# Eve — progress log

Append one entry per session. Newest at the top.

---

## 2026-11-16

**What changed**
- Created `src/eve/eveData.ts`: single typed data file holding all Eve dashboard content
  (summary, pipeline, roadmap, decisions, ideas, eval set, concepts).
- Created `src/app/dashboard/(protected)/eve/page.tsx`: renders `eveData.ts`, fully static,
  no backend. Route is `/dashboard/eve`, behind the same JWT auth as the rest of the dashboard.
- Added Eve to the dashboard sidebar (`Bot` icon, violet — PALETTE[5]).
- Added `/dashboard/eve` theme entry to `theme.ts`.
- Created `docs/decisions/0001-eve-dashboard-static-data.md`.
- Added Eve section to `CLAUDE.md`.

**What's next**
- Phase 1: Telegram bot that runs the learning loop. Decisions and ideas will migrate from
  the static data file to Supabase tables (`vkliu_eve_decisions`, `vkliu_eve_ideas`).
- Fill in the eval set with 20 real questions once the bot is in use.
- Update Phase 1 status in `eveData.ts` from `not started` to `in progress` when work begins.

---

## 2026-11-16 — live changelog on the Eve dashboard

**What changed**
- Added `src/app/api/eve/changelog/route.ts`: reads open PRs (and the commits each one adds)
  plus recent commits on main from the GitHub REST API. Cached 2 minutes. Session-protected
  like every `/api` route. Optional `GITHUB_TOKEN` env var raises the rate limit.
- Added `src/components/dashboard/EveChangelog.tsx`: renders the changelog under the summary.
  Open PRs are listed with their commits as features. A toggle reveals the commit history on
  main, grouped by day. Commit prefixes like `eve:` or `fix:` become tags.

**What's next**
- Keep commit messages prefixed (`eve:`, `feat:`, `fix:`, `docs:`) so the tags stay useful.

---

## 2026-11-16 — Eve dev visual refresh

**What changed**
- Renamed the sidebar item and page title to "eve dev".
- New look based on jcode.sh's design principles: JetBrains Mono throughout, a near-monochrome
  ink/muted/faint palette, fading hairlines instead of boxes, small outlined tags, and violet
  used only for links, active tabs and focus.
- Component styles moved into `src/app/dashboard/(protected)/eve/eve.css`. Tokens stay in
  `dashboard.css` under `[data-eve]`.
- `EveHeader.tsx` replaces `EveTabs.tsx` and is shared by the overview and rules pages.
- Commit history is now a native disclosure with a scrolling log grouped by day.
- Blueprint grid and typing background kept, but quieter.

**What's next**
- New Eve sections should reuse the eve.css classes (`eve-h2`, `eve-entry`, `eve-rows`, `eve-tag`).
