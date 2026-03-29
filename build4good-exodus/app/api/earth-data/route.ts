import { getEarthData } from '@/lib/nasaPower'
import { getEarthDataRegressionCoefficients } from '@/lib/get-earth-data-regression'
import { NextResponse } from 'next/server'

const LAT = 39.5
const LON = -98.35

export async function GET() {
  try {
    const earthData = await getEarthData(LAT, LON)
    const regression = getEarthDataRegressionCoefficients(earthData)
    return NextResponse.json({ ok: true, regression })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    const stack = err instanceof Error ? err.stack : ''
    console.error('Earth API error:', message, stack)
    return NextResponse.json({ ok: false, error: message, stack }, { status: 500 })
  }
}