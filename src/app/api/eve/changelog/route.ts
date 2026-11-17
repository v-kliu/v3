import { NextResponse } from 'next/server'

// Live changelog for the Eve dashboard: open PRs (with the commits each one adds)
// plus recent commits on main. Read straight from the GitHub REST API.
// Protected by src/middleware.ts like every other /api route.

const REPO = 'v-kliu/v3'
const API = `https://api.github.com/repos/${REPO}`
const REVALIDATE_SECONDS = 120
const MAIN_COMMIT_LIMIT = 60

type GhCommit = {
  sha: string
  html_url: string
  parents: { sha: string }[]
  commit: { message: string; author: { name: string; date: string } | null }
}

type GhPull = {
  number: number
  title: string
  html_url: string
  draft: boolean
  created_at: string
  updated_at: string
  head: { ref: string }
}

export type ChangelogCommit = {
  sha: string
  url: string
  tag: string
  message: string
  date: string
}

export type ChangelogPull = {
  number: number
  title: string
  url: string
  branch: string
  draft: boolean
  updatedAt: string
  commits: ChangelogCommit[]
}

export type ChangelogResponse = {
  repo: string
  pulls: ChangelogPull[]
  commits: ChangelogCommit[]
  fetchedAt: string
}

async function gh<T>(path: string): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  // Optional: raises the rate limit from 60/hr to 5000/hr. The repo is public so it works without.
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

  const res = await fetch(`${API}${path}`, { headers, next: { revalidate: REVALIDATE_SECONDS } })
  if (!res.ok) throw new Error(`GitHub ${res.status} on ${path}`)
  return res.json() as Promise<T>
}

// "eve: add rules page" -> tag "eve", message "add rules page"
// "fix(sidebar): icon type" / "eve bg: slower spawn" -> tag "fix" / "eve"
// anything without a prefix -> tag "commit"
const PREFIX = /^([a-z][a-z0-9-]{0,15})(?:\([^)]*\)| [a-z0-9-]{1,20})?!?:\s+(.+)$/i

function toEntry(c: GhCommit): ChangelogCommit {
  const subject = c.commit.message.split('\n')[0].trim()
  const m = subject.match(PREFIX)
  return {
    sha: c.sha.slice(0, 7),
    url: c.html_url,
    tag: m ? m[1].toLowerCase() : 'commit',
    message: m ? m[2] : subject,
    date: c.commit.author?.date ?? '',
  }
}

const isMerge = (c: GhCommit) => c.parents.length > 1

export async function GET() {
  try {
    const [pullsRaw, mainRaw] = await Promise.all([
      gh<GhPull[]>('/pulls?state=open&per_page=30&sort=updated&direction=desc'),
      gh<GhCommit[]>(`/commits?sha=main&per_page=${MAIN_COMMIT_LIMIT}`),
    ])

    // Commits already on main are not "new" features of a PR, so hide them.
    const onMain = new Set(mainRaw.map(c => c.sha))

    const pulls: ChangelogPull[] = await Promise.all(
      pullsRaw.map(async p => {
        const commits = await gh<GhCommit[]>(`/pulls/${p.number}/commits?per_page=100`)
        return {
          number: p.number,
          title: p.title,
          url: p.html_url,
          branch: p.head.ref,
          draft: p.draft,
          updatedAt: p.updated_at,
          commits: commits
            .filter(c => !isMerge(c) && !onMain.has(c.sha))
            .map(toEntry)
            .reverse(), // newest first
        }
      }),
    )

    const body: ChangelogResponse = {
      repo: REPO,
      pulls,
      commits: mainRaw.filter(c => !isMerge(c)).map(toEntry),
      fetchedAt: new Date().toISOString(),
    }
    return NextResponse.json(body)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
