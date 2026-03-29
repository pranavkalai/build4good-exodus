'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'

const MS_PER_YEAR = 5000
const SIM_DAYS_PER_YEAR = 365
const SIM_MONTHS_PER_YEAR = 12
const SIM_DAYS_PER_MONTH = Math.floor(SIM_DAYS_PER_YEAR / SIM_MONTHS_PER_YEAR)
const SIM_HOURS_PER_DAY = 24
const SIM_MINUTES_PER_HOUR = 60
const SIM_SECONDS_PER_MINUTE = 60

export function BottomBar({ onInitiate }: { onInitiate: () => void }) {
  const { timeToBreachYears, breachingParam, tickYear, setEarthHeatLevel, earthHeatLevel } = useAppStore()

  const [totalMs, setTotalMs] = useState<number | null>(null)
  const [initialMs, setInitialMs] = useState<number | null>(null)

  // 🔗 sync backend years → ms countdown
  useEffect(() => {
    if (timeToBreachYears === null) return

    const nextTotalMs = timeToBreachYears * MS_PER_YEAR
    setTotalMs(nextTotalMs)
    setInitialMs(nextTotalMs)
    setEarthHeatLevel(0)
  }, [setEarthHeatLevel, timeToBreachYears])

  // ⏱ smooth countdown (like your teammate’s)
  useEffect(() => {
    if (totalMs === null || totalMs <= 0) return

    const interval = setInterval(() => {
      setTotalMs(prev => {
        if (prev === null || prev <= 0) return prev
        return Math.max(0, prev - 10)
      })
    }, 10)

    return () => clearInterval(interval)
  }, [totalMs])

  // 🧠 trigger "year tick" separately (slower)
  useEffect(() => {
    if (timeToBreachYears === null) return

    const interval = setInterval(() => {
      tickYear()
    }, 5000) // 1 year = 5 seconds

    return () => clearInterval(interval)
  }, [timeToBreachYears, tickYear])

  useEffect(() => {
    if (totalMs === null || initialMs === null || initialMs <= 0) {
      setEarthHeatLevel(0)
      return
    }

    const warmupStartRatio = 0.35
    const remainingRatio = totalMs / initialMs
    const heatLevel =
      remainingRatio > warmupStartRatio
        ? 0
        : Math.min(1, (warmupStartRatio - remainingRatio) / warmupStartRatio)

    setEarthHeatLevel(heatLevel)
  }, [initialMs, setEarthHeatLevel, totalMs])

  const isExpired = totalMs === 0

  const countdownLabel = formatSimulatedCountdown(totalMs)
  const buttonFlashDuration = `${Math.max(0.75, 4.2 - earthHeatLevel * 3.3)}s`

  return (
    <div className="h-[60px] px-6 bg-[#171717] border-t border-stone-800 flex items-center justify-between shrink-0 relative overflow-hidden">
      
      {/* glow fx */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-400/75 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-[20px] bg-gradient-to-t from-rose-500/20 via-rose-500/8 to-transparent blur-md pointer-events-none" />

      {/* left info */}
      <div className="text-[10px] text-rose-300/50 font-mono leading-5">
        <div>EXTINCTION EVENT HORIZON</div>
        <div className={`font-bold ${isExpired ? 'text-rose-500 animate-pulse' : 'text-rose-300/50'}`}>
          {isExpired
            ? `▲ THRESHOLD BREACHED: ${breachingParam ?? 'UNKNOWN'}`
            : `FIRST BREACH: ${breachingParam ?? 'CALCULATING...'}`}
        </div>
      </div>

      {/* center timer */}
      <div className={`text-4xl font-black tabular-nums tracking-wider font-mono transition-colors ${
        isExpired
          ? 'text-rose-600 animate-pulse'
          : totalMs !== null && totalMs < 10000
          ? 'text-amber-400'
          : 'text-rose-400'
      }`}>
        {totalMs === null
          ? 'CALCULATING...'
          : isExpired
          ? 'THRESHOLD BREACHED'
          : countdownLabel}
      </div>

      {/* buttons */}
      <div className="flex gap-2">
        <button
          onClick={onInitiate}
          className={`border text-sm font-black uppercase tracking-[0.28em] transition-colors ${
            earthHeatLevel > 0 ? 'earth-urgent-flash' : ''
          } ${
            isExpired
              ? 'border-rose-500 bg-rose-950/70 text-rose-100'
              : 'border-rose-400/70 bg-stone-950/70 text-stone-100 hover:bg-stone-800'
          }`}
          style={{
            padding: '0.95rem 1.85rem',
            boxShadow: `0 0 ${18 + earthHeatLevel * 26}px rgba(244, 63, 94, ${0.12 + earthHeatLevel * 0.28})`,
            animationDuration: buttonFlashDuration,
          }}
        >
          INITIATE EXODUS
        </button>
      </div>
    </div>
  )
}

function formatSimulatedCountdown(totalMs: number | null) {
  if (totalMs === null) {
    return 'CALCULATING...'
  }

  const remainingYears = totalMs / MS_PER_YEAR
  let remainingSeconds = Math.floor(
    remainingYears *
      SIM_DAYS_PER_YEAR *
      SIM_HOURS_PER_DAY *
      SIM_MINUTES_PER_HOUR *
      SIM_SECONDS_PER_MINUTE,
  )

  const years = Math.floor(remainingSeconds / secondsPerYear())
  remainingSeconds -= years * secondsPerYear()

  const months = Math.floor(remainingSeconds / secondsPerMonth())
  remainingSeconds -= months * secondsPerMonth()

  const days = Math.floor(remainingSeconds / secondsPerDay())
  remainingSeconds -= days * secondsPerDay()

  const hours = Math.floor(remainingSeconds / secondsPerHour())
  remainingSeconds -= hours * secondsPerHour()

  const minutes = Math.floor(remainingSeconds / secondsPerMinute())
  remainingSeconds -= minutes * secondsPerMinute()

  const seconds = remainingSeconds

  return `${years}YR ${fmtUnit(months)}MO ${fmtUnit(days)}D ${fmtUnit(hours)}H ${fmtUnit(minutes)}MIN ${fmtUnit(seconds)}S`
}

function fmtUnit(value: number) {
  return String(value).padStart(2, '0')
}

function secondsPerYear() {
  return SIM_DAYS_PER_YEAR * SIM_HOURS_PER_DAY * SIM_MINUTES_PER_HOUR * SIM_SECONDS_PER_MINUTE
}

function secondsPerMonth() {
  return SIM_DAYS_PER_MONTH * SIM_HOURS_PER_DAY * SIM_MINUTES_PER_HOUR * SIM_SECONDS_PER_MINUTE
}

function secondsPerDay() {
  return SIM_HOURS_PER_DAY * SIM_MINUTES_PER_HOUR * SIM_SECONDS_PER_MINUTE
}

function secondsPerHour() {
  return SIM_MINUTES_PER_HOUR * SIM_SECONDS_PER_MINUTE
}

function secondsPerMinute() {
  return SIM_SECONDS_PER_MINUTE
}
