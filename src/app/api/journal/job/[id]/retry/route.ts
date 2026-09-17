import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { error } = await supabase
    .from('journal_jobs')
    .update({ status: 'pending', error: null })
    .eq('id', id)
    .eq('status', 'failed')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  fetch(`${process.env.SUPABASE_URL}/functions/v1/process-journal-job`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ jobId: id }),
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
