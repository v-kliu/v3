import './eve.css'

// Font comes from the dashboard layout (--jb-mono); colors from [data-eve] in dashboard.css.
export default function EveLayout({ children }: { children: React.ReactNode }) {
  return <div style={{ width: '100%' }}>{children}</div>
}
