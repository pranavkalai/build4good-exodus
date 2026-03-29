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

function isMonthlyDateKey(dateKey: string): boolean {
  return /^\d{6}$/.test(dateKey) && dateKey.slice(4, 6) !== '13'
}

function isValidNasaEntry(
  entry: [string, number | null | undefined]
): entry is [string, number] {
  return isMonthlyDateKey(entry[0]) && isValidNasaValue(entry[1])
}

function getValidSortedEntries(series: NasaParameterSeries | undefined) {
  if (!series) {
    return [] as [string, number][]
  }

  return Object.entries(series)
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .filter(isValidNasaEntry)
}

function getSharedValidDateKeys(
  parameterData: Partial<Record<EarthDataParameter, NasaParameterSeries>>
) {
  const validDateKeySets = EARTH_DATA_PARAMETERS.map(
    (parameter) => new Set(getValidSortedEntries(parameterData[parameter]).map(([dateKey]) => dateKey))
  )

  const [firstDateKeySet, ...remainingDateKeySets] = validDateKeySets

  return Array.from(firstDateKeySet)
    .filter((dateKey) =>
      remainingDateKeySets.every((dateKeySet) => dateKeySet.has(dateKey))
    )
    .sort((leftKey, rightKey) => leftKey.localeCompare(rightKey))
}

function getSharedRegressionPoints(
  series: NasaParameterSeries | undefined,
  sharedDateKeys: string[]
): RegressionPoint[] {
  if (!series || sharedDateKeys.length === 0) {
    return []
  }

  const validEntriesByDateKey = new Map(getValidSortedEntries(series))

  return sharedDateKeys.flatMap((dateKey, index) => {
    const value = validEntriesByDateKey.get(dateKey)

    if (value === undefined) {
      return []
    }

    return {
      dateKey,
      x: index,
      y: value,
    }
  })
}

function getLinearRegressionCoefficients(points: RegressionPoint[]) {
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

function getRegressionIndexInfo(points: RegressionPoint[]): RegressionIndexInfo {
  if (points.length < 2) {
    return {
      pointCount: points.length,
      lastX: points.length === 0 ? null : points.length - 1,
      nextX: points.length === 0 ? null : points.length,
      lastDateKey: points.length === 0 ? null : points[points.length - 1].dateKey,
      note:
        points.length === 0
          ? 'No shared valid monthly points available for regression.'
          : 'Fewer than 2 shared valid monthly points available for regression.',
    }
  }

  return {
    pointCount: points.length,
    lastX: points.length - 1,
    nextX: points.length,
    lastDateKey: points[points.length - 1].dateKey,
  }
}

export function getEarthDataRegressionCoefficients(earthData: EarthDataResult) {
  const rawData = earthData.data as NasaPowerPayload
  const parameterData = rawData.properties?.parameter ?? {}
  const sharedDateKeys = getSharedValidDateKeys(parameterData)

  const coefficients = Object.fromEntries(
    EARTH_DATA_PARAMETERS.map((parameter) => [
      parameter,
      getLinearRegressionCoefficients(
        getSharedRegressionPoints(parameterData[parameter], sharedDateKeys)
      ),
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
  const sharedDateKeys = getSharedValidDateKeys(parameterData)

  return Object.fromEntries(
    EARTH_DATA_PARAMETERS.map((parameter) => [
      parameter,
      {
        ...EARTH_DATA_PARAMETER_METADATA[parameter],
        ...getRegressionIndexInfo(
          getSharedRegressionPoints(parameterData[parameter], sharedDateKeys)
        ),
      },
    ])
  ) as EarthDataRegressionIndexInfo
}

export function getEarthDataSharedNextIndex(earthData: EarthDataResult) {
  const regressionIndexInfo = getEarthDataRegressionIndexInfo(earthData)
  const sharedPointCount = regressionIndexInfo.T2M.pointCount

  return sharedPointCount >= 2 ? regressionIndexInfo.T2M.nextX : null
}