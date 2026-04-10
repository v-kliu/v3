export default function Contact() {
  return (
    <section
      id="contact"
      className="section-target"
      style={{ padding: '5rem 4rem 6rem 5rem' }}
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
        Contact
      </h2>

      <p
        style={{
          fontSize: '1rem',
          lineHeight: 1.7,
          color: 'var(--text-muted)',
          maxWidth: '520px',
          marginTop: 0,
          marginBottom: '2rem',
        }}
      >
        I'm always open to new opportunities, collaborations, or just a good conversation about
        tech and ideas. Reach out — I respond to every message.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <p style={{ margin: 0, fontSize: '1rem', color: 'var(--text-muted)' }}>
          Get in touch:
        </p>
        <p style={{ margin: 0 }}>
          <a href="mailto:vkliu@uw.edu">vkliu@uw.edu</a>
        </p>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>
          GitHub:{' '}
          <a
            href="https://github.com/v-kliu"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/v-kliu
          </a>
        </p>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>
          LinkedIn:{' '}
          <a
            href="https://www.linkedin.com/in/vkliu/"
            target="_blank"
            rel="noopener noreferrer"
          >
            linkedin.com/in/vkliu
          </a>
        </p>
      </div>
    </section>
  )
}
