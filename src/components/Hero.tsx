export default function Hero() {
  return (
    <section
      aria-label="Introduction"
      className="px-6 pt-10 pb-6 lg:pl-[5rem] lg:pr-[4rem] lg:pt-14 lg:pb-8"
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
        {/* Text block */}
        <div style={{ flex: 1 }}>
          <h1
            style={{
              fontSize: 'clamp(2.5rem, 6vw, 4rem)',
              fontWeight: 700,
              color: 'var(--text)',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              margin: '0 0 1rem 0',
            }}
          >
            hi, i'm victor! :))
          </h1>
          <p
            style={{
              fontSize: 'clamp(1.05rem, 2.5vw, 1.25rem)',
              fontWeight: 400,
              color: 'var(--text-muted)',
              lineHeight: 1.5,
              marginBottom: '0.35rem',
              marginTop: 0,
            }}
          >
            i build things that matter.
          </p>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-faint)', lineHeight: 1.5, marginBottom: '0.2rem', marginTop: 0 }}>
            cs + entrepreneurship @ uw. incoming swe @ google.
          </p>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-faint)', lineHeight: 1.5, marginTop: 0, marginBottom: 0 }}>
            born in nevada. based in seattle.
          </p>
        </div>

        {/* Square profile photo */}
        <img
          src="/images/profile.jpg"
          alt="Victor Liu"
          style={{
            width: 'clamp(100px, 10vw, 140px)',
            height: 'clamp(100px, 10vw, 140px)',
            objectFit: 'cover',
            flexShrink: 0,
            borderRadius: '4px',
            border: '1px solid var(--border)',
          }}
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />
      </div>
    </section>
  )
}
