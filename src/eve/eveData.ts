// All content for the Eve project dashboard lives here.
// To update the page, edit this file — no layout changes needed.
// Rules page: edit RULE_SECTIONS at the bottom of this file.

export type PhaseStatus = 'not started' | 'in progress' | 'done'

export interface RoadmapPhase {
  number: number
  title: string
  description: string
  concept: string
  status: PhaseStatus
}

export interface Decision {
  id: string        // e.g. "0001"
  title: string
  date: string      // YYYY-MM-DD
  summary: string
  file: string      // path under docs/decisions/
}

export interface Concept {
  term: string
  plain: string     // one plain-English sentence
}

export interface PipelineStep {
  label: string
  note: string
}

// ─── Summary ─────────────────────────────────────────────────────────────────

export const SUMMARY = {
  description:
    'Eve is a personal assistant I\'m building from scratch so I understand every piece of it. ' +
    'I text it or send a voice note, and it sorts what I said into an organized memory of the people, ' +
    'events, and ideas in my life, which it can search later to answer questions. ' +
    "It's also my workshop: when I want a new feature, Eve explains the design options, makes me pick one, " +
    "grades my choice, then builds and tests it. Unlike a regular chatbot, Eve's memory is a database I " +
    "designed and its tools are code I wrote, so when something goes wrong I can see exactly which step broke.",
  currentPhase: 'Phase 0 — Foundation',
  lastUpdated: '2026-11-16',
}

// ─── Pipeline ────────────────────────────────────────────────────────────────

// Two loops that describe how Eve works at a high level.
// The learning loop involves you; the build loop runs on its own.

export const LEARNING_LOOP: PipelineStep[] = [
  { label: 'Capture', note: 'text or voice note from you' },
  { label: 'Clarify', note: 'Eve restates your intent at the top of its reply' },
  { label: 'Research', note: 'options + trade-offs; a recommendation is sealed before you answer' },
  { label: 'You decide', note: 'pick an option' },
  { label: 'Graded', note: 'your choice is scored against the sealed recommendation' },
]

export const BUILD_LOOP: PipelineStep[] = [
  { label: 'Queue', note: 'your decision becomes a job' },
  { label: 'Build', note: 'agent writes the code' },
  { label: 'Test & fix', note: 'capped retries and spend limit' },
  { label: 'Report', note: 'preview link; always a pull request, never a direct push' },
]

// ─── Roadmap ─────────────────────────────────────────────────────────────────

export const PHASES: RoadmapPhase[] = [
  {
    number: 1,
    title: 'Telegram bot — learning loop',
    description:
      'A bot you can text. It runs the learning loop only: captures your message, ' +
      'clarifies intent, researches options, seals a recommendation, waits for your pick, then grades it.',
    concept: 'Webhooks, prompt design, storing decisions',
    status: 'not started',
  },
  {
    number: 2,
    title: 'Borrow the build loop',
    description:
      "Picking an option creates a GitHub issue. Claude's GitHub integration builds it, " +
      'and automated tests run on the pull request. You own the workflow but rent the execution.',
    concept: 'Continuous integration — automated tests that run on every change',
    status: 'not started',
  },
  {
    number: 3,
    title: 'Replace borrowed pieces',
    description:
      'Swap out the rented pieces with your own: a job queue, a worker that runs the build agent, ' +
      'and test agents with retry and timeout logic.',
    concept: 'Queues, retries, timeouts, background jobs',
    status: 'not started',
  },
  {
    number: 4,
    title: 'First Eve feature — knowledge graph',
    description:
      'A database of people, events, and notes linked to each other, with vector search ' +
      'so Eve can find the right memory given a fuzzy question.',
    concept: 'Data modeling, vector search, retrieval',
    status: 'not started',
  },
]

// ─── Decision log ─────────────────────────────────────────────────────────────

export const DECISIONS: Decision[] = [
  {
    id: '0001',
    title: 'Eve dashboard starts as a static data file',
    date: '2026-11-16',
    summary: 'All page content lives in eveData.ts; no backend until Phase 1.',
    file: 'docs/decisions/0001-eve-dashboard-static-data.md',
  },
]

// ─── Ideas inbox ──────────────────────────────────────────────────────────────

export const IDEAS: string[] = [
  'Daily briefing: Eve summarizes the day ahead from calendar + notes each morning',
  'Conversation replay: re-read any past Eve exchange with its sealed recommendation visible',
  'Hardware trigger: a physical button that starts a voice capture session',
  'Weekly review: Eve asks 5 questions about the week and stores the answers',
  'People memory: when I mention someone, Eve links the note to that person\'s record',
]

// ─── Eval set ─────────────────────────────────────────────────────────────────

// An eval is a fixed set of questions with known correct answers.
// You run each version of Eve against it several times and compare pass rates.
// This catches regressions — changes that break things that used to work.

