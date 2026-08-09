import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

export async function GET() {
  const { data, error } = await supabase
    .from('todo_content')
    .select('id, name, content, position')
    .order('position', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function PUT(request: Request) {
  const { id, content } = await request.json() as { id: number; content: string }
  const { error } = await supabase
    .from('todo_content')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function POST(request: Request) {
  const { name } = await request.json() as { name: string }

  const { data: existing } = await supabase
    .from('todo_content')
    .select('position')
    .order('position', { ascending: false })
    .limit(1)

  const nextPosition = (existing?.[0]?.position ?? -1) + 1

  const { data, error } = await supabase
    .from('todo_content')
    .insert({ name, content: '', position: nextPosition, updated_at: new Date().toISOString() })
    .select('id, name, position')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: Request) {
  const { id, name } = await request.json() as { id: number; name: string }
  const { error } = await supabase
    .from('todo_content')
    .update({ name })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = parseInt(searchParams.get('id') ?? '')
  if (isNaN(id)) return NextResponse.json({ error: 'invalid id' }, { status: 400 })

  const { error } = await supabase
    .from('todo_content')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
