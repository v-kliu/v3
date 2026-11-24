import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'
import { WORKFLOWS } from '@/eve/workflows'
import { parseRules, findRule } from '@/eve/rules'
import { classifyMessage, MessageType } from '@/eve/router'

// Keeps the Eve dev workflow graph honest. It fails when:
// - RULES.md is edited so a rule a stage points at no longer exists (or moved number)
// - a stage points at a file that was renamed or deleted
// - a stage claims a model or Supabase table its file no longer uses
// - the bot gains a command that has no workflow
// - the graph has a broken or unreachable stage

const ROOT = path.resolve(__dirname, '../..')
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8')
const RULES = parseRules(read('RULES.md'))

describe('parseRules', () => {
  it('parses a small sample with continuation lines', () => {
    const md = 'Rules: (updated: 1/2/26)\n\nIntro line.\n\nAlpha\n1. First rule\n   continues here.\n2. Second\n\nBeta\n1. Only\n'
    const r = parseRules(md)
    expect(r.updated).toBe('1/2/26')
    expect(r.sections.map(s => s.title)).toEqual(['Alpha', 'Beta'])
    expect(r.sections[0].rules).toEqual([{ n: 1, text: 'First rule continues here.' }, { n: 2, text: 'Second' }])
  })

  it('handles CRLF line endings', () => {
    const r = parseRules('Alpha\r\n1. One\r\n2. Two\r\n')
    expect(r.sections[0].rules.map(x => x.text)).toEqual(['One', 'Two'])
  })

  it('reads the real RULES.md with numbered sections', () => {
    const titles = RULES.sections.map(s => s.title)
    expect(titles).toContain('Development from Claude Code')
    expect(titles).toContain('Architecture')
    for (const s of RULES.sections) {
      expect(s.rules.map(r => r.n), `${s.title}: numbering`).toEqual(s.rules.map((_, i) => i + 1))
      for (const r of s.rules) expect(r.text.length, `${s.title} ${r.n}: empty`).toBeGreaterThan(0)
    }
  })
})

describe('WORKFLOWS', () => {
  it('covers every bot command plus /help', () => {
    const commands = WORKFLOWS.map(w => w.command)
    for (const type of Object.values(MessageType)) {
      if (type === MessageType.UNKNOWN) continue
      expect(classifyMessage(`/${type} x`).type).toBe(type)
      expect(commands, `no workflow for /${type}`).toContain(`/${type}`)
    }
    expect(commands).toContain('/help')
  })

  for (const wf of WORKFLOWS) {
    describe(wf.command, () => {
      const ids = new Set(wf.stages.map(s => s.id))
      const lanes = new Set(wf.lanes.map(l => l.id))

      it('has unique stage ids in known lanes', () => {
        expect(ids.size).toBe(wf.stages.length)
        for (const s of wf.stages) expect(lanes, `${s.id}: unknown lane ${s.lane}`).toContain(s.lane)
      })

      it('has edges between real stages, and every stage is reachable from the first', () => {
        for (const e of wf.edges) {
          expect(ids, `edge from ${e.from}`).toContain(e.from)
          expect(ids, `edge to ${e.to}`).toContain(e.to)
        }
        const seen = new Set([wf.stages[0].id])
        let grew = true
        while (grew) {
          grew = false
          for (const e of wf.edges) if (seen.has(e.from) && !seen.has(e.to)) { seen.add(e.to); grew = true }
        }
        expect([...ids].filter(id => !seen.has(id))).toEqual([])
      })

      it('points every stage at a real file that uses its model and table', () => {
        for (const s of wf.stages) {
          if (!s.file) continue
          expect(fs.existsSync(path.join(ROOT, s.file)), `${s.id}: missing ${s.file}`).toBe(true)
          const src = read(s.file)
          if (s.model) expect(src, `${s.id}: ${s.file} no longer uses ${s.model}`).toContain(s.model)
          if (s.table) expect(src, `${s.id}: ${s.file} no longer uses ${s.table}`).toContain(s.table)
        }
      })

      it('only references rules that exist in RULES.md', () => {
        for (const s of wf.stages) {
          for (const ref of s.rules ?? []) {
            for (const n of ref.rules) {
              expect(findRule(RULES, ref.section, n), `${s.id}: "${ref.section}" rule ${n}`).toBeDefined()
            }
          }
        }
      })
    })
  }
})

// React Flow zooms with d3-zoom@3, which accepts d3-transition 2 or 3. If npm dedupes it to
// the 2.x copy that react-simple-maps brings, transition patches the wrong d3-selection and
// the Eve page crashes on load with "interrupt is not a function". package.json overrides it.
describe('React Flow dependencies', () => {
  // Packages here don't export package.json, so resolve the entry file and walk up to it.
  const pkgOf = (req: NodeRequire, name: string) => {
    let dir = path.dirname(req.resolve(name))
    while (!fs.existsSync(path.join(dir, 'package.json')) || JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).name !== name) {
      dir = path.dirname(dir)
    }
    return { dir, version: JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).version as string }
  }

  it('resolves d3-transition 3 and d3-selection 3 under @xyflow/system', () => {
    const fromSystem = createRequire(path.join(ROOT, 'node_modules/@xyflow/system/package.json'))
    const zoom = pkgOf(fromSystem, 'd3-zoom')
    const fromZoom = createRequire(path.join(zoom.dir, 'package.json'))
    expect(pkgOf(fromZoom, 'd3-transition').version.split('.')[0]).toBe('3')
    expect(pkgOf(fromZoom, 'd3-selection').version.split('.')[0]).toBe('3')
  })
})
