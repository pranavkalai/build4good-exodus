import { NextResponse } from 'next/server'

import {
  getEarthDataRegressionCoefficients,
  getEarthDataSharedNextIndex,
} from '@/lib/get-earth-data-regression'
import { getEarthData } from '@/lib/nasaPower'

const UNITED_STATES_COORDINATES = {
  latitude: 39.8283,
  longitude: -98.5795,
} as const

export async function GET() {
  try {
    const { latitude, longitude } = UNITED_STATES_COORDINATES

    const earthData = await getEarthData(latitude, longitude)
    const regressionCoefficients =
      getEarthDataRegressionCoefficients(earthData)
    const nextIndex = getEarthDataSharedNextIndex(earthData)

    return NextResponse.json({
      regressionCoefficients: regressionCoefficients.coefficients,
      nextIndex,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch earth data'

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
