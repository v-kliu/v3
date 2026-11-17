import { JetBrains_Mono } from 'next/font/google'
import './eve.css'

// Eve dev uses one typeface throughout, exposed as --eve-font for eve.css.
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--eve-font',
  display: 'swap',
})

export default function EveLayout({ children }: { children: React.ReactNode }) {
  return <div className={jetbrains.variable} style={{ width: '100%' }}>{children}</div>
}
