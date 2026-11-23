import { NextResponse } from 'next/server'

// Live pull request status for the Eve dev changelog.
// One GitHub call lists every PR. Each open PR then gets its build status
// (the Vercel commit status) and its preview URL (the Vercel deployment).
// Session-protected like every /api route (src/middleware.ts).
// Results are cached in memory for CACHE_MS. ?fresh=1 skips the cache (the refresh button).

const REPO = 'v-kliu/v3'
const API = 'https://api.github.com'
const CACHE_MS = 60_000

export type PRState = 'open' | 'merged' | 'closed'
export type BuildState = 'success' | 'pending' | 'failure'

export interface LivePR {
  number: number
  title: string
  url: string
  state: PRState
  draft: boolean
  branch: string
  updatedAt: string
  build: BuildState | null // open PRs only
  preview: string | null // open PRs only
}

export interface LivePRResponse {
  pulls: LivePR[]
  fetchedAt: string
}

interface GhPull {
  number: number
  title: string
  html_url: string
  state: 'open' | 'closed'
  merged_at: string | null
  draft: boolean
  updated_at: string
  head: { ref: string; sha: string }
}
interface GhCombinedStatus { state: 'success' | 'pending' | 'failure' | 'error'; total_count: number }
interface GhDeployment { id: number }
interface GhDeploymentStatus { state: string; environment_url?: string }

let cache: { at: number; data: LivePRResponse } | null = null

async function gh<T>(path: string): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (process.env.GH_PAT) headers.Authorization = `Bearer ${process.env.GH_PAT}`
  const res = await fetch(`${API}${path}`, { headers, cache: 'no-store' })
  if (!res.ok) throw new Error(`GitHub ${res.status} on ${path.split('?')[0]}`)
  return res.json() as Promise<T>
}

async function buildState(sha: string): Promise<BuildState | null> {
  const s = await gh<GhCombinedStatus>(`/repos/${REPO}/commits/${sha}/status`)
  if (s.total_count === 0) return null
  return s.state === 'error' ? 'failure' : s.state
}

async function previewUrl(sha: string): Promise<string | null> {
  const deployments = await gh<GhDeployment[]>(`/repos/${REPO}/deployments?sha=${sha}&per_page=1`)
  if (deployments.length === 0) return null
  const statuses = await gh<GhDeploymentStatus[]>(`/repos/${REPO}/deployments/${deployments[0].id}/statuses?per_page=1`)
  const url = statuses[0]?.environment_url
  return url && url.startsWith('https://') ? url : null
}

async function load(): Promise<LivePRResponse> {
  const raw = await gh<GhPull[]>(`/repos/${REPO}/pulls?state=all&per_page=100&sort=updated&direction=desc`)
  const pulls = await Promise.all(raw.map(async (p): Promise<LivePR> => {
    const state: PRState = p.state === 'open' ? 'open' : p.merged_at ? 'merged' : 'closed'
    let build: BuildState | null = null
    let preview: string | null = null
    if (state === 'open') {
      // A failed lookup here should not hide the PR itself.
      ;[build, preview] = await Promise.all([
        buildState(p.head.sha).catch(() => null),
        previewUrl(p.head.sha).catch(() => null),
      ])
    }
    return {
      number: p.number,
      title: p.title,
      url: p.html_url,
      state,
      draft: p.draft,
      branch: p.head.ref,
      updatedAt: p.updated_at,
      build,
      preview,
    }
  }))
  return { pulls, fetchedAt: new Date().toISOString() }
}

export async function GET(request: Request) {
  const fresh = new URL(request.url).searchParams.get('fresh') === '1'
  if (!fresh && cache && Date.now() - cache.at < CACHE_MS) return NextResponse.json(cache.data)
  try {
    const data = await load()
    cache = { at: Date.now(), data }
    return NextResponse.json(data)
  } catch (e) {
    // Serve the last good result if GitHub is down or rate limited.
    if (cache) return NextResponse.json(cache.data)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'GitHub request failed' }, { status: 502 })
  }
}
