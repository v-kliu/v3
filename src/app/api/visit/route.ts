import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(request: Request) {
  try {
    const country = request.headers.get('x-vercel-ip-country') ?? 'unknown'
    const rawCity = request.headers.get('x-vercel-ip-city') ?? 'unknown'
    const city = decodeURIComponent(rawCity)
    const region = request.headers.get('x-vercel-ip-country-region') ?? 'unknown'
    const latitude = request.headers.get('x-vercel-ip-latitude')
    const longitude = request.headers.get('x-vercel-ip-longitude')
    const ua = request.headers.get('user-agent') ?? ''
    const device = /mobile/i.test(ua) ? 'mobile' : /tablet|ipad/i.test(ua) ? 'tablet' : 'desktop'
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0] ?? 'unknown'
    const is_admin = ip === process.env.ADMIN_IP || ip === process.env.ADMIN_IP_MOBILE

    const { error } = await supabase.from('vkliu_visits').insert({
      country, city, region, device, latitude, longitude, is_admin, ip,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { count } = await supabase
      .from('vkliu_visits')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({ totalVisits: count ?? 0 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
