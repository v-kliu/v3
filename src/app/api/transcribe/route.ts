import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ error: 'Audio transcription disabled' }, { status: 503 })
}
