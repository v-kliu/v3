import type { Metadata } from 'next'
import { Syne, DM_Serif_Display, DM_Mono, Inter } from 'next/font/google'
import './globals.css'

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-syne',
  display: 'swap',
  preload: false,
})

const dmSerifDisplay = DM_Serif_Display({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-dm-serif',
  display: 'swap',
  preload: false,
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
  preload: false,
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
  preload: false,
})

export const metadata: Metadata = {
  title: 'Victor Liu',
  description: 'Victor Liu — CS @ University of Washington. Student, founder, and software engineer.',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${dmSerifDisplay.variable} ${dmMono.variable} ${inter.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
