import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { RULE_SECTIONS, type RuleSection } from '@/eve/eveData'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

const TABLE = 'vkliu_eve_rules'

type RuleRow = {
  section_id: string
  section_title: string
  rule_text: string
  sort_order: number
}

function rowsToSections(rows: RuleRow[]): RuleSection[] {
  const map = new Map<string, RuleSection>()
  for (const row of rows) {
    if (!map.has(row.section_id)) {
      map.set(row.section_id, { id: row.section_id, title: row.section_title, rules: [] })
    }
    map.get(row.section_id)!.rules.push(row.rule_text)
  }
  return Array.from(map.values())
}

export async function GET() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('section_id, section_title, rule_text, sort_order')
    .order('section_id')
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Seed from eveData.ts on first load
  if (!data || data.length === 0) {
    const rows = RULE_SECTIONS.flatMap(s =>
      s.rules.map((rule, i) => ({
        section_id: s.id,
        section_title: s.title,
        rule_text: rule,
        sort_order: i,
      }))
    )
    const { error: seedError } = await supabase.from(TABLE).insert(rows)
    if (seedError) return NextResponse.json({ error: seedError.message }, { status: 500 })
    return NextResponse.json(RULE_SECTIONS)
  }

  // Preserve original section order from eveData.ts
  const sections = rowsToSections(data as RuleRow[])
  const order = RULE_SECTIONS.map(s => s.id)
  sections.sort((a, b) => {
    const ai = order.indexOf(a.id)
    const bi = order.indexOf(b.id)
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
  })

  return NextResponse.json(sections)
}

export async function POST(request: Request) {
  const sections = await request.json() as RuleSection[]

  const rows = sections.flatMap(s =>
    s.rules.map((rule, i) => ({
      section_id: s.id,
      section_title: s.title,
      rule_text: rule,
      sort_order: i,
    }))
  )

  // Replace all — simplest approach for drag-and-drop where sort_order changes freely
  const { error: delError } = await supabase.from(TABLE).delete().neq('section_id', '')
  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 })

  if (rows.length > 0) {
    const { error: insError } = await supabase.from(TABLE).insert(rows)
    if (insError) return NextResponse.json({ error: insError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
