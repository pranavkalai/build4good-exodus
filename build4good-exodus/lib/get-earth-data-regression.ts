import { getEarthData } from '@/lib/nasaPower'

const EARTH_DATA_PARAMETERS = [
  'T2M',
  'PRECTOTCORR',
  'RH2M',
  'WS2M',
  'ALLSKY_SFC_SW_DWN',
] as const

type EarthDataParameter = (typeof EARTH_DATA_PARAMETERS)[number]
type EarthDataResult = Awaited<ReturnType<typeof getEarthData>>

type NasaParameterSeries = Record<string, number | null | undefined>

type NasaPowerPayload = {
  properties?: {
    parameter?: Partial<Record<EarthDataParameter, NasaParameterSeries>>
  }
}

type RegressionPoint = {
  dateKey: string
  x: number
  y: number
}

type RegressionIndexInfo = {
  pointCount: number
  lastX: number | null
  nextX: number | null
  lastDateKey: string | null
  note?: string
}

type EarthDataRegressionIndexInfo = Record<
  EarthDataParameter,
  RegressionIndexInfo & {
    label: string
    unit: string
  }
>

const EARTH_DATA_PARAMETER_METADATA: Record<
  EarthDataParameter,
  { label: string; unit: string }
> = {
  T2M: {
    label: 'Temperature at 2 m',
    unit: '°C',
  },
  PRECTOTCORR: {
    label: 'Precipitation',
    unit: 'mm/day',
  },
  RH2M: {
    label: 'Relative Humidity at 2 m',
    unit: '%',
  },
  WS2M: {
    label: 'Wind Speed at 2 m',
    unit: 'm/s',
  },
  ALLSKY_SFC_SW_DWN: {
    label: 'Solar Radiation',
    unit: 'kWh/m²/day',
  },
}

function isValidNasaValue(value: number | null | undefined): value is number {
  return value !== null && value !== undefined && Number.isFinite(value) && value > -900
}

function isValidNasaEntry(
  entry: [string, number | null | undefined]
): entry is [string, number] {
  return isValidNasaValue(entry[1])
}

function getValidRegressionPoints(
  series: NasaParameterSeries | undefined
): RegressionPoint[] {
  if (!series) {
    return []
  }

  return Object.entries(series)
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .filter(isValidNasaEntry)
    .map(([dateKey, value], index) => ({
      dateKey,
      x: index,
      y: value,
    }))
}

function getLinearRegressionCoefficients(series: NasaParameterSeries | undefined) {
  const points = getValidRegressionPoints(series)

  if (points.length < 2) {
    return {
      slope: null,
      intercept: null,
    }
  }

  const count = points.length
  const sumX = points.reduce((total, point) => total + point.x, 0)
  const sumY = points.reduce((total, point) => total + point.y, 0)
  const sumXY = points.reduce((total, point) => total + point.x * point.y, 0)
  const sumXX = points.reduce((total, point) => total + point.x * point.x, 0)

  const denominator = count * sumXX - sumX * sumX

  if (denominator === 0) {
    return {
      slope: null,
      intercept: null,
    }
  }

  const slope = (count * sumXY - sumX * sumY) / denominator
  const intercept = (sumY - slope * sumX) / count

  return {
    slope,
    intercept,
  }
}

export function getRegressionIndexInfo(
  series: NasaParameterSeries | undefined
): RegressionIndexInfo {
  const points = getValidRegressionPoints(series)

  if (points.length === 0) {
    return {
      pointCount: 0,
      lastX: null,
      nextX: null,
      lastDateKey: null,
      note: 'No valid monthly points available for regression.',
    }
  }

  const lastPoint = points[points.length - 1]

  return {
    pointCount: points.length,
    lastX: lastPoint.x,
    nextX: points.length,
    lastDateKey: lastPoint.dateKey,
  }
}

export function getEarthDataRegressionCoefficients(earthData: EarthDataResult) {
  const rawData = earthData.data as NasaPowerPayload
  const parameterData = rawData.properties?.parameter ?? {}

  const coefficients = Object.fromEntries(
    EARTH_DATA_PARAMETERS.map((parameter) => [
      parameter,
      getLinearRegressionCoefficients(parameterData[parameter]),
    ])
  ) as Record<
    EarthDataParameter,
    {
      slope: number | null
      intercept: number | null
    }
  >

  return {
    location: earthData.location,
    source: earthData.source,
    coefficients,
  }
}

export function getEarthDataRegressionIndexInfo(
  earthData: EarthDataResult
): EarthDataRegressionIndexInfo {
  const rawData = earthData.data as NasaPowerPayload
  const parameterData = rawData.properties?.parameter ?? {}

  return Object.fromEntries(
    EARTH_DATA_PARAMETERS.map((parameter) => [
      parameter,
      {
        ...EARTH_DATA_PARAMETER_METADATA[parameter],
        ...getRegressionIndexInfo(parameterData[parameter]),
      },
    ])
  ) as EarthDataRegressionIndexInfo
}
