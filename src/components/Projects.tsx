interface Project {
  id: string
  title: string
  description: string
  github: string
  image: string
}

const projects: Project[] = [
  {
    id: 'soarin',
    title: 'Soarin',
    description: 'Founded Soarin, an EdTech platform that helps students transform their college applications into professional resumes and LinkedIn profiles.',
    github: 'https://github.com/v-kliu/eduresume',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/eduresume-QmOdluSZ6Fo5oUSrQa35dpbs6NzjyM.png',
  },
  {
    id: 'timesync',
    title: 'TimeSync',
    description: 'Led team of 4 to develop a full-stack app syncing personal calendars to highlight shared availability. Integrated Google Calendar API with Firebase handling 7000+ data points.',
    github: 'https://github.com/v-kliu/time-sync',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/timesync-apAgHHPQCNmDFmsVu1n2kyJ4ilxOH4.png',
  },
  {
    id: 'flowai',
    title: 'Flow AI Solver',
    description: 'AI solver for the app Flow using reinforcement learning and path-finding algorithms. Achieved 80% accuracy and 5x speed improvement over humans.',
    github: 'https://github.com/v-kliu/Flow-AI',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/flowai.jpg-SBSE08MBMyo1HnJFkHmzC4alneFl0v.jpeg',
  },
  {
    id: 'ecall',
    title: 'eCall',
    description: "Global emergency assistance platform from DubHacks. Uses T-Mobile location services and Twilio to connect travelers with local emergency services.",
    github: 'https://github.com/v-kliu/eCall',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ecall.jpg-AagulZD67RqzoDQlAXsPfHjxYpqw2g.jpeg',
  },
  {
    id: 'gooseguard',
    title: 'GooseGuard',
    description: 'AI-powered cybersecurity platform from Hack the North detecting scam communications. 340M-parameter BERT model with 96% accuracy.',
    github: 'https://github.com/v-kliu/GooseGuard',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/gooseguard-PUvumnAztpeHsAlRPEdm6rRxqk9xby.png',
  },
  {
    id: 'considerthis',
    title: 'ConsiderThis AI',
    description: 'Educational tool for empathetic discussions using emotionally aware AI agents. Design partnership with Hume AI.',
    github: 'https://github.com/v-kliu/consider-this',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/considerthis.jpg-vraFJeGqOwO8kHfOtxz6UOMTx8hC4J.jpeg',
  },
]

function ProjectCard({ project }: { project: Project }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <img
        src={project.image}
        alt={project.title}
        style={{
          width: '100%',
          height: '130px',
          objectFit: 'cover',
          display: 'block',
          borderRadius: '3px',
          border: '1px solid var(--border)',
          marginBottom: '0.55rem',
        }}
        onError={(e) => { e.currentTarget.style.display = 'none' }}
      />
      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.3rem', marginTop: 0, color: 'var(--text)' }}>
        <a href={project.github} target="_blank" rel="noopener noreferrer">
          {project.title}
        </a>
      </h3>
      <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text-muted)', marginTop: 0, marginBottom: 0, flex: 1 }}>
        {project.description}
      </p>
    </div>
  )
}

export default function Projects() {
  return (
    <section
      id="projects"
      className="section-target"
      style={{ padding: '1.5rem 4rem 1.5rem 5rem' }}
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

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1.5rem 2rem',
          maxWidth: '860px',
        }}
      >
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  )
}
