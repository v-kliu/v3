// What happens when you message the Eve bot, one workflow per command.
// Rendered as a graph on /dashboard/eve by EveWorkflows.tsx.
// Each stage points at the file that runs it and at the RULES.md rules that govern it
// (by section title and rule number, resolved against RULES.md at build time).
// src/__tests__/workflows.test.ts fails if a stage drifts from the code or from RULES.md.

export type StageKind = 'human' | 'code' | 'ai' | 'db' | 'github' | 'reply'

// live: runs today. gap: RULES.md asks for it but the automated pipeline does not do it yet.
// planned: on the roadmap, not built.
export type StageStatus = 'live' | 'gap' | 'planned'

export interface RuleRef {
  section: string
  rules: number[]
}

export interface Stage {
  id: string
  lane: string
  label: string
  kind: StageKind
  status?: StageStatus
  model?: string // Claude model id, must appear in `file`
  table?: string // Supabase table, must appear in `file`
  file?: string // repo path that runs this stage
  what: string
  onFail?: string
  rules?: RuleRef[]
}

export interface Edge {
  from: string
  to: string
}

export interface Lane {
  id: string
  label: string
  where: string
}

export interface Workflow {
  command: string
  title: string
  summary: string
  lanes: Lane[]
  stages: Stage[]
  edges: Edge[]
}

const WEBHOOK = 'src/app/api/eve/telegram/route.ts'
const DEV = 'Development from Claude Code'
const ARCH = 'Architecture'

const YOU: Lane = { id: 'you', label: 'You', where: 'Telegram' }
const HOOK: Lane = { id: 'hook', label: 'Webhook', where: 'Vercel · /api/eve/telegram' }

// The first five stages are shared by every command that goes through the router.
function intake(command: string): Stage[] {
  return [
    {
      id: 'send', lane: 'you', kind: 'human', label: `Send ${command}`,
      what: command === '/build'
        ? 'You text Eve on Telegram. A message with no command prefix is treated as /build too.'
        : `You text Eve on Telegram, starting with ${command}.`,
    },
    {
      id: 'verify', lane: 'hook', kind: 'code', label: 'Check webhook secret', file: WEBHOOK,
      what: 'Telegram calls the webhook from outside, so it is not behind the dashboard login. It only accepts requests whose X-Telegram-Bot-Api-Secret-Token header matches TELEGRAM_WEBHOOK_SECRET.',
      onFail: 'Wrong or missing secret returns 401 and nothing else runs.',
      rules: [{ section: ARCH, rules: [6] }],
    },
    {
      id: 'sanitize', lane: 'hook', kind: 'ai', label: 'Sanitize text', file: 'src/eve/sanitize.ts',
      model: 'claude-haiku-5-5',
      what: 'Claude Haiku cleans up garbled mobile typing into a clear instruction before anything else reads it.',
      onFail: 'If Haiku errors, Eve carries on with your raw text.',
    },
    {
      id: 'classify', lane: 'hook', kind: 'code', label: 'Classify command', file: 'src/eve/router.ts',
      what: 'Reads the prefix (/build, /journal, /ask) and picks the route. Anything without a known prefix becomes /build.',
    },
    {
      id: 'session', lane: 'hook', kind: 'db', label: 'Save session', file: WEBHOOK, table: 'vkliu_eve_sessions',
      what: 'Stores the raw text, cleaned text and command type as one row, status "received".',
      onFail: 'Eve replies with the insert error so you know it was not saved.',
      rules: [{ section: ARCH, rules: [3, 4, 5] }, { section: DEV, rules: [7] }],
    },
  ]
}

const INTAKE_EDGES: Edge[] = [
  { from: 'send', to: 'verify' },
  { from: 'verify', to: 'sanitize' },
  { from: 'sanitize', to: 'classify' },
  { from: 'classify', to: 'session' },
]

