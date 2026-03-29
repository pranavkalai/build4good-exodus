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

interface AppStore {
  selectedPlanet: Planet | null
  planets: Planet[]
  earthRegression: EarthRegression | null
  earthLoading: boolean
  filters: {
    cvi: number
    radius: number
    distanceLy: number
  }
  setSelectedPlanet: (planet: Planet | null) => void
  setPlanets: (planets: Planet[]) => void
  setEarthRegression: (data: EarthRegression) => void
  setEarthLoading: (loading: boolean) => void
  setFilter: (key: keyof AppStore['filters'], value: number) => void
}

export const useAppStore = create<AppStore>((set) => ({
  selectedPlanet: null,
  planets: [],
  earthRegression: null,
  earthLoading: true,
  filters: { cvi: 0, radius: 2, distanceLy: 5000 },
  setSelectedPlanet: (planet) => set({ selectedPlanet: planet }),
  setPlanets: (planets) => set({ planets }),
  setEarthRegression: (data) => set({ earthRegression: data }),
  setEarthLoading: (loading) => set({ earthLoading: loading }),
  setFilter: (key, value) => set(s => ({ filters: { ...s.filters, [key]: value } })),
}))