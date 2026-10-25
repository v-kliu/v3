import { NextResponse } from 'next/server'

export const maxDuration = 60

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 503 })
  }

  const formData = await request.formData()
  const audio = formData.get('audio') as Blob | null

  if (!audio) {
    return NextResponse.json({ error: 'No audio provided' }, { status: 400 })
  }

  if (audio.size > 25 * 1024 * 1024) {
    return NextResponse.json({ error: 'Audio too large' }, { status: 413 })
  }

  const whisperForm = new FormData()
  whisperForm.append('file', audio, 'audio.webm')
  whisperForm.append('model', 'whisper-1')
  whisperForm.append('language', 'en')

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: whisperForm,
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Transcription failed' }, { status: 502 })
  }

  const data = await res.json()
  return NextResponse.json({ transcript: data.text })
}
