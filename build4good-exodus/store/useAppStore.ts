import { create } from 'zustand'

export interface Planet {
  id: string
  name: string
  radius: number
  mass: number | null
  temp: number
  distanceLy: number
  period: number | null
  ra: number
  dec: number
  cvi: number
}

export interface ParameterCoefficients {
  slope: number | null
  intercept: number | null
}

export interface EarthRegression {
  location: { latitude: number; longitude: number }
  coefficients: {
    T2M: ParameterCoefficients
    PRECTOTCORR: ParameterCoefficients
    RH2M: ParameterCoefficients
    WS2M: ParameterCoefficients
    ALLSKY_SFC_SW_DWN: ParameterCoefficients
  }
}

export type EarthSeries = Record<string, number[]>

interface AppStore {
  selectedPlanet: Planet | null
  planets: Planet[]
  earthRegression: EarthRegression | null
  earthSeries: EarthSeries | null
  earthLoading: boolean
  timeToBreachYears: number | null
  breachingParam: string | null
  elapsedYears: number
  earthHeatLevel: number
  filters: {
    cvi: number
    radius: number
    distanceLy: number
  }
  earthView: {
    cameraPosition: [number, number, number]
    target: [number, number, number]
  }
  setSelectedPlanet: (planet: Planet | null) => void
  setPlanets: (planets: Planet[]) => void
  setEarthRegression: (data: EarthRegression) => void
  setEarthSeries: (series: EarthSeries) => void
  setEarthLoading: (loading: boolean) => void
  setTimeToBreach: (years: number, param: string) => void
  setEarthHeatLevel: (level: number) => void
  setEarthView: (cameraPosition: [number, number, number], target: [number, number, number]) => void
  tickYear: () => void
  setFilter: (key: keyof AppStore['filters'], value: number) => void
}

export const useAppStore = create<AppStore>((set) => ({
  selectedPlanet: null,
  planets: [],
  earthRegression: null,
  earthSeries: null,
  earthLoading: true,
  timeToBreachYears: null,
  breachingParam: null,
  elapsedYears: 0,
  earthHeatLevel: 0,
  filters: { cvi: 0, radius: 2, distanceLy: 5000 },
  earthView: {
    cameraPosition: [0, 0, 5.7],
    target: [0, 0, 0],
  },
  setSelectedPlanet: (planet) => set({ selectedPlanet: planet }),
  setPlanets: (planets) => set({ planets }),
  setEarthRegression: (data) => set({ earthRegression: data }),
  setEarthSeries: (series) => set({ earthSeries: series }),
  setEarthLoading: (loading) => set({ earthLoading: loading }),
  setTimeToBreach: (years, param) => set({ timeToBreachYears: years, breachingParam: param }),
  setEarthHeatLevel: (level) => set({ earthHeatLevel: Math.max(0, Math.min(1, level)) }),
  setEarthView: (cameraPosition, target) => set({ earthView: { cameraPosition, target } }),
  tickYear: () => set(s => ({ elapsedYears: s.elapsedYears + 1 })),
  setFilter: (key, value) => set(s => ({ filters: { ...s.filters, [key]: value } })),
}))
