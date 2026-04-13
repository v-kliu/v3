import { Redis } from '@upstash/redis'
import { createClient } from '@supabase/supabase-js'

const redis = Redis.fromEnv()
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const totalVisits = await redis.incr('totalVisits')

  await supabase.from('visits').insert({
    country: 'unknown',
    city: 'unknown',
    region: 'unknown',
    device: 'unknown'
  })

  return res.status(200).json({ totalVisits })
}
