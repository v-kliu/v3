Rules: (updated: 11/24/26 — PR ownership, PR consolidation, test coverage mandate)

This file is the source of truth for how work gets done in this repo. It is read only for
Claude Code. Victor edits it by hand. CLAUDE.md imports it, so every session loads it.

Development from Claude Code
1. Read Victor's request and break it down before touching code: the core feature, the main
   changes, and any upgrades. Restate that breakdown in a few lines.
2. Create a new branch from the latest origin/main for the feature. Never commit to main. If the
   main checkout is busy, use a separate git worktree (copying .env.local is fine). Several
   sessions can run in parallel, each on its own branch. Rebase on origin/main before the PR.
3. Build the change. Keep commits small and prefix them (eve:, feat:, fix:, docs:).
4. Verify locally: npx tsc --noEmit and npm run build must both pass. A broken build is an
   incomplete task. (npm run lint is not set up yet, it stops at an ESLint setup prompt.)
5. Spawn an independent subagent to verify the change. It checks that the feature works as
   described in step 1 and that nothing else broke (other dashboard pages, routes, mobile layout).
   For UI changes it takes screenshots. Fix anything it finds and verify again.
6. Add the feature to the Changelog in src/eve/changelog.ts. One entry per feature, with every
   pull request that belongs to it. Most features are one pull request, some are more.
7. Before pushing, consider what could go wrong in production: schema mismatches, missing env
   vars, constraint violations, edge cases in the new logic, CI/CD integration points. Write
   tests in src/__tests__/ that cover these risks. Every bug fix gets a test that would have
   caught it. Every new route or Supabase insert gets a schema-sync entry and shape constant.
8. Consolidate PRs of similar nature. Bug fixes for the same feature go in one PR. A test suite
   addition and the fix it validates go together. Do not open a separate PR for a one-line
   companion change — amend it into the branch that owns the feature.
9. Push the branch and open the pull request to main without waiting for Victor to trigger it.
   The description says what was built, where each file lives, and any judgment calls made.
   Victor should never have to run gh pr create himself.
10. Wait for the Vercel preview build on the pull request to pass. Only then report back to
    Victor with the pull request link and the preview link to check by hand.
11. No Co-Authored-By lines and no "Generated with Claude Code" in commits or pull requests.

Before starting
1. Read CLAUDE.md (gotchas) and the memory files in ~/.claude/projects/... for this repo.
2. For Eve work, read src/eve/eveData.ts and docs/decisions/ before proposing changes.

Architecture
1. For any architectural change, propose exactly 2 options with trade-offs and a recommendation,
   then wait for Victor to pick before writing code.
2. Record each architectural decision in docs/decisions/NNNN-title.md: context, options, choice,
   reason, and what would make us revisit it.
3. Every Supabase table is prefixed vkliu_. Eve tables are prefixed vkliu_eve_.
4. Every table has RLS (Row-Level Security) on with no policies. Never add a permissive anon
   policy, that makes the table world-writable.
5. SUPABASE_SECRET_KEY is server-side only. Never use it in client code or prefix it NEXT_PUBLIC_.
6. New API routes must be covered by the matcher in src/middleware.ts (not the root middleware.ts).

Learning Loop (applies to any decision or recommendation Victor asks for)
1. Before presenting options to Victor, write the sealed recommendation to vkliu_eve_decisions
   (or state it explicitly in the response if Supabase is not involved). This must happen before
   Victor says anything about his preference, so the recommendation cannot be influenced by him.
2. Present 2-4 options with trade-offs. Do not hint at the recommendation in the framing.
3. After Victor picks, compare his choice to the sealed recommendation. Grade the match 1-10 and
   write one sentence of critique: what the sealed rec got right or wrong, what Victor's pick
   implies about his priorities. Store this in vkliu_eve_decisions.
4. The goal is to give Victor actual system design feedback, not validation. If his pick and the
   sealed rec differ, say why clearly and what that trade-off costs him.
5. Never ask Victor to confirm the recommendation is good. Never change the sealed rec after the
   fact. Never agree with his pick just because he picked it.

Communication
1. One paragraph per response, plain English, no fluff. A smart high schooler should follow it.
2. No em dashes, no semicolons.
3. Plain English first, technical detail after if needed. Spell out every acronym on first use.
4. When Victor has to choose, follow the Learning Loop above, not just "give a recommendation."

Eve
1. At the end of every Eve session, append one entry to docs/eve/PROGRESS.md (date, what
   changed, what is next).
2. Keep src/eve/eveData.ts in sync with new decisions, phases, concepts, and ideas.
3. /dashboard/eve is the build dashboard only. No personal information about real people.
