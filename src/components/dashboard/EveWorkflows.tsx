'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow, Controls, Handle, Position, MarkerType,
  type Node, type Edge as FlowEdge, type NodeProps, type Viewport,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { WORKFLOWS, type Stage, type StageKind, type Workflow } from '@/eve/workflows'
import { findRule, type ParsedRules } from '@/eve/rules'

// Eve workflows: one graph per bot command, lanes as columns, arrows between stages.
// Click a stage to see what runs it and the RULES.md rules it follows.
// Data: src/eve/workflows.ts. Rule text: RULES.md, parsed on the server (page.tsx).
// Styles: eve.css (.eve-wf*).

const REPO_BLOB = 'https://github.com/v-kliu/v3/blob/main/'
const COL_W = 250
const ROW_H = 74
const NODE_W = 196
const TOP = 56
const NODE_H = 48

const KIND_LABEL: Record<StageKind, string> = {
  human: 'you',
  code: 'code',
  ai: 'claude',
  db: 'supabase',
  github: 'github',
  reply: 'reply',
}

type StageNodeData = { stage: Stage; selected: boolean }
type LaneNodeData = { label: string; where: string; height: number }

function StageNode({ data }: NodeProps<Node<StageNodeData>>) {
  const s = data.stage
  const cls = [
    'eve-wf-node', `eve-wf-${s.kind}`,
    s.status && s.status !== 'live' ? `eve-wf-${s.status}` : '',
    data.selected ? 'eve-wf-selected' : '',
  ].join(' ')
  return (
    <div className={cls} style={{ width: NODE_W }}>
      <Handle type="target" position={Position.Top} id="t" />
      <Handle type="target" position={Position.Left} id="l" />
      <span className="eve-wf-kind">{KIND_LABEL[s.kind]}{s.status && s.status !== 'live' ? ` · ${s.status}` : ''}</span>
      <span className="eve-wf-label">{s.label}</span>
      <Handle type="source" position={Position.Bottom} id="b" />
      <Handle type="source" position={Position.Right} id="r" />
    </div>
  )
}

function LaneNode({ data }: NodeProps<Node<LaneNodeData>>) {
  return (
    <div className="eve-wf-lane" style={{ width: COL_W - 20, height: data.height }}>
      <span className="eve-wf-lane-label">{data.label}</span>
      <span className="eve-wf-lane-where">{data.where}</span>
    </div>
  )
}

const nodeTypes = { stage: StageNode, lane: LaneNode }

// Wide screens: lanes are columns, stages flow down each column and across.
// Narrow screens: lanes stack vertically so the graph reads top to bottom at full size.
function layout(wf: Workflow, selectedId: string | null, vertical: boolean) {
  const rowInLane = new Map<string, number>()
  const counts = new Map<string, number>()
  for (const s of wf.stages) {
    const n = counts.get(s.lane) ?? 0
    rowInLane.set(s.id, n)
    counts.set(s.lane, n + 1)
  }
  const maxRows = Math.max(...counts.values())
  const laneW = COL_W - 20

  // Lane boxes: position and height.
  const laneBox = new Map<string, { x: number; y: number; h: number }>()
  let y = 0
  wf.lanes.forEach((l, i) => {
    const rows = vertical ? (counts.get(l.id) ?? 0) : maxRows
    const h = TOP + rows * ROW_H - (ROW_H - NODE_H) + 14
    laneBox.set(l.id, vertical ? { x: 0, y, h } : { x: i * COL_W, y: 0, h })
    if (vertical) y += h + 28
  })

  const nodes: Node[] = [
    ...wf.lanes.map((l): Node<LaneNodeData> => {
      const box = laneBox.get(l.id)!
      return {
        id: `lane-${l.id}`, type: 'lane', position: { x: box.x, y: box.y },
        width: laneW, height: box.h,
        data: { label: l.label, where: l.where, height: box.h },
        selectable: false, draggable: false, zIndex: -1,
      }
    }),
    ...wf.stages.map((s): Node<StageNodeData> => {
      const box = laneBox.get(s.lane)!
      return {
        id: s.id, type: 'stage',
        position: { x: box.x + (laneW - NODE_W) / 2, y: box.y + TOP + (rowInLane.get(s.id) ?? 0) * ROW_H },
        width: NODE_W, height: NODE_H,
        data: { stage: s, selected: s.id === selectedId },
        draggable: false,
      }
    }),
  ]

  const byId = new Map(wf.stages.map(s => [s.id, s]))
  const edges: FlowEdge[] = wf.edges.map(e => {
    const across = !vertical && byId.get(e.from)?.lane !== byId.get(e.to)?.lane
    const soft = byId.get(e.to)?.status && byId.get(e.to)?.status !== 'live'
    return {
      id: `${e.from}-${e.to}`,
      source: e.from, target: e.to,
      sourceHandle: across ? 'r' : 'b',
      targetHandle: across ? 'l' : 't',
      type: 'smoothstep',
      className: soft ? 'eve-wf-edge eve-wf-edge-soft' : 'eve-wf-edge',
      markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
    }
  })
  const height = vertical ? y : TOP + maxRows * ROW_H + 24
  const width = vertical ? laneW : wf.lanes.length * COL_W - 20
  return { nodes, edges, height, width }
}

function useNarrow(query = '(max-width: 700px)') {
  const [narrow, setNarrow] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const update = () => setNarrow(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [query])
  return narrow
}

