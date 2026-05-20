import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

export async function GET() {
  const { data, error } = await supabase
    .from('visits')
    .select('ip, latitude, longitude')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .neq('latitude', 'unknown')
    .neq('longitude', 'unknown')
    .neq('ip', 'unknown')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const seen = new Set<string>()
  const dots = (data as { ip: string; latitude: string; longitude: string }[])
    .filter((row) => {
      if (seen.has(row.ip)) return false
      seen.add(row.ip)
      return true
    })
    .map((row) => ({
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
    }))

  return NextResponse.json({ dots })
}
