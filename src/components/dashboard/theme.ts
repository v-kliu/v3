import { PALETTE } from '@/components/grit/store'

// One color per dashboard tab, borrowed from the grit palette so the whole
// dashboard reads as one family. Sidebar, page tint and page accents all use it.
export type TabTheme = { color: string; wash: boolean }

const THEMES: Record<string, TabTheme> = {
  '/dashboard': { color: PALETTE[4], wash: true },          // flight — cobalt
  '/dashboard/journal': { color: PALETTE[6], wash: true },  // journal — rose
  '/dashboard/todo': { color: PALETTE[3], wash: true },     // todo — teal
  '/dashboard/ascend': { color: PALETTE[1], wash: true },   // 向上 — marigold
  '/dashboard/grit': { color: PALETTE[0], wash: false },    // grit — vermilion; page has its own look
}

export const TAB_COLORS = {
  flight: THEMES['/dashboard'].color,
  journal: THEMES['/dashboard/journal'].color,
  todo: THEMES['/dashboard/todo'].color,
  ascend: THEMES['/dashboard/ascend'].color,
  grit: THEMES['/dashboard/grit'].color,
}

export function themeFor(pathname: string): TabTheme {
  return THEMES[pathname] ?? THEMES['/dashboard']
}

// Stable per-item color (tracks, todo tabs) so it survives reordering/deleting.
export function colorForId(id: number): string {
  return PALETTE[Math.abs(id) % PALETTE.length]
}

// Darker version of a color, for text that has to stay readable on paper.
export function inkOf(color: string): string {
  return `color-mix(in srgb, ${color} 68%, #000)`
}

export function tint(color: string, pct: number): string {
  return `color-mix(in srgb, ${color} ${pct}%, transparent)`
}
