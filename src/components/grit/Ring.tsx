import type { Habit } from './store'

type Props = {
  size: number
  stroke: number
  habits: Habit[]      // habits active that day, in display order
  done: Set<string>
  track?: string
  delay?: number       // ms, for staggered fill on mount
  children?: React.ReactNode
}

// Segmented progress ring: one arc per habit, completed ones packed from 12
// o'clock clockwise in their own color. Animated with plain CSS transitions on
// stroke-dasharray/offset so it stays cheap on phones.
export default function Ring({ size, stroke, habits, done, track = 'rgba(90,70,40,0.12)', delay = 0, children }: Props) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const n = habits.length
  const gap = n > 1 ? Math.min(stroke * 0.9, c / n / 3) : 0
  const seg = n ? c / n : 0
  const completed = habits.filter(h => done.has(h.id))
  const pending = habits.filter(h => !done.has(h.id))
  const ordered = [...completed, ...pending]

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        {ordered.map((h, i) => {
          const len = done.has(h.id) ? Math.max(seg - gap, 0) : 0
          return (
            <circle
              key={h.id}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={h.color}
              strokeWidth={stroke}
              strokeDasharray={`${len} ${c}`}
              strokeDashoffset={-(i * seg + gap / 2)}
              style={{
                transition: 'stroke-dasharray 520ms cubic-bezier(.2,.8,.2,1), stroke-dashoffset 520ms cubic-bezier(.2,.8,.2,1)',
                transitionDelay: `${delay}ms`,
              }}
            />
          )
        })}
      </svg>
      <div className="relative">{children}</div>
    </div>
  )
}
