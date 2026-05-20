import DashboardSidebar from '@/components/dashboard/DashboardSidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <aside style={{ width: '200px', flexShrink: 0, position: 'sticky', top: 0, height: '100vh' }}>
        <DashboardSidebar />
      </aside>
      <main style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
