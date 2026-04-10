import React from 'react'

const monoStyle: React.CSSProperties = {
  fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace',
}

interface ExperienceEntry {
  id: string
  period: string
  role: string
  organization: string
  location: string
  description: string
  logo: string
}

interface HackathonEntry {
  id: string
  period: string
  name: string
  organization: string
  location: string
  description: string
  logo: string
}

const jobEntries: ExperienceEntry[] = [
  {
    id: 'google',
    period: 'May 2025 - Aug 2025',
    role: 'Incoming SWE',
    organization: 'Google',
    location: 'Mountain View, CA',
    description: 'Incoming Software Engineering Intern at Google, contributing to the development of scalable systems.',
    logo: '/images/google.png',
  },
  {
    id: 'aws',
    period: 'May 2025 - Aug 2025',
    role: 'Incoming SDE Intern',
    organization: 'AWS',
    location: 'Seattle, WA',
    description: 'Incoming Software Development Engineer Intern at Amazon Web Services, joining the Identity and Access Management team. Contributing to secure, scalable systems that manage user access across AWS environments.',
    logo: '/images/AWS.jpg',
  },
  {
    id: 'unr',
    period: 'Feb 2023 - Sep 2023',
    role: 'Machine Learning Intern',
    organization: 'UNR',
    location: 'Reno, NV',
    description: 'Collaborated with a professor to develop a program applying machine learning to solve puzzles from the Flow app. Focused on reinforcement learning techniques and pathfinding algorithms. Built in Python using PyGame.',
    logo: '/images/unr_logo.jpg',
  },
]

const hackathonEntries: HackathonEntry[] = [
  {
    id: 'dubhacks',
    period: 'Oct 2024',
    name: 'DubHacks',
    organization: 'University of Washington',
    location: 'Seattle, WA',
    description: "eCall is a global emergency assistance platform built at DubHacks to help travelers quickly reach local emergency services. Uses T-Mobile's location services and Twilio to auto-dial the correct emergency number, integrating Google Cloud and Hugging Face APIs for real-time translation.",
    logo: '/images/dubhacks.png',
  },
  {
    id: 'hackthenorth',
    period: 'Sep 2024',
    name: 'Hack The North',
    organization: 'University of Waterloo',
    location: 'Waterloo, Canada',
    description: "GooseGuard is an AI-powered cybersecurity platform to detect scam emails, texts, and calls. Used a 340M-parameter fine-tuned BERT model and Groq's LLM acceleration for real-time threat detection.",
    logo: '/images/hackthenorth_logo.png',
  },
  {
    id: 'berkeleyhacks',
    period: 'Jun 2024',
    name: 'Berkeley AI Hackathon',
    organization: 'UC Berkeley',
    location: 'Berkeley, CA',
    description: "Consider This is a platform designed to foster open-minded, empathetic discussions using emotionally aware AI agents powered by Hume's EVI. Built with TypeScript, Next.js, and Tailwind CSS.",
    logo: '/images/cal_hacks_logo.jpg',
  },
]

const logoWrapStyle: React.CSSProperties = {
  width: '36px',
  height: '36px',
  flexShrink: 0,
  borderRadius: '6px',
  border: '1px solid var(--border)',
  background: '#fff',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: '3px',
  padding: '3px',
}

export default function Experience() {
  return (
    <section
      id="experience"
      className="section-target"
      style={{ padding: '3rem 4rem 3rem 5rem' }}
    >
      <h2
        style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          marginBottom: '1.5rem',
          marginTop: 0,
          color: 'var(--text)',
          lineHeight: 1.2,
        }}
      >
        Experience
      </h2>

      <div>
        {jobEntries.map((entry) => (
          <article
            key={entry.id}
            style={{ marginBottom: '2rem', display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}
            aria-label={`${entry.role} at ${entry.organization}`}
          >
            <div style={logoWrapStyle}>
              <img
                src={entry.logo}
                alt=""
                aria-hidden="true"
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                onError={(e) => {
                  const parent = e.currentTarget.parentElement
                  if (parent) parent.style.display = 'none'
                }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <h3
                style={{
                  fontSize: '1.0rem',
                  fontWeight: 600,
                  marginBottom: '0.15rem',
                  marginTop: 0,
                  lineHeight: 1.3,
                  color: 'var(--text)',
                }}
              >
                {entry.role}
                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> at </span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{entry.organization}</span>
              </h3>

              <p
                style={{
                  ...monoStyle,
                  fontSize: '0.75rem',
                  color: 'var(--text-faint)',
                  marginBottom: '0.4rem',
                  marginTop: 0,
                }}
              >
                {entry.period} | {entry.location}
              </p>

              <p
                style={{
                  fontSize: '0.9rem',
                  lineHeight: 1.65,
                  color: 'var(--text-muted)',
                  maxWidth: '520px',
                  marginTop: 0,
                  marginBottom: 0,
                }}
              >
                {entry.description}
              </p>
            </div>
          </article>
        ))}
      </div>

      {/* Hackathons subsection */}
      <h3
        style={{
          fontSize: '1.1rem',
          fontWeight: 600,
          letterSpacing: '-0.01em',
          marginBottom: '1.25rem',
          marginTop: '2rem',
          color: 'var(--text)',
          lineHeight: 1.2,
        }}
      >
        Hackathons
      </h3>

      <div>
        {hackathonEntries.map((entry) => (
          <article
            key={entry.id}
            style={{ marginBottom: '2rem', display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}
            aria-label={`${entry.name} at ${entry.organization}`}
          >
            <div style={logoWrapStyle}>
              <img
                src={entry.logo}
                alt=""
                aria-hidden="true"
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                onError={(e) => {
                  const parent = e.currentTarget.parentElement
                  if (parent) parent.style.display = 'none'
                }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <h4
                style={{
                  fontSize: '1.0rem',
                  fontWeight: 600,
                  marginBottom: '0.15rem',
                  marginTop: 0,
                  lineHeight: 1.3,
                  color: 'var(--text)',
                }}
              >
                {entry.name}
                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> · </span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{entry.organization}</span>
              </h4>

              <p
                style={{
                  ...monoStyle,
                  fontSize: '0.75rem',
                  color: 'var(--text-faint)',
                  marginBottom: '0.4rem',
                  marginTop: 0,
                }}
              >
                {entry.period} | {entry.location}
              </p>

              <p
                style={{
                  fontSize: '0.9rem',
                  lineHeight: 1.65,
                  color: 'var(--text-muted)',
                  maxWidth: '520px',
                  marginTop: 0,
                  marginBottom: 0,
                }}
              >
                {entry.description}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
