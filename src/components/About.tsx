export default function About() {
  return (
    <section
      id="about"
      className="section-target section-pad"
    >
      <h2
        style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          marginBottom: '2rem',
          marginTop: 0,
          color: 'var(--text)',
          lineHeight: 1.2,
        }}
      >
        About
      </h2>

      <p
        style={{
          fontSize: '1rem',
          lineHeight: 1.7,
          color: 'var(--text-muted)',
          maxWidth: '560px',
          marginTop: 0,
          marginBottom: '1.25rem',
        }}
      >
        I was born and raised in Reno, NV, where I became fascinated with tech through the flashy
        slot machines my parents programmed for work. I moved to
        Seattle to study Computer Science and Business at the University of Washington, and
        post-grad I'm an incoming Software Engineer at Google.
      </p>

      <p
        style={{
          fontSize: '1rem',
          lineHeight: 1.7,
          color: 'var(--text-muted)',
          maxWidth: '560px',
          marginTop: 0,
          marginBottom: 0,
        }}
      >
        I like to push myself to grow by seeking discomfort in new environments and taking on new challenges. 
        I am currently side questing and building Soarin, an EdTech platform
        that helps students turn their college applications into professional resumes.
      </p>
    </section>
  )
}
