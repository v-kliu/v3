import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import Sidebar from './components/Sidebar'
import Hero from './components/Hero'
import About from './components/About'
import Experience from './components/Experience'
import Projects from './components/Projects'
import Contact from './components/Contact'

const SECTIONS = ['about', 'experience', 'projects', 'contact'] as const
type SectionId = (typeof SECTIONS)[number]

export default function App() {
  const [activeSection, setActiveSection] = useState<SectionId>('about')
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleNavClick = (section: string) => {
    const el = document.getElementById(section)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    setMobileOpen(false)
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id as SectionId
            if (SECTIONS.includes(id)) {
              setActiveSection(id)
            }
          }
        })
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
    )

    SECTIONS.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Mobile header */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-4 border-b"
        style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
        aria-label="Mobile header"
      >
        <span style={{ fontWeight: 700, color: 'var(--text)' }}>Victor Liu</span>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={mobileOpen}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '10px',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '44px',
            minHeight: '44px',
          }}
        >
          <Menu size={22} />
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          style={{ background: 'var(--bg)' }}
          aria-label="Mobile navigation"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex justify-end p-4">
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '10px',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '44px',
                minHeight: '44px',
              }}
            >
              <X size={22} />
            </button>
          </div>
          <Sidebar activeSection={activeSection} onNavClick={handleNavClick} />
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:block fixed left-0 top-0 h-screen w-[25%] overflow-y-auto border-r paper-crease"
        style={{ borderColor: 'var(--border)' }}
        aria-label="Site sidebar"
      >
        <Sidebar activeSection={activeSection} onNavClick={handleNavClick} />
      </aside>

      {/* Main content */}
      <main className="lg:ml-[25%]">
        <div className="lg:hidden h-16" aria-hidden="true" />
        <Hero />
        <About />
        <Experience />
        <Projects />
        <Contact />
      </main>
    </div>
  )
}
