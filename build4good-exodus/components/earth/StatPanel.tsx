'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { StatCard } from '@/components/ui/StatCard'
import type { EarthRegression } from '@/store/useAppStore'

// Project a parameter's value at a future month index using slope/intercept
function project(coeff: { slope: number | null; intercept: number | null }, atX: number): number | null {
  if (coeff.slope === null || coeff.intercept === null) return null
  return coeff.intercept + coeff.slope * atX
}

// Format projected value nicely
function fmt(val: number | null, decimals = 1): string {
  if (val === null) return '—'
  return val.toFixed(decimals)
}

function buildStats(r: EarthRegression) {
  // Project ~2 years ahead (24 months) from last data point
  const futureX = 120 + 24

  return [
    {
      label: 'TEMP AT 2M (T2M)',
      value: fmt(project(r.coefficients.T2M, futureX)),
      unit: '°C',
      alert: (r.coefficients.T2M.slope ?? 0) > 0 ? 'WARMING TREND DETECTED' : 'COOLING TREND',
      alertColor: (r.coefficients.T2M.slope ?? 0) > 0 ? 'text-rose-400' : 'text-blue-400',
      lineColor: '#f87171',
      trend: (r.coefficients.T2M.slope ?? 0) > 0 ? 'up' : 'down',
      slope: r.coefficients.T2M.slope,
    },
    {
      label: 'PRECIPITATION',
      value: fmt(project(r.coefficients.PRECTOTCORR, futureX)),
      unit: 'MM/DAY',
      alert: (r.coefficients.PRECTOTCORR.slope ?? 0) > 0 ? 'RAINFALL INCREASING' : 'DROUGHT RISK RISING',
      alertColor: (r.coefficients.PRECTOTCORR.slope ?? 0) > 0 ? 'text-blue-400' : 'text-amber-400',
      lineColor: '#60a5fa',
      trend: (r.coefficients.PRECTOTCORR.slope ?? 0) > 0 ? 'up' : 'down',
      slope: r.coefficients.PRECTOTCORR.slope,
    },
    {
      label: 'RELATIVE HUMIDITY',
      value: fmt(project(r.coefficients.RH2M, futureX)),
      unit: '%',
      alert: 'ATMOSPHERIC MOISTURE TRACKED',
      alertColor: 'text-stone-400',
      lineColor: '#a78bfa',
      trend: (r.coefficients.RH2M.slope ?? 0) > 0 ? 'up' : 'down',
      slope: r.coefficients.RH2M.slope,
    },
    {
      label: 'WIND SPEED',
      value: fmt(project(r.coefficients.WS2M, futureX)),
      unit: 'M/S',
      alert: (r.coefficients.WS2M.slope ?? 0) > 0.001 ? 'WIND PATTERNS SHIFTING' : 'WIND NOMINAL',
      alertColor: (r.coefficients.WS2M.slope ?? 0) > 0.001 ? 'text-amber-400' : 'text-stone-400',
      lineColor: '#fbbf24',
      trend: (r.coefficients.WS2M.slope ?? 0) > 0 ? 'up' : 'down',
      slope: r.coefficients.WS2M.slope,
    },
    {
      label: 'SOLAR RADIATION',
      value: fmt(project(r.coefficients.ALLSKY_SFC_SW_DWN, futureX)),
      unit: 'KWH/M²/DAY',
      alert: (r.coefficients.ALLSKY_SFC_SW_DWN.slope ?? 0) > 0 ? 'IRRADIANCE RISING' : 'IRRADIANCE STABLE',
      alertColor: (r.coefficients.ALLSKY_SFC_SW_DWN.slope ?? 0) > 0 ? 'text-rose-400' : 'text-stone-400',
      lineColor: '#fb923c',
      trend: (r.coefficients.ALLSKY_SFC_SW_DWN.slope ?? 0) > 0 ? 'up' : 'down',
      slope: r.coefficients.ALLSKY_SFC_SW_DWN.slope,
    },
  ] as const
}

export function StatPanel() {
  const { earthRegression, earthLoading, setEarthRegression, setEarthLoading } = useAppStore()

  useEffect(() => {
    setEarthLoading(true)
    fetch('/api/earth-data')
      .then(r => r.json())
      .then((payload: { ok: boolean; regression: EarthRegression }) => {
        if (payload.ok) setEarthRegression(payload.regression)
      })
      .catch(() => {/* keep showing skeleton */})
      .finally(() => setEarthLoading(false))
  }, [setEarthRegression, setEarthLoading])

  if (earthLoading) {
    return (
      <div className="w-[340px] shrink-0 h-full flex flex-col border-l border-stone-800 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex-1 px-5 py-4 bg-[#1a1a1a] border-b border-stone-800 flex flex-col gap-3 justify-center">
            <div className="h-2 w-24 bg-stone-800 rounded animate-pulse" />
            <div className="h-8 w-20 bg-stone-700 rounded animate-pulse" />
            <div className="h-10 w-full bg-stone-800 rounded animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  if (!earthRegression) {
    return (
      <div className="w-[340px] shrink-0 h-full flex flex-col border-l border-stone-800 overflow-hidden items-center justify-center">
        <span className="text-rose-400 text-xs font-mono uppercase">NASA DATA UNAVAILABLE</span>
      </div>
    )
  }

  const stats = buildStats(earthRegression)

  return (
    <div className="w-[340px] shrink-0 h-full flex flex-col border-l border-stone-800 overflow-hidden">
      {stats.map(stat => (
        <StatCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          unit={stat.unit}
          alert={stat.alert}
          alertColor={stat.alertColor}
          lineColor={stat.lineColor}
          trend={stat.trend as 'up' | 'down'}
        />
      ))}
    </div>
  )
}