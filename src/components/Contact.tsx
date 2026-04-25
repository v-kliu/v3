export default function Contact() {
  return (
    <section
      id="contact"
      className="section-target section-pad"
    >
      <h2
        style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          marginBottom: '1.25rem',
          marginTop: 0,
          color: 'var(--text)',
          lineHeight: 1.2, 
        }}
      >
        Contact
      </h2>

      <p style={{ margin: 0, fontSize: '1rem', color: 'var(--text-muted)' }}>
        always happy to chat if you reach out :)
      </p>
      <p style={{ margin: '0 0 0.3rem 0', fontSize: '1rem' }}>
        <a href="mailto:vkaihongliu@gmail.com">vkaihongliu@gmail.com</a>
      </p>
    </section>
  )
}
