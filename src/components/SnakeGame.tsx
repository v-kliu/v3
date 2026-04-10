import { useEffect, useRef, useState } from 'react'

const CELL = 24
const SPEED = 140

type Dir = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
type XY = { x: number; y: number }

const OPPOSITE: Record<Dir, Dir> = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' }

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function spawnFood(cols: number, rows: number, avoid: XY[]): XY {
  let pos: XY
  do {
    pos = { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) }
  } while (avoid.some(a => a.x === pos.x && a.y === pos.y))
  return pos
}

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [active, setActive] = useState(false)
  const [dead, setDead] = useState(false)

  // All live game state in refs to avoid stale closures in intervals
  const snake = useRef<XY[]>([])
  const dir = useRef<Dir>('RIGHT')
  const nextDir = useRef<Dir>('RIGHT')
  const food = useRef<XY>({ x: 0, y: 0 })
  const cols = useRef(0)
  const rows = useRef(0)
  const scoreVal = useRef(0)
  const hiVal = useRef(0)
  const isDead = useRef(false)
  const loopRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const saved = parseInt(localStorage.getItem('vh-snake') || '0', 10)
    hiVal.current = saved
    setHighScore(saved)
  }, [])

  // Delay spawn by 5 seconds
  useEffect(() => {
    const t = setTimeout(() => setActive(true), 5000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      cols.current = Math.floor(canvas.width / CELL)
      rows.current = Math.floor(canvas.height / CELL)
    }
    resize()
    window.addEventListener('resize', resize)

    const init = () => {
      const cx = Math.floor(cols.current / 2)
      const cy = Math.floor(rows.current / 2)
      snake.current = [{ x: cx, y: cy }, { x: cx - 1, y: cy }, { x: cx - 2, y: cy }]
      dir.current = 'RIGHT'
      nextDir.current = 'RIGHT'
      scoreVal.current = 0
      isDead.current = false
      setScore(0)
      setDead(false)
      food.current = spawnFood(cols.current, rows.current, snake.current)
    }

    const draw = () => {
      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)

      // Subtle grid
      ctx.strokeStyle = 'rgba(160, 138, 95, 0.1)'
      ctx.lineWidth = 0.5
      for (let x = 0; x <= cols.current; x++) {
        ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, h); ctx.stroke()
      }
      for (let y = 0; y <= rows.current; y++) {
        ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(w, y * CELL); ctx.stroke()
      }

      // Apple body
      const f = food.current
      const fx = f.x * CELL + CELL / 2
      const fy = f.y * CELL + CELL / 2
      ctx.fillStyle = '#d93030'
      ctx.beginPath()
      ctx.arc(fx, fy + 1, CELL / 2 - 3, 0, Math.PI * 2)
      ctx.fill()
      // Apple leaf
      ctx.fillStyle = '#2e7d20'
      ctx.beginPath()
      ctx.ellipse(fx + 3, fy - CELL / 2 + 5, 4, 2, -0.5, 0, Math.PI * 2)
      ctx.fill()
      // Apple stem
      ctx.strokeStyle = '#2e7d20'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(fx, fy - CELL / 2 + 6)
      ctx.lineTo(fx, fy - CELL / 2 + 2)
      ctx.stroke()

      // Snake segments
      snake.current.forEach((seg, i) => {
        const isHead = i === 0
        if (isDead.current) {
          ctx.fillStyle = isHead ? '#cc2222' : '#e05555'
        } else {
          ctx.fillStyle = isHead ? '#16a34a' : '#4ade80'
        }
        const pad = isHead ? 1 : 2
        rr(ctx, seg.x * CELL + pad, seg.y * CELL + pad, CELL - pad * 2, CELL - pad * 2, isHead ? 5 : 3)
        ctx.fill()

        // Eyes on head
        if (isHead) {
          ctx.fillStyle = '#fff'
          const d = dir.current
          const ex = d === 'LEFT' ? seg.x * CELL + 4 : d === 'RIGHT' ? seg.x * CELL + CELL - 8 : seg.x * CELL + 5
          const ey = d === 'UP' ? seg.y * CELL + 4 : d === 'DOWN' ? seg.y * CELL + CELL - 8 : seg.y * CELL + 5
          const ex2 = d === 'LEFT' ? seg.x * CELL + 4 : d === 'RIGHT' ? seg.x * CELL + CELL - 8 : seg.x * CELL + CELL - 9
          const ey2 = d === 'UP' ? seg.y * CELL + 4 : d === 'DOWN' ? seg.y * CELL + CELL - 8 : seg.y * CELL + CELL - 9
          ctx.beginPath(); ctx.arc(ex, ey, 2.5, 0, Math.PI * 2); ctx.fill()
          ctx.beginPath(); ctx.arc(ex2, ey2, 2.5, 0, Math.PI * 2); ctx.fill()
          ctx.fillStyle = '#111'
          ctx.beginPath(); ctx.arc(ex + (d === 'RIGHT' ? 1 : d === 'LEFT' ? -1 : 0), ey + (d === 'DOWN' ? 1 : d === 'UP' ? -1 : 0), 1.2, 0, Math.PI * 2); ctx.fill()
          ctx.beginPath(); ctx.arc(ex2 + (d === 'RIGHT' ? 1 : d === 'LEFT' ? -1 : 0), ey2 + (d === 'DOWN' ? 1 : d === 'UP' ? -1 : 0), 1.2, 0, Math.PI * 2); ctx.fill()
        }
      })
    }

    const tick = () => {
      if (isDead.current) return
      dir.current = nextDir.current
      const head = snake.current[0]
      const nh: XY = { x: head.x, y: head.y }
      if (dir.current === 'UP') nh.y--
      else if (dir.current === 'DOWN') nh.y++
      else if (dir.current === 'LEFT') nh.x--
      else nh.x++

      const hitWall = nh.x < 0 || nh.x >= cols.current || nh.y < 0 || nh.y >= rows.current
      const hitSelf = snake.current.some(s => s.x === nh.x && s.y === nh.y)

      if (hitWall || hitSelf) {
        isDead.current = true
        setDead(true)
        draw()
        setTimeout(() => { init(); draw() }, 1800)
        return
      }

      const ate = nh.x === food.current.x && nh.y === food.current.y
      snake.current = ate
        ? [nh, ...snake.current]
        : [nh, ...snake.current.slice(0, -1)]

      if (ate) {
        scoreVal.current++
        setScore(scoreVal.current)
        if (scoreVal.current > hiVal.current) {
          hiVal.current = scoreVal.current
          setHighScore(scoreVal.current)
          localStorage.setItem('vh-snake', String(hiVal.current))
        }
        food.current = spawnFood(cols.current, rows.current, snake.current)
      }

      draw()
    }

    const onKey = (e: KeyboardEvent) => {
      const map: Partial<Record<string, Dir>> = {
        ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT',
        w: 'UP', s: 'DOWN', a: 'LEFT', d: 'RIGHT',
      }
      const d = map[e.key]
      if (!d) return
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault()
      if (d !== OPPOSITE[dir.current]) nextDir.current = d
    }

    document.addEventListener('keydown', onKey)
    init()
    draw()
    loopRef.current = setInterval(tick, SPEED)

    return () => {
      if (loopRef.current) clearInterval(loopRef.current)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', resize)
    }
  }, [active])

  if (!active) return null

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: '1.25rem',
          right: '1.25rem',
          zIndex: 10,
          fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace',
          fontSize: '0.7rem',
          color: 'var(--text-faint)',
          textAlign: 'right',
          lineHeight: 1.7,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {dead && (
          <div style={{ color: 'var(--accent)', marginBottom: '0.1rem', fontWeight: 600 }}>
            game over
          </div>
        )}
        <div>score  {score}</div>
        <div>best   {highScore}</div>
      </div>
    </>
  )
}
