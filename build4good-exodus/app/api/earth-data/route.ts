import { NextRequest, NextResponse } from 'next/server'

import { getEarthData } from '@/lib/nasaPower'

function parseCoordinate(value: string | null, name: string) {
  if (value === null) {
    throw new Error(`Missing ${name} query parameter`)
  }

  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid ${name} query parameter`)
  }

  return parsed
}

export async function GET(request: NextRequest) {
  try {
    const latitude = parseCoordinate(
      request.nextUrl.searchParams.get('latitude'),
      'latitude'
    )
    const longitude = parseCoordinate(
      request.nextUrl.searchParams.get('longitude'),
      'longitude'
    )

    const earthData = await getEarthData(latitude, longitude)

    return NextResponse.json(earthData)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch earth data'

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
