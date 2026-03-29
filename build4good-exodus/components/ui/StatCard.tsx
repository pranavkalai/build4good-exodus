'use client'

import { useEffect, useRef, useState } from 'react'
import { InfoTooltip } from '@/components/ui/InfoTooltip'
import { useAppStore } from '@/store/useAppStore'

interface StatCardProps {
  label: string
  description?: string
  value: string
  unit: string
  alert: string
  alertColor: string
  lineColor: string
  trend: 'up' | 'down'
  series?: number[]
  thresholdPct?: number
}

function useCountTransition(target: number, paused: boolean, duration = 1200) {
  const [current, setCurrent] = useState(target)
  const frameRef = useRef<number | null>(null)
  const currentRef = useRef(target)

  useEffect(() => {
    if (paused) {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
      setCurrent(currentRef.current)
      return
    }

    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }

    const startValue = currentRef.current

    if (startValue === target) {
      setCurrent(target)
      return
    }

    const start = performance.now()

    const frame = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const nextValue = startValue + (target - startValue) * eased
      currentRef.current = nextValue
      setCurrent(nextValue)

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(frame)
        return
      }

      currentRef.current = target
      frameRef.current = null
    }

    frameRef.current = requestAnimationFrame(frame)

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [paused, target, duration])

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

  const points = series
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

      <polygon points={`0,${h} ${points} ${w},${h}`} fill={`url(#${gradId})`} />

      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transition: 'all 0.6s ease-out' }}
      />

      <polyline
        points={lastSegment}
        fill="none"
        stroke="#f87171"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle cx={last.x} cy={last.y} r="2.5" fill={color} />
      <circle cx={last.x} cy={last.y} r="6" fill={color} opacity="0.15" />
    </svg>
  )
}

export function StatCard({
  label,
  description,
  value,
  unit,
  alert,
  alertColor,
  lineColor,
  trend,
  series,
  thresholdPct,
}: StatCardProps) {
  const isTimerPaused = useAppStore((state) => state.isTimerPaused)
  const numericTarget = parseFloat(value.replace(/[^0-9.-]/g, ''))
  const isNumeric = !isNaN(numericTarget)
  const animated = useCountTransition(isNumeric ? numericTarget : 0, isTimerPaused)
  const displayValue = isNumeric
    ? (value.startsWith('+') ? '+' : '') + animated.toFixed(1)
    : value

  const [liveSeries, setLiveSeries] = useState<number[]>([])

  useEffect(() => {
    if (!series || !isNumeric) return
    setLiveSeries(series.slice(-20))
  }, [series, isNumeric])

  useEffect(() => {
    if (!isNumeric || isTimerPaused) return

    const interval = setInterval(() => {
      setLiveSeries((prev) => {
        if (prev.length === 0) return prev
        return [...prev.slice(1), numericTarget]
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isTimerPaused, numericTarget, isNumeric])

  const dynamicColor =
    thresholdPct && thresholdPct > 0.8
      ? '#f87171'
      : thresholdPct && thresholdPct > 0.5
        ? '#fbbf24'
        : lineColor

  return (
    <div className="flex-1 overflow-hidden border-b border-stone-800 bg-[#1a1a1a] px-5 py-4">
      <div className="flex h-full flex-col justify-between">
        <div className="flex items-center justify-between">
          {description ? (
            <InfoTooltip
              term={label}
              description={description}
              textClassName="text-[10px] font-bold uppercase tracking-widest text-stone-500 hover:text-orange-200"
            >
              {label}
            </InfoTooltip>
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
              {label}
            </span>
          )}

          <span style={{ color: dynamicColor }} className="text-xs">
            {trend === 'up' ? '↑' : '↓'}
          </span>
        </div>

        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="font-mono text-3xl font-black tracking-tight text-orange-200">
            {displayValue}
          </span>
          <span className="font-mono text-xs uppercase text-stone-500">{unit}</span>
        </div>

        <div className="mt-1">
          <Sparkline series={liveSeries} color={dynamicColor} />
        </div>

        {typeof thresholdPct === 'number' && (
          <div className="mt-2 h-0.5 w-full bg-stone-800">
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

        <div className={`mt-1 flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest ${alertColor}`}>
          <span>{trend === 'up' ? '▲' : '▼'}</span>
          <span>{alert}</span>
        </div>
      </div>
    </div>
  )
}
