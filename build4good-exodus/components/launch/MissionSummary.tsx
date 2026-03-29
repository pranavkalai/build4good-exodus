'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'

const LOG_LINES = [
  '> Initializing Cryo-pods (Units 1-400)... OK',
  '> Gravitational Slingshot mapped... OK',
  '> Life Support redundancy confirmed... OK',
  '> Waiting for final authorization...',
]

export function MissionSummary() {
  const planet = useAppStore(s => s.selectedPlanet)
  const [visibleLines, setVisibleLines] = useState<string[]>([])
  const [launched, setLaunched] = useState(false)

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      if (i < LOG_LINES.length) {
        setVisibleLines(prev => [...prev, LOG_LINES[i]])
        i++
      } else {
        clearInterval(interval)
      }
    }, 800)
    return () => clearInterval(interval)
  }, [])

  if (!planet) return null

  return (
    <div className="flex-1 flex flex-col overflow-hidden border-l border-stone-800">
      {/* Header */}
      <div className="px-4 py-3 border-b border-stone-800 shrink-0">
        <span className="text-rose-300 text-xs font-black uppercase tracking-wider">Mission Summary</span>
      </div>

      <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
        {/* Destination card */}
        <div className="p-4 bg-stone-900 border-l-4 border-orange-200">
          <div className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-2">
            Destination Profile
          </div>
          <div className="flex justify-between items-end">
            <div>
                <div className="text-stone-100 text-xl font-black leading-tight">{planet.name.toUpperCase()}</div>
                <div className="text-orange-200 text-xs mt-0.5">RA {planet.ra.toFixed(1)}° DEC {planet.dec.toFixed(1)}°</div>
            </div>
            <div className="text-right">
              <div className="text-emerald-400 text-lg font-bold">{planet.cvi}%</div>
              <div className="text-stone-500 text-[9px] uppercase font-bold">Habitability</div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-col border border-stone-800 divide-y divide-stone-800">
            <MiniStat label="Distance" value={`${planet.distanceLy.toLocaleString()} LY`} />
            <MiniStat label="CVI Score" value={`${planet.cvi}%`} />
        </div>

        {/* AI Mission Log */}
        <div>
          <div className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-2">
            AI Mission Log [Live]
          </div>
          <div className="bg-stone-950 border border-stone-800 p-3 h-[160px] overflow-hidden relative">
            <div className="flex flex-col gap-1">
              {visibleLines.map((line, i) => (
                <div
                  key={i}
                  className={`text-[10px] font-mono leading-4 ${
                    i === visibleLines.length - 1 && line?.includes('authorization')
                      ? 'text-orange-200'
                      : 'text-emerald-500/70'
                  }`}
                >
                  {line}
                </div>
              ))}
              {visibleLines.length === LOG_LINES.length && (
                <div className="text-orange-200 text-[10px] font-mono mt-2 pt-2 border-t border-stone-800">
                  &gt; STATUS: STANDBY FOR COMMAND
                </div>
              )}
            </div>
            {/* Gradient fade */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-stone-950 to-transparent" />
          </div>
        </div>
      </div>

      {/* Confirm launch button */}
      <div className="p-4 bg-stone-900 border-t border-stone-800 shrink-0 flex flex-col gap-3">
        <button
          onClick={() => setLaunched(true)}
          className={`w-full py-4 font-black text-base uppercase tracking-widest transition-all ${
            launched
              ? 'bg-emerald-700 text-emerald-200 cursor-default'
              : 'bg-emerald-500 text-green-950 hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
          }`}
        >
          {launched ? 'LAUNCHED ✓' : 'CONFIRM LAUNCH'}
        </button>
        <div className="flex items-center justify-center gap-2">
          <div className="w-2.5 h-3 bg-stone-400/40" />
          <span className="text-stone-500 text-[9px] font-bold uppercase tracking-wide">
            Biometric Auth Required
          </span>
        </div>
      </div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-3 bg-stone-900">
      <div className="text-stone-500 text-[9px] font-bold uppercase tracking-wide">{label}</div>
      <div className="text-stone-100 text-lg font-mono mt-0.5">{value}</div>
    </div>
  )
}