import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Hero from './components/Hero'
import About from './components/About'
import Experience from './components/Experience'
import Education from './components/Education'
import Projects from './components/Projects'
import Contact from './components/Contact'
import StatsForNerds from './components/StatsForNerds'
import SnakeGame from './components/SnakeGame'

const SECTIONS = ['about', 'experience', 'education', 'projects', 'contact'] as const
type SectionId = (typeof SECTIONS)[number]

export default function App() {
  const [activeSection, setActiveSection] = useState<SectionId>('about')

  const handleNavClick = (section: string) => {
    const el = document.getElementById(section)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id as SectionId
            if (SECTIONS.includes(id)) setActiveSection(id)
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

  return (
    <>
      <SnakeGame />

      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
        {/* Sidebar — always visible */}
        <aside
          className="hidden lg:block fixed left-0 top-0 h-screen w-[25%] overflow-y-auto border-r paper-crease"
          style={{ borderColor: 'var(--border)' }}
          aria-label="Site sidebar"
        >
          <Sidebar activeSection={activeSection} onNavClick={handleNavClick} />
        </aside>

        {/* Main content */}
        <main className="lg:ml-[25%]">
          <Hero />
          <About />
          <Experience />
          <Education />
          <Projects />
          <Contact />
          <StatsForNerds />
        </main>
      </div>
    </>
  )
}
