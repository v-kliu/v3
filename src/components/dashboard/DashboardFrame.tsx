'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { LazyMotion, MotionConfig, domMax, m } from 'motion/react'
import DashboardSidebar from './DashboardSidebar'
import { themeFor } from './theme'

// Shell for every protected dashboard page. Publishes the current tab's color as
// --tab (animated via @property in dashboard.css) so pages and the page tint can
// share it, and fades each page in on navigation.
export default function DashboardFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const theme = themeFor(pathname)

  // Fade pages in when navigating inside the dashboard, but not on a hard load,
  // where it would leave the page invisible until hydration.
  const hydrated = useRef(false)
  useEffect(() => { hydrated.current = true }, [])

  return (
    <LazyMotion features={domMax}>
      <MotionConfig reducedMotion="user">
        <div
          className="dashboard-root"
          data-wash={theme.wash ? 'on' : 'off'}
          data-eve={pathname.startsWith('/dashboard/eve') ? 'true' : undefined}
          style={{ '--tab': theme.color } as React.CSSProperties}
        >
          <aside className="dashboard-aside">
            <DashboardSidebar />
          </aside>
          <main className="dashboard-main">
            <m.div
              key={pathname}
              className="dashboard-page"
              initial={hydrated.current ? { opacity: 0, y: 8 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {children}
            </m.div>
          </main>
        </div>
      </MotionConfig>
    </LazyMotion>
  )
}