export const WORKFLOWS: Workflow[] = [
  {
    command: '/build',
    title: 'Build a feature',
    summary: 'A message becomes a spec, the spec becomes a branch, and Claude builds it into a pull request for you to review.',
    lanes: [
      YOU,
      HOOK,
      { id: 'dev', label: 'Development', where: 'GitHub Actions · eve-build.yml' },
      { id: 'review', label: 'Review', where: 'Pull request' },
    ],
    stages: [
      ...intake('/build'),
      {
        id: 'structure', lane: 'hook', kind: 'ai', label: 'Structure into a spec', file: 'src/eve/structure.ts',
        model: 'claude-sonnet-4-6',
        what: 'Eve first replies "Structuring: …". Then Claude Sonnet turns the request into a spec: title, one-line summary, 4 to 10 atomic steps, acceptance criteria and the files likely touched.',
        onFail: 'Eve replies "Failed to structure the feature" and stops.',
        rules: [{ section: DEV, rules: [1] }],
      },
      {
        id: 'spec', lane: 'hook', kind: 'db', label: 'Save spec', file: WEBHOOK, table: 'vkliu_eve_dev_sessions',
        what: 'Stores the spec linked to the session, status "structured".',
        onFail: 'Eve replies that the spec was structured but not saved.',
        rules: [{ section: ARCH, rules: [3, 4] }, { section: DEV, rules: [7] }],
      },
      {
        id: 'trigger', lane: 'hook', kind: 'github', label: 'Trigger build', file: WEBHOOK,
        what: 'Starts the eve-build GitHub Actions workflow on main with the spec id, using the GH_PAT token. Eve replies with the steps it queued.',
        onFail: 'Eve replies with the GitHub error and the spec stays saved.',
      },
      {
        id: 'branch', lane: 'dev', kind: 'github', label: 'Create branch', file: '.github/workflows/eve-build.yml',
        what: 'Checks out main and creates eve/auto-<title>-<id>, so nothing is ever committed to main.',
        rules: [{ section: DEV, rules: [2] }],
      },
      {
        id: 'fetch', lane: 'dev', kind: 'db', label: 'Load spec', file: '.github/workflows/eve-build.yml',
        table: 'vkliu_eve_dev_sessions',
        what: 'Reads the saved spec row from Supabase and hands it to the agent.',
      },
      {
        id: 'agent', lane: 'dev', kind: 'ai', label: 'Claude builds it', file: '.github/scripts/eve-agent.mjs',
        model: 'claude-sonnet-4-6',
        what: 'Claude Sonnet runs in a loop with read_file, write_file, list_files and run_bash, working through the spec steps until it calls done. It is not asked to write tests yet, which RULES.md requires.',
        onFail: 'Only hitting the 40-step limit or an API error stops the run, and then you get no message. If Claude gives up by calling done, the workflow does not notice: it still builds and opens a PR if the build passes.',
        rules: [{ section: DEV, rules: [7] }],
      },
      {
        id: 'check', lane: 'dev', kind: 'code', label: 'Build + type-check', file: '.github/workflows/eve-build.yml',
        what: 'Runs npm run build and npx tsc --noEmit on the result.',
        onFail: 'The workflow stops and no pull request is opened. You are not told on Telegram, and the spec row stays "structured".',
        rules: [{ section: DEV, rules: [4] }],
      },
      {
        id: 'pr', lane: 'dev', kind: 'github', label: 'Push + open PR', file: '.github/workflows/eve-build.yml',
        what: 'Commits everything as one "feat: … (eve auto-build)" commit as Eve Bot, pushes the branch and opens a pull request to main. The PR description is a single line, so it does not yet say what was built, where files live or what judgment calls were made.',
        rules: [{ section: DEV, rules: [3, 9, 11] }],
      },
      {
        id: 'notify', lane: 'dev', kind: 'reply', label: 'Save PR + notify you', file: '.github/workflows/eve-build.yml',
        table: 'vkliu_eve_dev_sessions',
        what: 'Writes the PR link back to the spec row (status "pr_opened") and sends you "PR ready" on Telegram. This goes out as soon as the PR opens, before the Vercel preview is ready, which RULES.md says to wait for. Both calls fail silently.',
        rules: [{ section: DEV, rules: [10] }],
      },
      {
        id: 'ci', lane: 'review', kind: 'code', label: 'CI: tests + build', file: '.github/workflows/ci.yml',
        what: 'Runs on the pull request as two checks: Unit Tests (type check + Vitest) and Build Check (production build). It only runs tests that already exist, because the agent does not add new ones.',
        rules: [{ section: DEV, rules: [4] }],
      },
      {
        id: 'verify-agent', lane: 'review', kind: 'ai', status: 'gap', label: 'Independent check',
        what: 'RULES.md asks for a separate agent to confirm the feature works and nothing else broke. The automated pipeline does not do this yet. It only happens when Claude Code builds a feature by hand.',
        rules: [{ section: DEV, rules: [5] }],
      },
      {
        id: 'changelog', lane: 'review', kind: 'code', status: 'gap', label: 'Changelog entry', file: 'src/eve/changelog.ts',
        what: 'RULES.md asks for every feature to be added to the changelog. Eve auto-builds do not add an entry yet, so they get filed by hand.',
        rules: [{ section: DEV, rules: [6] }],
      },
      {
        id: 'preview', lane: 'review', kind: 'github', label: 'Vercel preview',
        what: 'Vercel builds a preview deployment for the branch and posts the link on the pull request.',
        rules: [{ section: DEV, rules: [10] }],
      },
      {
        id: 'merge', lane: 'review', kind: 'human', label: 'You review + merge',
        what: 'You open the preview, check it by hand and merge the pull request.',
        rules: [{ section: DEV, rules: [10] }],
      },
    ],
    edges: [
      ...INTAKE_EDGES,
      { from: 'session', to: 'structure' },
      { from: 'structure', to: 'spec' },
      { from: 'spec', to: 'trigger' },
      { from: 'trigger', to: 'branch' },
      { from: 'branch', to: 'fetch' },
      { from: 'fetch', to: 'agent' },
      { from: 'agent', to: 'check' },
      { from: 'check', to: 'pr' },
      { from: 'pr', to: 'notify' },
      { from: 'pr', to: 'ci' },
      { from: 'ci', to: 'verify-agent' },
      { from: 'verify-agent', to: 'changelog' },
      { from: 'changelog', to: 'preview' },
      { from: 'preview', to: 'merge' },
    ],
  },
  {
    command: '/journal',
    title: 'Save a note',
    summary: 'A personal note is cleaned up and stored as-is.',
    lanes: [YOU, HOOK],
    stages: [
      ...intake('/journal'),
      {
        id: 'reply', lane: 'hook', kind: 'reply', label: 'Reply "Saved note"', file: WEBHOOK,
        what: 'The note lives in vkliu_eve_sessions with type "journal". Eve confirms it was saved.',
      },
    ],
    edges: [...INTAKE_EDGES, { from: 'session', to: 'reply' }],
  },
  {
    command: '/ask',
    title: 'Ask a question',
    summary: 'A question is saved now. Research and a sealed recommendation are planned.',
    lanes: [YOU, HOOK, { id: 'later', label: 'Planned', where: 'Learning loop' }],
    stages: [
      ...intake('/ask'),
      {
        id: 'reply', lane: 'hook', kind: 'reply', label: 'Reply "coming soon"', file: WEBHOOK,
        what: 'Eve saves the question and replies that research is coming soon.',
      },
      {
        id: 'research', lane: 'later', kind: 'ai', status: 'planned', label: 'Research + sealed rec',
        what: 'Planned: Eve researches the options, seals its recommendation before you answer, then grades your pick against it.',
        rules: [{ section: 'Learning Loop (applies to any decision or recommendation Victor asks for)', rules: [1, 2, 3, 4, 5] }],
      },
    ],
    edges: [...INTAKE_EDGES, { from: 'session', to: 'reply' }, { from: 'reply', to: 'research' }],
  },
  {
    command: '/help',
    title: 'Get help',
    summary: '/start or /help lists the commands. Nothing is saved.',
    lanes: [YOU, HOOK],
    stages: [
      { id: 'send', lane: 'you', kind: 'human', label: 'Send /help', what: 'You text /start or /help.' },
      {
        id: 'verify', lane: 'hook', kind: 'code', label: 'Check webhook secret', file: WEBHOOK,
        what: 'Same secret check as every other command.',
        onFail: 'Wrong or missing secret returns 401.',
        rules: [{ section: ARCH, rules: [6] }],
      },
      {
        id: 'reply', lane: 'hook', kind: 'reply', label: 'Reply with commands', file: WEBHOOK,
        what: 'Eve lists /build, /journal and /ask. This runs before sanitizing, so it is instant and nothing is stored.',
      },
    ],
    edges: [{ from: 'send', to: 'verify' }, { from: 'verify', to: 'reply' }],
  },
]
