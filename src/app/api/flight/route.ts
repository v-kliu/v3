import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const flight = searchParams.get('flight')?.toUpperCase().replace(/\s+/g, '')

  if (!flight) {
    return NextResponse.json({ error: 'flight number required' }, { status: 400 })
  }

  const url = `http://api.aviationstack.com/v1/flights?access_key=${process.env.AVIATIONSTACK_API_KEY}&flight_iata=${flight}`

  const res = await fetch(url, { next: { revalidate: 60 } })
  if (!res.ok) {
    return NextResponse.json({ error: 'upstream error' }, { status: 502 })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
