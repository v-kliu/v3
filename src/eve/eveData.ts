// All content for the Eve project dashboard lives here.
// To update the page, edit this file — no layout changes needed.

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
