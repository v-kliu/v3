import { Redis } from '@upstash/redis'
import { createClient } from '@supabase/supabase-js'

const redis = Redis.fromEnv()
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const totalVisits = await redis.incr('totalVisits')

  try {
    const country = (req.headers['x-vercel-ip-country'] as string) ?? 'unknown'
    const city = decodeURIComponent((req.headers['x-vercel-ip-city'] as string) ?? 'unknown')
    const region = (req.headers['x-vercel-ip-country-region'] as string) ?? 'unknown'

    const latitude = (req.headers['x-vercel-ip-latitude'] as string) ?? null
    const longitude = (req.headers['x-vercel-ip-longitude'] as string) ?? null

    const ua = (req.headers['user-agent'] as string) ?? ''
    const device = /mobile/i.test(ua) ? 'mobile' : /tablet|ipad/i.test(ua) ? 'tablet' : 'desktop'
    
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? 'unknown'
    const is_admin = ip === process.env.ADMIN_IP!


    const { error } = await supabase.from('visits').insert({
      country,
      city,
      region,
      device,
      latitude,
      longitude,
      is_admin,
      ip
    })

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ totalVisits })
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' })
  }
}