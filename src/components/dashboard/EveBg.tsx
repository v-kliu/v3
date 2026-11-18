'use client'

import { useEffect, useRef } from 'react'

const mono = 'SFMono-Regular, Consolas, Menlo, monospace'
const SIZE = 15
const GREEN = '#7fdbca' // Night Owl cyan
const MAX_ALPHA = 0.14 // texture, not content

// Pool of terminal-ish strings that get typed out line by line
const POOL = [
  '> loading memory index...',
  '> query: who did i meet last week?',
  '0x4a2f8b1c 0x00ff41 0x9b2ef3',
  'fn embed(text: &str) -> Vec<f32>',
  '$ git commit -m "add memory node"',
  '> connected to postgres://eve-db',
  'SELECT * FROM memories WHERE ts > NOW()',
  '> 247 nodes loaded',
  '{"intent":"recall","confidence":0.91}',
  '> running eval suite... 18/20 pass',
  '$ webhook received: telegram:msg',
  'INSERT INTO decisions (id, grade)',
  '> build agent spawned pid=4821',
  '> test: 3 retries remaining',
  '0b10110100 0b00110010 0b11001011',
  '> similarity: 0.87 | threshold: 0.80',
  '$ curl -X POST /api/journal',
  '> memory written: event_id=e291',
  'type Memory = { id: string; vec: Float32Array }',
  '> phase 1 status: not_started',
]

type Line = {
  row: number
  text: string
  typed: number
  opacity: number
  color: string
  x: number
}

export default function EveBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    if (!ctx) return

    const c = canvas
    let lines: Line[] = []
    let animId: number
    let frame = 0

    function resize() {
      c.width = window.innerWidth
      c.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    function spawnLine() {
      if (lines.length >= 2) return  // cap at 2 visible at once
      const maxRows = Math.floor(c.height / SIZE)
      // Spread x across the full page width in thirds
      const col = Math.floor(Math.random() * 3)
      const xOffset = col * Math.floor(c.width / 3) + Math.floor(Math.random() * 80)
      lines.push({
        row: Math.floor(Math.random() * maxRows),
        text: POOL[Math.floor(Math.random() * POOL.length)],
        typed: 0,
        opacity: MAX_ALPHA * (0.7 + Math.random() * 0.3),
        color: GREEN,
        x: xOffset,
      })
    }

    // Seed with 2 lines
    spawnLine(); spawnLine()

    function tick() {
      frame++
      ctx.clearRect(0, 0, c.width, c.height)
      ctx.font = `${SIZE - 1}px ${mono}`

      // Spawn a new line every ~90 frames
      if (frame % 90 === 0) spawnLine()

      lines = lines.filter(l => l.opacity > 0.01)

      for (const l of lines) {
        // Type one char every 2 frames
        if (frame % 2 === 0 && l.typed < l.text.length) l.typed++

        // Start fading once fully typed
        if (l.typed >= l.text.length) l.opacity -= 0.0008
        else l.opacity = Math.min(l.opacity, MAX_ALPHA)

        ctx.globalAlpha = l.opacity
        ctx.fillStyle = l.color
        ctx.fillText(l.text.slice(0, l.typed), l.x, l.row * SIZE + SIZE)
      }

      ctx.globalAlpha = 1
      animId = requestAnimationFrame(tick)
    }

    tick()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}
      aria-hidden
    />
  )
}
