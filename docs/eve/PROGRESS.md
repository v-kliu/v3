# Eve — progress log

Append one entry per session. Newest at the top.

---

## 2026-11-24 — workflow graph on Eve dev

**What changed**
- New Workflows section on `/dashboard/eve`: a React Flow graph per bot command (/build, /journal,
  /ask, /help). Lanes are You, Webhook, Development (GitHub Actions) and Review.
- Clicking a stage shows what it does, the file that runs it, what happens if it fails, and the
  RULES.md rules it follows. Rule text is parsed from RULES.md at build time (`src/eve/rules.ts`).
- Stage data lives in `src/eve/workflows.ts`. `src/__tests__/workflows.test.ts` fails if a stage's
  file, model, table or rule reference drifts from the code or RULES.md.
- The graph marks two gaps in the automated /build pipeline: no independent verification agent and
  no changelog entry, both required by RULES.md.
- Added an npm override so React Flow gets d3-transition 3 (react-simple-maps pins 2, which crashed
  the page with "interrupt is not a function"). Covered by a test.

**What's next**
- Close the two gaps in eve-build.yml: a verification step and an automatic changelog entry.

---

## 2026-11-23 — rules file, feature changelog, centered layout

**What changed**
- Rules moved to `RULES.md` at the repo root, imported by `CLAUDE.md`. The Rules tab, its
  localStorage editor, and `RULE_SECTIONS` in `eveData.ts` are gone.
- Changelog is now static data in `src/eve/changelog.ts`: one box per feature, each linking to
  its pull requests. The GitHub-backed `/api/eve/changelog` route is removed.
- Eve dev is centered (removed the full-width override in `dashboard.css`).

**What's next**
- Every feature follows RULES.md and adds its own changelog entry.

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

---

## 2026-11-17 — dashboard-wide jcode theme, Night Owl for eve dev

**What changed**
- Every dashboard tab (flight, journal, todo, 向上, grit) now uses a jcode-style light theme:
  white page, near-black ink, three grays, hairline borders, JetBrains Mono. No colored page wash.
- Eve dev keeps its layout, recolored to Night Owl with purple in place of blue. Commit-type
  tags use Night Owl syntax colors.
- JetBrains Mono now loads once in `src/app/dashboard/layout.tsx` as `--jb-mono` (`var(--mono)`).

**What's next**
- Nothing pending from this change.