export const EVAL_NOTE =
  'An eval is a fixed test set with known-correct answers. ' +
  'You run each new version of Eve against it, compare pass rates across versions, ' +
  'and catch regressions — changes that broke something that used to work. ' +
  "Eve's eval will cover retrieval accuracy, decision-grading correctness, " +
  'and build-loop reliability. 20 questions is a starting point; more get added as edge cases appear.'

export const EVAL_QUESTIONS: Array<{ question: string; expected: string }> = [
  // Placeholder — will be filled in during Phase 1 as real inputs are collected.
  { question: '(placeholder)', expected: '(placeholder)' },
]

// ─── Concepts learned ─────────────────────────────────────────────────────────

export const CONCEPTS: Concept[] = [
  {
    term: 'Webhook',
    plain:
      'A URL you give to an external service so it can POST data to you the moment something happens, instead of you polling repeatedly.',
  },
  {
    term: 'Job queue',
    plain:
      'A list of work items stored in a database or message broker so a background worker can pick them up one at a time, retry on failure, and not block the web server.',
  },
  {
    term: 'Vector search',
    plain:
      'Turning text into a list of numbers (an embedding) and finding the closest match by distance, so you can search by meaning rather than exact keywords.',
  },
  {
    term: 'Continuous integration (CI)',
    plain:
      'Automatically running your test suite on every pull request so you catch breakage before it reaches the main branch.',
  },
  {
    term: 'RLS (Row-Level Security)',
    plain:
      'A Postgres feature that attaches access rules directly to each table so the database enforces who can read or write each row, not just the application code.',
  },
]

// ─── Rules ───────────────────────────────────────────────────────────────────
// Edit this file to add, remove, or reorder rules and sections.
// Rules are stored in localStorage when edited in the browser, using this
// as the seed that loads on first visit or after a reset.

export interface RuleSection {
  id: string
  title: string
  rules: string[]
}

export const RULE_SECTIONS: RuleSection[] = [
  {
    id: 'during-dev',
    title: 'During Development',
    rules: [
      'All work happens on a dedicated dev branch from the very first commit — never commit to main directly.',
      'Multiple sessions can run in parallel on separate branches; treat each branch as independent.',
      'Every session ends with: push all changes to the branch, open a PR to main, wait for the build to go green.',
      'Only report back to Victor after the PR build passes — not before.',
      'The PR summary must include: what was built, where each file lives, and any judgment calls made.',
      'No Co-Authored-By attribution lines and no "Generated with Claude Code" in commits or PR descriptions.',
      'Every coding session must end with a passing npm run build — a broken build is an incomplete task.',
    ],
  },
  {
    id: 'architecture',
    title: 'Architecture Decisions',
    rules: [
      'For any architectural change, propose exactly 2 options with trade-offs and wait for Victor to pick before writing code.',
      'Every architectural decision gets a record in docs/decisions/NNNN-title.md with: context, options, choice, reason, and what would change the decision.',
      'All Supabase tables in this project are prefixed vkliu_ to avoid collisions with other projects sharing the instance.',
      'Eve-specific tables are prefixed vkliu_eve_.',
      'Every table has RLS enabled — never add a permissive anon policy, that makes the table world-writable.',
      'The secret Supabase key (SUPABASE_SECRET_KEY) is server-side only — never use it in client components or prefix it with NEXT_PUBLIC_.',
    ],
  },
  {
    id: 'communication',
    title: 'Communication Style',
    rules: [
      'One paragraph per response, plain English, no fluff — a smart high schooler should understand it.',
      'No em dashes, no semicolons.',
      'Explain in plain English first, then technical detail if needed.',
      'Spell out every acronym on first use.',
      'When asking Victor to decide between options, give a clear recommendation with the main trade-off — not an exhaustive survey.',
    ],
  },
  {
    id: 'eve-workflow',
    title: 'Eve Session Workflow',
    rules: [
      'At the end of every session: append one entry to docs/eve/PROGRESS.md (date, what changed, what is next).',
      'Update src/eve/eveData.ts to match any new decisions, phases, concepts, or ideas discussed in the session.',
      'The /dashboard/eve page is the build dashboard only — no personal information about real people goes there.',
    ],
  },
  {
    id: 'retrieval',
    title: 'Retrieving Information',
    rules: [
      'Read CLAUDE.md at the start of every session — it has gotchas that override general knowledge.',
      'Check src/middleware.ts before adding any API route — new protected routes must be added to the matcher or they are publicly reachable.',
      'The live middleware is src/middleware.ts, not the root middleware.ts — edits to the root file do nothing.',
      'For Eve-specific context, read src/eve/eveData.ts and docs/decisions/ before proposing changes.',
      'Memory files in ~/.claude/projects/... hold cross-session preferences — read them when starting a new session.',
    ],
  },
]
