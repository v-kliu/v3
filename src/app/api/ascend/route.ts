import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

const TABLE = 'vkliu_growth_content'

export async function GET() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, name, icon, steps, position')
    .order('position', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function PUT(request: Request) {
  const { id, steps } = await request.json() as { id: number; steps: unknown[] }
  const { error } = await supabase
    .from(TABLE)
    .update({ steps, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function POST(request: Request) {
  const { name, icon } = await request.json() as { name: string; icon: string }

  const { data: existing } = await supabase
    .from(TABLE)
    .select('position')
    .order('position', { ascending: false })
    .limit(1)

  const nextPosition = (existing?.[0]?.position ?? -1) + 1

  const { data, error } = await supabase
    .from(TABLE)
    .insert({ name, icon, steps: [], position: nextPosition, updated_at: new Date().toISOString() })
    .select('id, name, icon, steps, position')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: Request) {
  const { id, name, icon } = await request.json() as { id: number; name?: string; icon?: string }
  const patch: Record<string, string> = {}
  if (name !== undefined) patch.name = name
  if (icon !== undefined) patch.icon = icon

  const { error } = await supabase.from(TABLE).update(patch).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = parseInt(searchParams.get('id') ?? '')
  if (isNaN(id)) return NextResponse.json({ error: 'invalid id' }, { status: 400 })

  const { error } = await supabase.from(TABLE).delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
