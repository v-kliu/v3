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
