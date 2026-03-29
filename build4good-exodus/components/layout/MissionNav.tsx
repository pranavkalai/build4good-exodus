'use client'

import { Rocket } from 'lucide-react'

type Act = 'earth' | 'exoplanet' | 'launch'

export function MissionNav({ activeAct, onNavigate }: {
  activeAct: Act
  onNavigate?: (act: Act) => void
}) {
  const titles: Record<Act, string> = {
    earth: 'EARTH STATUS',
    exoplanet: 'EXOPLANET SEARCH',
    launch: 'LAUNCH SEQUENCE',
  }
  const navItems: Act[] = ['earth', 'exoplanet', 'launch']

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-[60px] px-6 bg-[#171717]/90 backdrop-blur-md border-b border-rose-500/20 flex justify-between items-center overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-400/75 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-[20px] bg-gradient-to-b from-rose-500/20 via-rose-500/8 to-transparent blur-md pointer-events-none" />
      <span className="text-rose-500 text-lg font-black uppercase tracking-widest">
        OPERATION EXODUS
      </span>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="flex items-center gap-8 pointer-events-auto">
          {navItems.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onNavigate?.(item)}
              className={`border-b-2 pb-1 text-xs font-bold uppercase tracking-widest transition-colors ${
                activeAct === item
                  ? 'border-rose-300 text-rose-300'
                  : 'border-transparent text-neutral-600 hover:text-neutral-400'
              }`}
            >
              {titles[item]}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center text-rose-300/85">
        <Rocket className="h-5 w-5" strokeWidth={2.2} />
      </div>
    </nav>
  )
}
