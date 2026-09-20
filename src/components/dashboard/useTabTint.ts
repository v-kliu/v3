'use client'

import { useEffect } from 'react'

// Re-tints the dashboard shell (its animated --tab color) from inside a page, so
// a page can follow its own selection (active todo tab, active ascend track).
// The shell resets --tab itself when the route changes.
export function useTabTint(color: string | null) {
  useEffect(() => {
    if (!color) return
    document.querySelector<HTMLElement>('.dashboard-root')?.style.setProperty('--tab', color)
  }, [color])
}
