import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export const maxDuration = 30

export async function POST(request: Request) {
  const formData = await request.formData()
  const audio = formData.get('audio') as Blob | null
  const duration = parseInt(formData.get('duration') as string) || 0

  if (!audio) {
    return NextResponse.json({ error: 'No audio provided' }, { status: 400 })
  }

  const audioPath = `${crypto.randomUUID()}.webm`

  const { error: uploadError } = await supabase.storage
    .from('journal-audio')
    .upload(audioPath, audio, { contentType: 'audio/webm' })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: job, error: jobError } = await supabase
    .from('vkliu_journal_jobs')
    .insert({ audio_path: audioPath, duration_seconds: duration, status: 'pending' })
    .select('id')
    .single()

  if (jobError) {
    return NextResponse.json({ error: jobError.message }, { status: 500 })
  }

  // Fire-and-forget: trigger Edge Function — browser polls for result
  fetch(`${process.env.SUPABASE_URL}/functions/v1/process-journal-job`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ jobId: job.id }),
  }).catch(() => {})

  return NextResponse.json({ jobId: job.id })
}
