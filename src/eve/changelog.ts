// Eve dev changelog. One entry per feature, newest first.
// Each feature lists every pull request that belongs to it (usually one, sometimes more).
// Claude Code adds an entry as part of every feature (see RULES.md, step 6).
// `status` is a fallback: once the page loads live PR state from GitHub (/api/eve/prs),
// a feature with PRs shows open while any PR is open and closed once all are merged.
// `planned` features (no PRs yet) always use this value.

export interface ChangelogPR {
  number: number
  title: string
}

export type FeatureStatus = 'open' | 'closed' | 'planned'

export interface ChangelogFeature {
  title: string
  date: string // YYYY-MM-DD, when the first PR was opened
  summary: string
  status: FeatureStatus
  prs: ChangelogPR[]
}

export const REPO_URL = 'https://github.com/v-kliu/v3'

export const CHANGELOG: ChangelogFeature[] = [
  // ── Open ──────────────────────────────────────────────────────────────────
  {
    title: 'Schema contract tests',
    date: '2026-11-23',
    summary:
      'Test suite catches insert shape mismatches (the class of bug that caused the telegram session insert failure), missing GHA env vars, and sync classifier contract. 18 tests across router, telegram route, env, and changelog.',
    status: 'open',
    prs: [],
  },
  {
    title: 'Telegram router + GitHub Actions build',
    date: '2026-11-23',
    summary:
      'MessageType enum routes /build, /journal, /ask. Sonnet structures feature requests into step-by-step specs stored in vkliu_eve_dev_sessions. GitHub Actions agentic loop checks out the repo, implements the spec, opens a PR, and notifies Telegram.',
    status: 'open',
    prs: [{ number: 12, title: 'eve: live PR status on the changelog' }],
  },
  // ── Planned ───────────────────────────────────────────────────────────────
  {
    title: 'Learning loop',
    date: '2026-11-23',
    summary:
      'Full decision cycle: clarify intent, research options, seal recommendation, receive pick, grade against sealed rec (1–10 + one sentence). Stored in vkliu_eve_decisions.',
    status: 'planned',
    prs: [],
  },
  // ── Closed ────────────────────────────────────────────────────────────────
  {
    title: 'Telegram + prompt sanitization',
    date: '2026-11-23',
    summary:
      'Webhook at /api/eve/telegram. Receives mobile messages, runs sanitize() via Claude Haiku to clean garbled text into structured instructions, stores session to Supabase.',
    status: 'closed',
    prs: [{ number: 11, title: 'feat: telegram webhook + prompt sanitization' }],
  },
  {
    title: 'Eve UI polish',
    date: '2026-11-23',
    summary:
      'Fluid viewport width, text-align center, purple changelog feature cards, clean header, traffic-light status dots, shorthand dates.',
    status: 'closed',
    prs: [{ number: 10, title: 'eve: centered text, purple changelog cards, smaller fonts' }],
  },
  {
    title: 'Drop Upstash Redis and OpenAI',
    date: '2026-11-23',
    summary:
      'Visit counter reads a count of every row in vkliu_visits from Supabase. Login rate limiting removed. Audio transcription and journal analysis turned off.',
    status: 'closed',
    prs: [{ number: 7, title: 'drop upstash redis and openai audio' }],
  },
  {
    title: 'Rules as a file, feature changelog, centered layout',
    date: '2026-11-23',
    summary:
      'Rules moved out of the dashboard into RULES.md, loaded by CLAUDE.md. Changelog now groups pull requests by feature. Eve dev is centered.',
    status: 'closed',
    prs: [{ number: 8, title: 'eve: rules as RULES.md, feature changelog, centered eve dev' }],
  },
  {
    title: 'Visual refresh',
    date: '2026-11-17',
    summary:
      'jcode-inspired look: JetBrains Mono, near-monochrome palette, Night Owl purple for eve dev, light theme for the other dashboard tabs.',
    status: 'closed',
    prs: [
      { number: 5, title: 'eve dev: jcode-inspired visual refresh' },
      { number: 6, title: 'dashboard: jcode light theme for every tab, Night Owl purple for eve dev' },
    ],
  },
  {
    title: 'Live changelog',
    date: '2026-11-16',
    summary: 'Open pull requests and commit history pulled from GitHub. Replaced by this feature list.',
    status: 'closed',
    prs: [{ number: 4, title: 'eve: live changelog on the Eve dashboard' }],
  },
  {
    title: 'Rules page',
    date: '2026-11-16',
    summary: 'Editable rules tab at /dashboard/eve/rules. Replaced by RULES.md.',
    status: 'closed',
    prs: [{ number: 3, title: 'Eve: rules page at /dashboard/eve/rules' }],
  },
  {
    title: 'Eve build dashboard',
    date: '2026-11-16',
    summary:
      'Static page at /dashboard/eve: summary, pipeline, roadmap, decision log, ideas, eval set, concepts.',
    status: 'closed',
    prs: [{ number: 1, title: 'add Eve project dashboard at /dashboard/eve' }],
  },
]
