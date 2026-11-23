import './eve.css'

// Font comes from the dashboard layout (--jb-mono); colors from [data-eve] in dashboard.css.
// .dashboard-page centers .eve (max-width 1180px), so no wrapper here.
export default function EveLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