function StageDetail({ stage, rules }: { stage: Stage; rules: ParsedRules }) {
  const refs = (stage.rules ?? []).flatMap(ref =>
    ref.rules.map(n => ({ section: ref.section, n, rule: findRule(rules, ref.section, n) })))
  return (
    <div>
      <p className="eve-faint eve-small">
        {KIND_LABEL[stage.kind]}{stage.model ? ` · ${stage.model}` : ''}{stage.table ? ` · ${stage.table}` : ''}
      </p>
      <h3 className="eve-h3" style={{ margin: '0.2rem 0 0.6rem' }}>{stage.label}</h3>
      {stage.status === 'gap' && <p className="eve-wf-flag">Not automated yet</p>}
      {stage.status === 'planned' && <p className="eve-wf-flag">Planned</p>}
      <p className="eve-muted eve-small">{stage.what}</p>
      {stage.onFail && (
        <p className="eve-small" style={{ marginTop: '0.6rem' }}>
          <span className="eve-faint">if it fails · </span><span className="eve-muted">{stage.onFail}</span>
        </p>
      )}
      {stage.file && (
        <p className="eve-small" style={{ marginTop: '0.6rem' }}>
          <span className="eve-faint">runs in · </span>
          <a href={REPO_BLOB + stage.file} target="_blank" rel="noreferrer">{stage.file}</a>
        </p>
      )}
      <p className="eve-faint eve-small" style={{ margin: '1.1rem 0 0.4rem' }}>
        rules from <a href={REPO_BLOB + 'RULES.md'} target="_blank" rel="noreferrer">RULES.md</a>
      </p>
      {refs.length === 0 ? (
        <p className="eve-faint eve-small">No rule targets this stage directly.</p>
      ) : (
        <ul className="eve-wf-rules">
          {refs.map(r => (
            <li key={`${r.section}-${r.n}`}>
              <span className="eve-faint">{r.section.replace(/\s*\(.*\)$/, '')} · {r.n}</span>
              <span>{r.rule?.text ?? 'Rule not found in RULES.md.'}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function EveWorkflows({ rules }: { rules: ParsedRules }) {
  const [command, setCommand] = useState(WORKFLOWS[0].command)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const narrow = useNarrow()
  const wf = WORKFLOWS.find(w => w.command === command) ?? WORKFLOWS[0]
  const { nodes, edges, height, width } = useMemo(() => layout(wf, selectedId, narrow), [wf, selectedId, narrow])
  const selected = wf.stages.find(s => s.id === selectedId) ?? null

  // Fit the whole graph in the box, centered, never above 100%. Computed from the
  // layout's known size and the box's measured size, and redone when the box resizes.
  // Pan and zoom still work, they just start from this fit.
  const canvasRef = useRef<HTMLDivElement>(null)
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 })
  const [canvasH, setCanvasH] = useState(height + 24)
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const pad = 12
    const fit = () => {
      // Scale to the box width (never above 100%), then size the box to the scaled graph.
      const zoom = Math.min(1, (el.clientWidth - pad * 2) / width)
      setViewport({ x: pad + (el.clientWidth - pad * 2 - width * zoom) / 2, y: pad, zoom })
      setCanvasH(Math.ceil(height * zoom + pad * 2))
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [width, height])

  return (
    <section>
      <h2 className="eve-h2">Workflows</h2>
      <p className="eve-lede">
        What happens when you message the Eve bot. Click a stage to see what runs it and the rules it follows.
        {rules.updated && <span className="eve-faint"> Rules as of {rules.updated}.</span>}
      </p>

      <div className="eve-wf-tabs" role="tablist" aria-label="Eve bot commands">
        {WORKFLOWS.map(w => (
          <button
            key={w.command} type="button" role="tab" aria-selected={w.command === command}
            onClick={() => { setCommand(w.command); setSelectedId(null) }}
          >
            {w.command}
          </button>
        ))}
      </div>

      <div className="eve-wf">
        <div className="eve-wf-canvas" ref={canvasRef} style={{ height: canvasH }}>
          <ReactFlow
            key={`${wf.command}-${narrow}`}
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodeClick={(_, n) => { if (n.type === 'stage') setSelectedId(n.id) }}
            onPaneClick={() => setSelectedId(null)}
            nodesDraggable={false}
            nodesConnectable={false}
            zoomOnScroll={false}
            preventScrolling={false}
            panOnDrag={!narrow}
            zoomOnPinch={!narrow}
            zoomOnDoubleClick={!narrow}
            viewport={viewport}
            onViewportChange={setViewport}
            minZoom={0.3}
            maxZoom={1.5}
          >
            {!narrow && <Controls showInteractive={false} position="bottom-right" />}
          </ReactFlow>
        </div>
        <aside className="eve-wf-panel">
          {selected ? <StageDetail stage={selected} rules={rules} /> : (
            <div>
              <p className="eve-faint eve-small">{wf.command}</p>
              <h3 className="eve-h3" style={{ margin: '0.2rem 0 0.6rem' }}>{wf.title}</h3>
              <p className="eve-muted eve-small">{wf.summary}</p>
              <p className="eve-faint eve-small" style={{ marginTop: '1rem' }}>Click a stage for details.</p>
              <ul className="eve-wf-legend">
                {(Object.keys(KIND_LABEL) as StageKind[]).map(k => (
                  <li key={k}><span className={`eve-wf-swatch eve-wf-${k}`} />{KIND_LABEL[k]}</li>
                ))}
                <li><span className="eve-wf-swatch eve-wf-gap" />not automated yet</li>
              </ul>
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}
