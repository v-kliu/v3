// Eve dev changelog. One entry per feature, newest first.
// Each feature lists every pull request that belongs to it (usually one, sometimes more).
// Claude Code adds an entry as part of every feature (see RULES.md, step 6).

export interface ChangelogPR {
  number: number
  title: string
}

export interface ChangelogFeature {
  title: string
  date: string // YYYY-MM-DD, when the first PR was opened
  summary: string
  prs: ChangelogPR[]
}

export const REPO_URL = 'https://github.com/v-kliu/v3'

export const CHANGELOG: ChangelogFeature[] = [
  {
    title: 'Rules as a file, feature changelog, centered layout',
    date: '2026-11-23',
    summary:
      'Rules moved out of the dashboard into RULES.md, loaded by CLAUDE.md. Changelog now groups pull requests by feature. Eve dev is centered.',
    prs: [{ number: 8, title: 'eve: rules as RULES.md, feature changelog, centered eve dev' }],
  },
  {
    title: 'Visual refresh',
    date: '2026-11-17',
    summary:
      'jcode-inspired look: JetBrains Mono, near-monochrome palette, Night Owl purple for eve dev, light theme for the other dashboard tabs.',
    prs: [
      { number: 5, title: 'eve dev: jcode-inspired visual refresh' },
      { number: 6, title: 'dashboard: jcode light theme for every tab, Night Owl purple for eve dev' },
    ],
  },
  {
    title: 'Live changelog',
    date: '2026-11-16',
    summary: 'Open pull requests and commit history pulled from GitHub. Replaced by this feature list.',
    prs: [{ number: 4, title: 'eve: live changelog on the Eve dashboard' }],
  },
  {
    title: 'Rules page',
    date: '2026-11-16',
    summary: 'Editable rules tab at /dashboard/eve/rules. Replaced by RULES.md.',
    prs: [{ number: 3, title: 'Eve: rules page at /dashboard/eve/rules' }],
  },
  {
    title: 'Eve build dashboard',
    date: '2026-11-16',
    summary:
      'Static page at /dashboard/eve: summary, pipeline, roadmap, decision log, ideas, eval set, concepts.',
    prs: [{ number: 1, title: 'add Eve project dashboard at /dashboard/eve' }],
  },
]
