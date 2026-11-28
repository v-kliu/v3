// Daily pulse: decides whether today gets a commit, and if so toggles a
// trailing blank line at the end of README.md.
//
// Rules:
//   - At most one pulse per day (skip if Victor already committed today, Pacific).
//   - Otherwise commit with probability COMMIT_PROBABILITY, so the graph has
//     natural-looking holes.
//   - Never allow more than MAX_EMPTY_DAYS empty days in a row: once the last
//     commit is older than that, commit no matter what.

import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs'

export const COMMIT_PROBABILITY = 0.6
export const MAX_EMPTY_DAYS = 3
const DAY_MS = 24 * 60 * 60 * 1000

// The contribution graph places Victor's commits on Pacific calendar days.
export const TIME_ZONE = 'America/Los_Angeles'
// Matches the author emails that count toward Victor's graph.
export const AUTHOR_PATTERN = 'vkliu@uw.edu\\|v-kliu@users.noreply.github.com'

function dayStamp(date, timeZone) {
  // en-CA formats as YYYY-MM-DD
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
  return Date.parse(`${ymd}T00:00:00Z`)
}

/** Whole calendar days between two dates in the given time zone (0 = same day). */
export function daysBetween(earlier, later, timeZone = TIME_ZONE) {
  return Math.round((dayStamp(later, timeZone) - dayStamp(earlier, timeZone)) / DAY_MS)
}

/**
 * @param {number} daysSinceLast Pacific calendar days since Victor's last commit
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
  const lastIso = execSync(`git log -1 --author='${AUTHOR_PATTERN}' --format=%aI`, { encoding: 'utf8' }).trim()
  // No matching commit in the fetched history counts as a long gap.
  const days = lastIso ? daysBetween(new Date(lastIso), new Date()) : Infinity
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
