import { useEffect, useRef, useState } from 'react'

const CELL = 20
const TICK = 190  // ms between grid steps

type Dir = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
type XY = { x: number; y: number }
const OPP: Record<Dir, Dir> = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' }

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

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

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [active, setActive] = useState(false)
  const [dead, setDead] = useState(false)

  const snake    = useRef<XY[]>([])
  const prevSnake = useRef<XY[]>([])
  const dir      = useRef<Dir>('RIGHT')
  const nextDir  = useRef<Dir>('RIGHT')
  const food     = useRef<XY>({ x: 0, y: 0 })
  const cols     = useRef(0)
  const rows     = useRef(0)
  const scoreVal = useRef(0)
  const hiVal    = useRef(0)
  const isDead   = useRef(false)
  const lastTick = useRef(0)
  const rafId    = useRef(0)

  useEffect(() => {
    const n = parseInt(localStorage.getItem('vh-snake') || '0', 10)
    hiVal.current = n
    setHighScore(n)
  }, [])

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

    const spawnFood = () => {
      let p: XY
      do { p = { x: Math.floor(Math.random() * cols.current), y: Math.floor(Math.random() * rows.current) } }
      while (snake.current.some(s => s.x === p.x && s.y === p.y))
      food.current = p
    }

    const init = () => {
      const cx = Math.floor(cols.current / 2)
      const cy = Math.floor(rows.current / 2)
      snake.current = [{ x: cx, y: cy }, { x: cx - 1, y: cy }, { x: cx - 2, y: cy }]
      prevSnake.current = snake.current.map(s => ({ ...s }))
      dir.current = 'RIGHT'
      nextDir.current = 'RIGHT'
      scoreVal.current = 0
      isDead.current = false
      setScore(0)
      setDead(false)
      spawnFood()
    }

    const step = () => {
      if (isDead.current) return
      prevSnake.current = snake.current.map(s => ({ ...s }))
      dir.current = nextDir.current
      const h = snake.current[0]

      // Wrap-around edges — no wall death
      let nx = h.x, ny = h.y
      if (dir.current === 'UP')    ny = (ny - 1 + rows.current) % rows.current
      if (dir.current === 'DOWN')  ny = (ny + 1) % rows.current
      if (dir.current === 'LEFT')  nx = (nx - 1 + cols.current) % cols.current
      if (dir.current === 'RIGHT') nx = (nx + 1) % cols.current

      const nh = { x: nx, y: ny }

      // Only death: hit own body
      if (snake.current.some(s => s.x === nh.x && s.y === nh.y)) {
        isDead.current = true
        setDead(true)
        setTimeout(() => { init() }, 1600)
        return
      }

      const ate = nh.x === food.current.x && nh.y === food.current.y
      snake.current = ate ? [nh, ...snake.current] : [nh, ...snake.current.slice(0, -1)]

      if (ate) {
        scoreVal.current++
        setScore(scoreVal.current)
        if (scoreVal.current > hiVal.current) {
          hiVal.current = scoreVal.current
          setHighScore(scoreVal.current)
          localStorage.setItem('vh-snake', String(hiVal.current))
        }
        spawnFood()
      }
    }

    const draw = (t: number) => {
      const w = canvas.width, h = canvas.height
      ctx.clearRect(0, 0, w, h)

      // Faint grid
      ctx.strokeStyle = 'rgba(155, 132, 88, 0.08)'
      ctx.lineWidth = 0.5
      for (let x = 0; x <= cols.current; x++) {
        ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, h); ctx.stroke()
      }
      for (let y = 0; y <= rows.current; y++) {
        ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(w, y * CELL); ctx.stroke()
      }

      // Apple
      const f = food.current
      const fx = (f.x + 0.5) * CELL, fy = (f.y + 0.5) * CELL
      ctx.fillStyle = 'rgba(195, 38, 38, 0.35)'
      ctx.beginPath(); ctx.arc(fx, fy + 1, CELL / 2 - 3, 0, Math.PI * 2); ctx.fill()
      ctx.strokeStyle = 'rgba(38, 115, 20, 0.38)'
      ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.moveTo(fx, fy - CELL / 2 + 6); ctx.lineTo(fx, fy - CELL / 2 + 2); ctx.stroke()
      ctx.fillStyle = 'rgba(38, 115, 20, 0.35)'
      ctx.beginPath(); ctx.ellipse(fx + 3, fy - CELL / 2 + 5, 3, 1.5, -0.5, 0, Math.PI * 2); ctx.fill()

      // Snake — interpolated between previous and current grid position
      snake.current.forEach((seg, i) => {
        const p = prevSnake.current[i] ?? seg
        // Skip interpolation across a wrap (distance > 1 cell)
        const vx = Math.abs(seg.x - p.x) <= 1 ? lerp(p.x, seg.x, t) : seg.x
        const vy = Math.abs(seg.y - p.y) <= 1 ? lerp(p.y, seg.y, t) : seg.y
        const px = vx * CELL, py = vy * CELL
        const isHead = i === 0
        const pad = 2

        ctx.fillStyle = isDead.current
          ? (isHead ? 'rgba(175, 28, 28, 0.45)' : 'rgba(195, 65, 65, 0.28)')
          : (isHead ? 'rgba(22, 163, 74, 0.45)'  : 'rgba(74, 222, 128, 0.28)')

        rr(ctx, px + pad, py + pad, CELL - pad * 2, CELL - pad * 2, isHead ? 5 : 3)
        ctx.fill()
      })
    }

    const loop = (now: number) => {
      if (lastTick.current === 0) lastTick.current = now
      const elapsed = now - lastTick.current
      if (elapsed >= TICK) {
        step()
        lastTick.current = now - (elapsed % TICK)
      }
      draw(Math.min((now - lastTick.current) / TICK, 1))
      rafId.current = requestAnimationFrame(loop)
    }

    const onKey = (e: KeyboardEvent) => {
      const map: Partial<Record<string, Dir>> = {
        ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT',
        w: 'UP', s: 'DOWN', a: 'LEFT', d: 'RIGHT',
      }
      const d = map[e.key]
      if (!d) return
      if (e.key.startsWith('Arrow')) e.preventDefault()
      if (d !== OPP[dir.current]) nextDir.current = d
    }

    document.addEventListener('keydown', onKey)
    init()
    rafId.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafId.current)
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
      <div style={{
        position: 'fixed',
        bottom: '1.25rem',
        right: '1.25rem',
        zIndex: 10,
        fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace',
        fontSize: '0.65rem',
        color: 'var(--text-faint)',
        textAlign: 'right',
        lineHeight: 1.7,
        pointerEvents: 'none',
        userSelect: 'none',
        opacity: 0.65,
      }}>
        {dead && <div style={{ color: 'var(--accent)', opacity: 0.75, marginBottom: '0.1rem' }}>game over</div>}
        <div>score  {score}</div>
        <div>best   {highScore}</div>
      </div>
    </>
  )
}
