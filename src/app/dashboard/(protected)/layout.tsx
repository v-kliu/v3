import DashboardSidebar from '@/components/dashboard/DashboardSidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dashboard-root">
      <aside className="dashboard-aside">
        <DashboardSidebar />
      </aside>
      <main className="dashboard-main">
        {children}
      </main>
    </div>
  )
}
