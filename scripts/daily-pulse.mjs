// Daily pulse: decides whether today gets a commit, and if so toggles a
// trailing blank line at the end of README.md.
//
// Rules:
//   - At most one pulse per day (skip if main already has a commit today, UTC).
//   - Otherwise commit with probability COMMIT_PROBABILITY, so the graph has
//     natural-looking holes.
//   - Never allow more than MAX_EMPTY_DAYS empty days in a row: once the last
//     commit is older than that, commit no matter what.

import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs'

export const COMMIT_PROBABILITY = 0.6
export const MAX_EMPTY_DAYS = 3
const DAY_MS = 24 * 60 * 60 * 1000

/** Whole UTC calendar days between two dates (0 = same day). */
export function utcDaysBetween(earlier, later) {
  const a = Date.UTC(earlier.getUTCFullYear(), earlier.getUTCMonth(), earlier.getUTCDate())
  const b = Date.UTC(later.getUTCFullYear(), later.getUTCMonth(), later.getUTCDate())
  return Math.round((b - a) / DAY_MS)
}

/**
 * @param {number} daysSinceLast calendar days since the last commit on main
 * @param {number} rand a number in [0, 1)
 * @returns {'skip-today' | 'force' | 'random-commit' | 'random-skip'}
 */
export function decide(daysSinceLast, rand) {
  if (daysSinceLast < 1) return 'skip-today'
  // daysSinceLast - 1 = empty days so far; committing is forced once
  // skipping would push the run past MAX_EMPTY_DAYS.
  if (daysSinceLast - 1 >= MAX_EMPTY_DAYS) return 'force'
  return rand < COMMIT_PROBABILITY ? 'random-commit' : 'random-skip'
}

/** Adds a trailing blank line if there is none, removes it if there is. */
export function toggleTrailingBlank(content) {
  const base = content.replace(/\s+$/, '')
  return content === base + '\n' ? base + '\n\n' : base + '\n'
}

function main() {
  const lastIso = execSync('git log -1 --format=%cI', { encoding: 'utf8' }).trim()
  const days = utcDaysBetween(new Date(lastIso), new Date())
  const decision = decide(days, Math.random())
  const commit = decision === 'force' || decision === 'random-commit'

  console.log(`last commit ${lastIso}, ${days} day(s) ago -> ${decision}`)

  if (commit) {
    writeFileSync('README.md', toggleTrailingBlank(readFileSync('README.md', 'utf8')))
  }
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `commit=${commit}\n`)
  }
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main()
}
