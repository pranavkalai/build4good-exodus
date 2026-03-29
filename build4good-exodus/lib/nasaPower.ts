const NASA_POWER_BASE_URL =
  'https://power.larc.nasa.gov/api/temporal/monthly/point'

const NASA_POWER_PARAMETERS = [
  'T2M', // temperature (°C)
  'PRECTOTCORR', // precipitation (mm/day)
  'RH2M', // humidity (%)
  'WS2M', // wind speed (m/s)
  'ALLSKY_SFC_SW_DWN', // solar radiation (kWh/m²/day)
] as const

function getDateRange() {
  // NASA POWER expects complete historical years, so we stop at last year.
  const currentYear = new Date().getUTCFullYear()
  const endYear = currentYear - 1
  const startYear = endYear - 9

  return {
    start: `${startYear}`, // proper date formatting
    end: `${endYear}`,
  }
}

export async function getEarthData(latitude: number, longitude: number) {
  const { start, end } = getDateRange()

  const url = new URL(NASA_POWER_BASE_URL)
  url.searchParams.set('latitude', String(latitude))
  url.searchParams.set('longitude', String(longitude))
  url.searchParams.set('community', 'RE')
  url.searchParams.set('format', 'JSON')
  url.searchParams.set('parameters', NASA_POWER_PARAMETERS.join(','))
  url.searchParams.set('start', start)
  url.searchParams.set('end', end)

  const response = await fetch(url.toString())

  if (!response.ok) {
    throw new Error(`NASA POWER request failed with status ${response.status}`)
  }

  let data: object

  try {
    data = (await response.json()) as object
  } catch {
    throw new Error('Failed to parse NASA POWER response as JSON')
  }

  return {
    location: {
      latitude,
      longitude,
    },
    source: {
      name: 'NASA POWER',
      url: url.toString(),
      parameters: [...NASA_POWER_PARAMETERS],
      start,
      end,
    },
    data,
  }
}
