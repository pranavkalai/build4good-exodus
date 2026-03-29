'use client'

import { useEffect, useState } from 'react'

interface StatCardProps {
  label: string
  value: string
  unit: string
  alert: string
  alertColor: string
  lineColor: string
  trend: 'up' | 'down'
  series?: number[]
  thresholdPct?: number
}

function useCountUp(target: number, duration = 1200) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const start = performance.now()

    const frame = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCurrent(target * eased)

      if (progress < 1) requestAnimationFrame(frame)
    }

    requestAnimationFrame(frame)
  }, [target, duration])

  return current
}

function Sparkline({ series, color }: { series: number[]; color: string }) {
  if (!series || series.length < 2) return null

  const w = 300
  const h = 44

  const min = Math.min(...series)
  const max = Math.max(...series)
  const range = max - min || 1

  const getPoint = (v: number, i: number) => {
    const x = (i / (series.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 4) - 2
    return { x, y }
  }

  const lastIndex = series.length - 1

  // full points string
  const points = series
    .map((v, i) => {
      const { x, y } = getPoint(v, i)
      return `${x},${y}`
    })
    .join(' ')

  // split for projection highlight
  const pastPoints = series
    .slice(0, lastIndex)
    .map((v, i) => {
      const { x, y } = getPoint(v, i)
      return `${x},${y}`
    })
    .join(' ')

  const lastSegment = series
    .slice(lastIndex - 1)
    .map((v, i) => {
      const idx = lastIndex - 1 + i
      const { x, y } = getPoint(v, idx)
      return `${x},${y}`
    })
    .join(' ')

  const last = getPoint(series[lastIndex], lastIndex)

  const gradId = `grad-${color.replace('#', '')}`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: h }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* area fill */}
      <polygon points={`0,${h} ${points} ${w},${h}`} fill={`url(#${gradId})`} />

      {/* past line */}
    <polyline
      points={points}
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transition: 'all 0.6s ease-out'
      }}
    />

      {/* projected segment */}
      <polyline
        points={lastSegment}
        fill="none"
        stroke="#f87171"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* glowing endpoint */}
      <circle cx={last.x} cy={last.y} r="2.5" fill={color} />
      <circle cx={last.x} cy={last.y} r="6" fill={color} opacity="0.15" />
    </svg>
  )
}

export function StatCard({
  label,
  value,
  unit,
  alert,
  alertColor,
  lineColor,
  trend,
  series,
  thresholdPct,
}: StatCardProps) {
  const numericTarget = parseFloat(value.replace(/[^0-9.-]/g, ''))
  const isNumeric = !isNaN(numericTarget)

  const animated = useCountUp(isNumeric ? numericTarget : 0)

  const displayValue = isNumeric
    ? (value.startsWith('+') ? '+' : '') + animated.toFixed(1)
    : value

  // 🔥 append projected value to graph
const [liveSeries, setLiveSeries] = useState<number[]>([])

useEffect(() => {
  if (!series || !isNumeric) return

  setLiveSeries(series.slice(-20))
}, [series])

useEffect(() => {
  if (!isNumeric) return

  const interval = setInterval(() => {
    setLiveSeries(prev => {
      if (prev.length === 0) return prev

      const next = [...prev.slice(1), numericTarget]
      return next
    })
  }, 1000) // 👈 update every second

  return () => clearInterval(interval)
}, [numericTarget])
  // dynamic color based on threshold
  const dynamicColor =
    thresholdPct && thresholdPct > 0.8
      ? '#f87171'
      : thresholdPct && thresholdPct > 0.5
      ? '#fbbf24'
      : lineColor

  return (
    <div className="flex-1 px-5 py-4 bg-[#1a1a1a] border-b border-stone-800 flex flex-col justify-between overflow-hidden">
      
      {/* header */}
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
          {label}
        </span>
        <span style={{ color: dynamicColor }} className="text-xs">
          {trend === 'up' ? '↑' : '↓'}
        </span>
      </div>

      {/* value */}
      <div className="flex items-baseline gap-1.5 mt-1">
        <span className="text-3xl font-black text-orange-200 font-mono tracking-tight">
          {displayValue}
        </span>
        <span className="text-xs text-stone-500 font-mono uppercase">
          {unit}
        </span>
      </div>

      {/* sparkline */}
      <div className="mt-1">
        <Sparkline series={liveSeries} color={dynamicColor} />
      </div>

      {/* threshold bar */}
      {typeof thresholdPct === 'number' && (
        <div className="w-full h-0.5 bg-stone-800 mt-2">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${Math.min(100, thresholdPct * 100)}%`,
              backgroundColor:
                thresholdPct > 0.8
                  ? '#f87171'
                  : thresholdPct > 0.5
                  ? '#fbbf24'
                  : '#10b981',
            }}
          />
        </div>
      )}

      {/* alert */}
      <div className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${alertColor} flex items-center gap-1`}>
        <span>{trend === 'up' ? '▲' : '▼'}</span>
        <span>{alert}</span>
      </div>
    </div>
  )
}