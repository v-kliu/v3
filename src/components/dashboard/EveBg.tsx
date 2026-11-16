'use client'

import { useEffect, useRef } from 'react'

const CHARS = '0123456789abcdef<>/{}[]();=+-!|~$#@%^&*'
const mono = 'SFMono-Regular, Consolas, Menlo, monospace'
const COLORS = ['#8E5CD9', '#8E5CD9', '#8E5CD9', '#6A994E', '#7B68EE']

export default function EveBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    if (!ctx) return

    const SIZE = 18

    type Cell = { char: string; opacity: number; color: string }
    let grid: Cell[][] = []
    let animId: number

    const c2 = canvas
    function resize() {
      c2.width = window.innerWidth
      c2.height = window.innerHeight
      const rows = Math.ceil(c2.height / SIZE)
      const cols = Math.ceil(c2.width / SIZE)
      grid = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => ({ char: '', opacity: 0, color: COLORS[0] }))
      )
    }

    resize()
    window.addEventListener('resize', resize)

    let frame = 0

    function tick() {
      frame++
      ctx.clearRect(0, 0, c2.width, c2.height)
      ctx.font = `${SIZE - 3}px ${mono}`

      if (frame % 4 === 0) {
        const rows = grid.length
        const cols = grid[0]?.length ?? 0
        for (let n = 0; n < 3; n++) {
          const r = Math.floor(Math.random() * rows)
          const c = Math.floor(Math.random() * cols)
          grid[r][c] = {
            char: CHARS[Math.floor(Math.random() * CHARS.length)],
            opacity: 0.07 + Math.random() * 0.07,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
          }
        }
      }

      for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < (grid[r]?.length ?? 0); c++) {
          const cell = grid[r][c]
          if (cell.opacity <= 0 || !cell.char) continue
          ctx.globalAlpha = cell.opacity
          ctx.fillStyle = cell.color
          ctx.fillText(cell.char, c * SIZE, (r + 1) * SIZE - 3)
          cell.opacity -= 0.0008
          if (cell.opacity < 0) cell.opacity = 0
        }
      }

      ctx.globalAlpha = 1
      animId = requestAnimationFrame(tick)
    }

    tick()
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}
      aria-hidden
    />
  )
}
