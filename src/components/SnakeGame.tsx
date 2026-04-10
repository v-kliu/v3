import { useEffect, useRef, useState } from 'react'

const CELL = 20
const TICK = 150

type Dir = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
type XY  = { x: number; y: number }

const OPP:  Record<Dir, Dir>          = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' }
const DIRS: [Dir, number, number][]   = [['UP',0,-1],['DOWN',0,1],['LEFT',-1,0],['RIGHT',1,0]]

function wrapMove(pos: XY, d: Dir, cols: number, rows: number): XY {
  let nx = pos.x, ny = pos.y
  if (d === 'UP')    ny = (ny - 1 + rows) % rows
  if (d === 'DOWN')  ny = (ny + 1) % rows
  if (d === 'LEFT')  nx = (nx - 1 + cols) % cols
  if (d === 'RIGHT') nx = (nx + 1) % cols
  return { x: nx, y: ny }
}

// BFS — returns the first direction from `from` toward `to`, or null
function bfsDir(from: XY, to: XY, blocked: Set<string>, cols: number, rows: number): Dir | null {
  type N = { pos: XY; first: Dir | null }
  const q: N[] = [{ pos: from, first: null }]
  const seen = new Set<string>([`${from.x},${from.y}`])
  while (q.length) {
    const { pos, first } = q.shift()!
    for (const [d, dx, dy] of DIRS) {
      const nx = (pos.x + dx + cols) % cols
      const ny = (pos.y + dy + rows) % rows
      const k  = `${nx},${ny}`
      if (blocked.has(k) || seen.has(k)) continue
      seen.add(k)
      const fd = first ?? d
      if (nx === to.x && ny === to.y) return fd
      q.push({ pos: { x: nx, y: ny }, first: fd })
    }
  }
  return null
}

