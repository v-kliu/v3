import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

// req/res typed as any — @vercel/node types not installed locally;
// api/ is excluded from tsconfig so this doesn't affect the local build.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed!' })
    }

    // else valid post
    const totalVisits = await redis.incr('totalVisits')

    return res.status(200).json({ totalVisits })
}