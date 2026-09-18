import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(request: Request) {
  const body = await request.json()
  const { flight_iata, origin_iata, destination_iata, duration_seconds, liu_miles, completed } = body

  const { error } = await supabase.from('vkliu_pomodoro_sessions').insert({
    flight_iata,
    origin_iata,
    destination_iata,
    duration_seconds,
    liu_miles,
    completed,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
