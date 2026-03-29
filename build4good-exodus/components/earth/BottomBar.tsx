'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'

export function BottomBar({ onInitiate }: { onInitiate: () => void }) {
  const { timeToBreachYears, breachingParam, tickYear } = useAppStore()

  const [totalMs, setTotalMs] = useState<number | null>(null)

  // 🔗 sync backend years → ms countdown
  useEffect(() => {
    if (timeToBreachYears === null) return

    // 1 year = 5 seconds (tweak this for pacing)
    const MS_PER_YEAR = 5000

    setTotalMs(timeToBreachYears * MS_PER_YEAR)
  }, [timeToBreachYears])

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
  }, [timeToBreachYears])

  const isExpired = totalMs === 0

  // ⏱ format cinematic timer
  const h = Math.floor((totalMs ?? 0) / 3600000)
  const m = Math.floor(((totalMs ?? 0) % 3600000) / 60000)
  const s = Math.floor(((totalMs ?? 0) % 60000) / 1000)
  const ms = Math.floor(((totalMs ?? 0) % 1000) / 10)

  const fmt = (n: number) => String(n).padStart(2, '0')

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
          : `${fmt(h)}:${fmt(m)}:${fmt(s)}:${fmt(ms)}`}
      </div>

      {/* buttons */}
      <div className="flex gap-2">
        <button
          onClick={onInitiate}
          className="px-5 py-2 border border-stone-600 text-stone-200 text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition-colors"
        >
          INITIATE EXODUS
        </button>
        <button className="px-5 py-2 border border-stone-800 text-stone-600 text-xs font-bold uppercase tracking-widest hover:bg-stone-900 transition-colors">
          OVERRIDE
        </button>
      </div>
    </div>
  )
}