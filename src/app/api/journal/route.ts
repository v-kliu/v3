import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

export async function GET() {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('id, created_at, title, transcript, duration_seconds, entry_type, rating')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ entries: data })
}

export async function POST(request: Request) {
  const body = await request.json() as {
    title: string; transcript: string; duration_seconds: number
    entry_type?: string; rating?: number | null
  }
  const { title, transcript, duration_seconds, entry_type, rating } = body

  const { error } = await supabase.from('journal_entries').insert({
    title: title || 'untitled',
    transcript,
    duration_seconds,
    entry_type: entry_type ?? 'voice',
    rating: rating ?? null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
