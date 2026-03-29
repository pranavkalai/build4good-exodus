'use client'
import { useAppStore } from '@/store/useAppStore'

export function FilterPanel() {
  const { filters, setFilter } = useAppStore()

  return (
    <div className="w-[240px] shrink-0 h-full bg-stone-900/60 border-r border-stone-800 backdrop-blur-md flex flex-col p-6 gap-8 overflow-hidden">
      <div>
        <div className="text-rose-100/60 text-xs font-bold uppercase tracking-wider">System Filters</div>
        <div className="text-stone-500 text-[10px] font-mono mt-0.5">CRITERIA PARAMETERS</div>
      </div>

      <div className="flex flex-col gap-7">
        <FilterSlider
          label="Min CVI Score"
          value={filters.cvi}
          display={`${filters.cvi}%`}
          displayColor="text-emerald-400"
          min={0} max={100}
          onChange={v => setFilter('cvi', v)}
        />
        <FilterSlider
          label="Max Planet Size"
          value={filters.radius}
          display={`${filters.radius}x Earth`}
          displayColor="text-orange-200"
          min={0.5} max={2} step={0.1}
          onChange={v => setFilter('radius', v)}
        />
        <FilterSlider
          label="Max Distance (LY)"
          value={filters.distanceLy}
          display={`${(filters.distanceLy / 1000).toFixed(1)}K`}
          displayColor="text-rose-300"
          min={0} max={5000} step={100}
          onChange={v => setFilter('distanceLy', v)}
        />
      </div>

      <div className="flex-1" />

      <div className="border-t border-stone-800 pt-4">
        <div className="p-3 bg-neutral-700/30">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-stone-400 text-[10px] font-bold uppercase tracking-wider">Scanner Online</span>
          </div>
          <p className="text-stone-500/60 text-[9px] font-mono leading-3 uppercase">
            MAPPING SECTOR 7-G ALPHA RADIUS.<br />
            42 POTENTIAL CANDIDATES FOUND.
          </p>
        </div>
      </div>
    </div>
  )
}

function FilterSlider({ label, value, display, displayColor, min, max, step = 1, onChange }: {
  label: string; value: number; display: string; displayColor: string
  min: number; max: number; step?: number; onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <span className="text-stone-200 text-[10px] font-bold uppercase tracking-wide">{label}</span>
        <span className={`text-xs font-mono ${displayColor}`}>{display}</span>
      </div>
      <div className="relative h-0.5 bg-stone-700">
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-4 -top-1.5"
        />
        <div className="absolute left-0 top-0 h-full bg-rose-300/40"
          style={{ width: `${((value - min) / (max - min)) * 100}%` }} />
        <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-rose-300"
          style={{ left: `calc(${((value - min) / (max - min)) * 100}% - 6px)` }} />
      </div>
    </div>
  )
}