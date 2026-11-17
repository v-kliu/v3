import { JetBrains_Mono } from 'next/font/google'
import './dashboard.css'
import './ascend.css'

// One typeface for the whole dashboard, exposed as --jb-mono (see .dashboard-root in dashboard.css).
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--jb-mono',
  display: 'swap',
})

export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  return <div className={jetbrains.variable} style={{ display: 'contents' }}>{children}</div>
}
