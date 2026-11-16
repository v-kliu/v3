# 0001 — Eve dashboard starts as a static data file

**Date:** 2026-11-16

## Context

The Eve project dashboard is a living page inside the hidden personal dashboard at `/dashboard/eve`.
It needs to display: a project summary, the two-loop pipeline, a roadmap, a decision log, an ideas
inbox, an eval set, and a glossary of concepts. All of this information changes as the project
progresses.

## Options considered

**Option A — Static TypeScript data file (`src/eve/eveData.ts`)**
All content lives in a single typed file. The page imports it directly. No network request,
no database, no environment variables required.

Trade-offs:
- Pro: zero infrastructure; works immediately; content is version-controlled alongside code.
- Pro: TypeScript types catch shape errors at build time, not at runtime.
- Con: updating the page requires editing a source file and redeploying, not a database write.
- Con: does not scale to dynamic data (live decision records, run history, etc.) — will need
  migration when Phase 1 adds Supabase integration.

**Option B — Supabase table from the start**
Create a `vkliu_eve_*` schema, write API routes, and fetch data client-side the same way the
other dashboard tabs do.

Trade-offs:
- Pro: data can be updated without a deploy.
- Con: requires schema design, migrations, and API routes before a single line of page UI exists.
- Con: adds complexity before the shape of the data is well understood.

## Decision

**Option A.** Start with a static data file.

The dashboard is a rough first draft. The data schema will change as the project evolves —
building a database schema now would mean migrating it repeatedly. A flat TypeScript file is
easy to read, easy to edit, and can be replaced with a real backend once the shape stabilises.

## What would make us revisit this

- Phase 1 ships (Telegram bot, Supabase already in use): migrate decision log and ideas inbox
  to `vkliu_eve_decisions` and `vkliu_eve_ideas`, keeping the static file as the seed/fallback.
- The page needs to reflect live data (e.g. latest build status, run history) that cannot be
  committed to source.
