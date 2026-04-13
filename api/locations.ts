import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const { data, error } = await supabase
    .from('visits')
    .select('ip, latitude, longitude')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .neq('latitude', 'unknown')
    .neq('longitude', 'unknown')
    .neq('ip', 'unknown')

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  // One dot per unique IP address
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

  return res.status(200).json({ dots })
}
