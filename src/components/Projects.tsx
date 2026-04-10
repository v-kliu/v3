import { useState } from 'react'

const monoStyle: React.CSSProperties = {
  fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace',
}

import React from 'react'

interface Project {
  id: string
  title: string
  description: string
  tags: string[]
  github: string
  image?: string
}

const mainProjects: Project[] = [
  {
    id: 'soarin',
    title: 'Soarin',
    description: 'Founded Soarin, an EdTech platform that helps students transform their college applications into professional resumes and LinkedIn profiles.',
    tags: ['TypeScript', 'Next.js', 'Firebase', 'Tailwind CSS'],
    github: 'https://github.com/v-kliu/eduresume',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/eduresume-QmOdluSZ6Fo5oUSrQa35dpbs6NzjyM.png',
  },
  {
    id: 'timesync',
    title: 'TimeSync',
    description: 'Led team of 4 to develop a ReactJS full-stack app, syncing personal calendars to highlight shared availability. Integrated Google Calendar API with Firebase handling 7000+ data points.',
    tags: ['TypeScript', 'ReactJS', 'Google Calendar API', 'Firebase'],
    github: 'https://github.com/v-kliu/time-sync',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/timesync-apAgHHPQCNmDFmsVu1n2kyJ4ilxOH4.png',
  },
  {
    id: 'flowai',
    title: 'Flow AI Solver',
    description: 'Developed an AI solver for the app Flow, utilizing reinforcement learning and path-finding algorithms. Achieved 80% accuracy and 5x speed improvement over humans.',
    tags: ['Python', 'PyTorch', 'Q-learning', 'Path-finding'],
    github: 'https://github.com/v-kliu/Flow-AI',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/flowai.jpg-SBSE08MBMyo1HnJFkHmzC4alneFl0v.jpeg',
  },
  {
    id: 'ecall',
    title: 'eCall',
    description: "Built a global emergency assistance platform at DubHacks to help travelers quickly reach local emergency services. Used T-Mobile's location services, Twilio, and real-time translation via Google Cloud.",
    tags: ['Next.js', 'Google Cloud', 'Amazon Bedrock', 'Twilio'],
    github: 'https://github.com/v-kliu/eCall',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ecall.jpg-AagulZD67RqzoDQlAXsPfHjxYpqw2g.jpeg',
  },
  {
    id: 'gooseguard',
    title: 'GooseGuard',
    description: 'AI-powered cybersecurity platform from Hack the North to detect scam communications. Leveraged a 340M-parameter BERT model, achieving 96% accuracy.',
    tags: ['TypeScript', 'Next.js', 'Convex', 'Groq'],
    github: 'https://github.com/v-kliu/GooseGuard',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/gooseguard-PUvumnAztpeHsAlRPEdm6rRxqk9xby.png',
  },
  {
    id: 'considerthis',
    title: 'ConsiderThis AI',
    description: 'Educational tool to foster empathetic discussions using emotionally aware AI agents. Obtained a design partnership with Hume AI after the hackathon.',
    tags: ['TypeScript', 'Next.js', 'Hume API', 'Tailwind CSS'],
    github: 'https://github.com/v-kliu/consider-this',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/considerthis.jpg-vraFJeGqOwO8kHfOtxz6UOMTx8hC4J.jpeg',
  },
]

const additionalProjects: Project[] = [
  {
    id: 'studyspark',
    title: 'StudySpark Flashcards',
    description: 'Full-stack web app for optimized learning with flashcards. JUnit testing and RESTful APIs for front/back sync.',
    tags: ['TypeScript', 'ReactJS', 'JUnit', 'RESTful APIs'],
    github: 'https://github.com/v-kliu/StudySpark-Flashcards',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/studyspark.jpg-06u5gmcPYx28ZMT49XZJv4RKqRNLDF.jpeg',
  },
  {
    id: 'timewrapped',
    title: 'TimeWrapped',
    description: 'iOS mobile app that tracks daily time usage across 9 categories and summarizes trends. React Native front-end, DynamoDB backend.',
    tags: ['TypeScript', 'React Native', 'AWS DynamoDB', 'Expo Go'],
    github: 'https://github.com/v-kliu/timewrapped',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/timewrapped.jpg-HvDbIz0rGTPrCWWGnQubrcSEESpCLE.jpeg',
  },
]

function ProjectCard({ project }: { project: Project }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {project.image && (
        <img
          src={project.image}
          alt={project.title}
          style={{
            width: '100%',
            height: '140px',
            objectFit: 'cover',
            display: 'block',
            borderRadius: '4px',
            border: '1px solid var(--border)',
            marginBottom: '0.55rem',
          }}
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />
      )}
      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.3rem', marginTop: 0 }}>
        <a href={project.github} target="_blank" rel="noopener noreferrer">
          {project.title}
        </a>
      </h3>
      <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text-muted)', marginTop: 0, marginBottom: '0.35rem', flex: 1 }}>
        {project.description}
      </p>
      <p style={{ ...monoStyle, fontSize: '0.72rem', color: 'var(--text-faint)', marginTop: 0, marginBottom: 0 }}>
        {project.tags.join(', ')}
      </p>
    </div>
  )
}

export default function Projects() {
  const [showMore, setShowMore] = useState(false)

  return (
    <section
      id="projects"
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
        Projects
      </h2>

      {/* 2x3 grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '2rem 2.5rem',
          maxWidth: '680px',
          marginBottom: '1.5rem',
        }}
      >
        {mainProjects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      {/* Toggle */}
      <button
        onClick={() => setShowMore((v) => !v)}
        aria-expanded={showMore}
        aria-controls="more-projects"
        style={{
          color: 'var(--accent)',
          fontSize: '0.85rem',
          cursor: 'pointer',
          background: 'none',
          border: 'none',
          padding: 0,
          minHeight: '36px',
          fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace',
          marginBottom: '1rem',
          display: 'block',
        }}
      >
        {showMore ? 'show fewer' : `show ${additionalProjects.length} more`}
      </button>

      {showMore && (
        <div
          id="more-projects"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '2rem 2.5rem',
            maxWidth: '680px',
          }}
        >
          {additionalProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </section>
  )
}