// Decide next direction for the AI each tick
function autoDir(snake: XY[], food: XY, cur: Dir, cols: number, rows: number): Dir {
  const blocked = new Set(snake.map(s => `${s.x},${s.y}`))

  // 1. Try shortest path to food
  const toFood = bfsDir(snake[0], food, blocked, cols, rows)
  if (toFood) return toFood

  // 2. Tail-chase to stay alive (tail will vacate, so exclude it from obstacles)
  const noTail = new Set(snake.slice(0, -1).map(s => `${s.x},${s.y}`))
  const toTail = bfsDir(snake[0], snake[snake.length - 1], noTail, cols, rows)
  if (toTail) return toTail

  // 3. Any non-reversing open cell
  for (const [d] of DIRS) {
    if (d === OPP[cur]) continue
    const nh = wrapMove(snake[0], d, cols, rows)
    if (!blocked.has(`${nh.x},${nh.y}`)) return d
  }
  return cur
}

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
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const [score,     setScore]     = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [dead,      setDead]      = useState(false)
  const [mode,      setMode]      = useState<'auto' | 'manual'>('auto')

  const modeRef   = useRef<'auto' | 'manual'>('auto')
  const snake     = useRef<XY[]>([])
  const prevSnake = useRef<XY[]>([])
  const dir       = useRef<Dir>('RIGHT')
  const nextDir   = useRef<Dir>('RIGHT')
  const food      = useRef<XY>({ x: 0, y: 0 })
  const cols      = useRef(0)
  const rows      = useRef(0)
  const scoreVal  = useRef(0)
  const hiVal     = useRef(0)
  const isDead    = useRef(false)
  const lastTick  = useRef(0)
  const rafId     = useRef(0)

  useEffect(() => {
    const n = parseInt(localStorage.getItem('vh-snake') || '0', 10)
    hiVal.current = n
    setHighScore(n)
  }, [])

  const toggleMode = () => {
    const next = modeRef.current === 'auto' ? 'manual' : 'auto'
    modeRef.current = next
    setMode(next)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
      cols.current  = Math.floor(canvas.width  / CELL)
      rows.current  = Math.floor(canvas.height / CELL)
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
      snake.current     = [{ x: cx, y: cy }, { x: cx - 1, y: cy }, { x: cx - 2, y: cy }]
      prevSnake.current = snake.current.map(s => ({ ...s }))
      dir.current       = 'RIGHT'
      nextDir.current   = 'RIGHT'
      scoreVal.current  = 0
      isDead.current    = false
      setScore(0)
      setDead(false)
      spawnFood()
    }

    const step = () => {
      if (isDead.current) return
      prevSnake.current = snake.current.map(s => ({ ...s }))

      if (modeRef.current === 'auto') {
        const d = autoDir(snake.current, food.current, dir.current, cols.current, rows.current)
        dir.current     = d
        nextDir.current = d
      } else {
        dir.current = nextDir.current
      }

      const nh = wrapMove(snake.current[0], dir.current, cols.current, rows.current)

      if (snake.current.some(s => s.x === nh.x && s.y === nh.y)) {
        isDead.current = true
        setDead(true)
        setTimeout(init, 1600)
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

      // Grid
      ctx.strokeStyle = 'rgba(155, 132, 88, 0.08)'
      ctx.lineWidth   = 0.5
      for (let x = 0; x <= cols.current; x++) {
        ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, h); ctx.stroke()
      }
      for (let y = 0; y <= rows.current; y++) {
        ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(w, y * CELL); ctx.stroke()
      }

      // Apple
      const f  = food.current
      const fx = (f.x + 0.5) * CELL
      const fy = (f.y + 0.5) * CELL
      ctx.fillStyle = 'rgba(195, 38, 38, 0.35)'
      ctx.beginPath(); ctx.arc(fx, fy + 1, CELL / 2 - 3, 0, Math.PI * 2); ctx.fill()
      ctx.strokeStyle = 'rgba(38, 115, 20, 0.38)'; ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.moveTo(fx, fy - CELL / 2 + 6); ctx.lineTo(fx, fy - CELL / 2 + 2); ctx.stroke()
      ctx.fillStyle = 'rgba(38, 115, 20, 0.35)'
      ctx.beginPath(); ctx.ellipse(fx + 3, fy - CELL / 2 + 5, 3, 1.5, -0.5, 0, Math.PI * 2); ctx.fill()

      // Snake with interpolation
      snake.current.forEach((seg, i) => {
        const p  = prevSnake.current[i] ?? seg
        const vx = Math.abs(seg.x - p.x) <= 1 ? lerp(p.x, seg.x, t) : seg.x
        const vy = Math.abs(seg.y - p.y) <= 1 ? lerp(p.y, seg.y, t) : seg.y
        const px = vx * CELL, py = vy * CELL
        const isHead = i === 0
        const pad    = 2

        ctx.fillStyle = isDead.current
          ? (isHead ? 'rgba(175,28,28,0.45)' : 'rgba(195,65,65,0.28)')
          : (isHead ? 'rgba(22,163,74,0.45)'  : 'rgba(74,222,128,0.28)')

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
      if (modeRef.current !== 'manual') return
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
  }, [])

  const monoFont = 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace'

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
      />

      {/* Auto / Manual toggle */}
      <button
        onClick={toggleMode}
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 10,
          fontFamily: monoFont,
          fontSize: '0.65rem',
          letterSpacing: '0.04em',
          color: 'var(--text-muted)',
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          padding: '0.25rem 0.6rem',
          cursor: 'pointer',
          opacity: 0.8,
          userSelect: 'none',
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '0.8' }}
      >
        {mode === 'auto' ? 'auto' : 'manual'}
      </button>

      {/* Score */}
      <div style={{
        position: 'fixed',
        bottom: '1.25rem',
        right: '1.25rem',
        zIndex: 10,
        fontFamily: monoFont,
        fontSize: '0.65rem',
        color: 'var(--text-muted)',
        textAlign: 'right',
        lineHeight: 1.7,
        pointerEvents: 'none',
        userSelect: 'none',
        opacity: 0.8,
      }}>
        {dead && <div style={{ color: 'var(--accent)', opacity: 0.75, marginBottom: '0.1rem' }}>game over</div>}
        <div>score  {score}</div>
        <div>best   {highScore}</div>
      </div>
    </>
  )
}
