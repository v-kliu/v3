import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { transcript } = await request.json() as { transcript?: string }

  if (!transcript?.trim()) {
    return NextResponse.json({ error: 'No content provided' }, { status: 400 })
  }

  const prompt = `Analyze this personal journal entry and return ONLY valid JSON with two fields:
- "title": a short descriptive title, 4-8 words, lowercase, captures the main theme or mood
- "rating": a mood/day rating 1-10 (1 = worst day of my life, 10 = best ever). First check if the person explicitly mentions a rating or number score. If not, estimate from the emotional tone and events described.

Respond with ONLY the JSON object, nothing else. Example: {"title": "rough day at work", "rating": 4}

Journal entry:
${transcript}`

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 80,
      temperature: 0.3,
    }),
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }

  const data = await res.json()
  const text: string = data.choices?.[0]?.message?.content ?? ''

  try {
    const parsed = JSON.parse(text.trim()) as { title: string; rating: number }
    const rating = Math.min(10, Math.max(1, Math.round(parsed.rating)))
    return NextResponse.json({ title: parsed.title, rating })
  } catch {
    return NextResponse.json({ title: transcript.slice(0, 60), rating: null })
  }
}
