'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'

const GUIDE_SEEN_SESSION_KEY = 'operation-exodus-guide-seen'

const INSTRUCTIONS = [
  {
    part: '01',
    title: 'EARTH IS DYING',
    content: `You are on the Mission Control dashboard. Earth's climate is deteriorating in real time using NASA POWER data and linear regression projections. Watch the stat cards on the right — each one shows a projected future value based on 10 years of real climate data. The countdown timer at the bottom shows how many years until the first critical threshold is breached. When it hits zero, it's too late.`,
  },
  {
    part: '02',
    title: 'FIND A NEW HOME',
    content: `Navigate to EXOPLANET SEARCH using the top nav or click INITIATE EXODUS. You'll see a 3D star field populated with real exoplanet candidates from the NASA Exoplanet Archive. Click any planet to lock it as your target. The right panel shows a radar chart comparing the planet's stats directly against Earth's baseline — temperature, radius, mass, orbital period, and distance. Use the Earth Baseline panel on the left as your reference. Find the best match.`,
  },
  {
    part: '03',
    title: 'CONFIRM THE MISSION',
    content: `Once you've selected a destination, click SELECT AS DESTINATION to proceed to LAUNCH SEQUENCE. Here you'll see the orbital trajectory map, the live telemetry dial showing launch window viability, and your mission summary. The AI mission log initializes automatically. When you're ready, hit CONFIRM LAUNCH. Your Colonial Viability Index score is revealed — this is the final verdict on whether humanity survives.`,
  },
]

const DEVPOST_CRITERIA = [
  {
    criterion: 'DATASET CHOICE',
    requirement: 'Choose any dataset from NASA\'s open data portal',
    response: 'We use two NASA datasets — the NASA Exoplanet Archive TAP API for all exoplanet candidate data, and NASA POWER for 10 years of real Earth climate measurements including temperature, precipitation, humidity, wind speed, and solar radiation.',
  },
  {
    criterion: 'ANALYSIS',
    requirement: 'Analyze it — find something interesting, unexpected, or underreported',
    response: 'We run linear regression on all five NASA POWER climate parameters to compute real trend slopes. These slopes project each parameter forward and calculate exactly when Earth\'s climate crosses a critical threshold — giving a scientifically grounded countdown to uninhabitability.',
  },
  {
    criterion: 'VISUALIZATION',
    requirement: 'Build a visual representation that communicates your finding clearly',
    response: 'We built a Three.js exoplanet star field, live sparkline charts for each climate parameter, a radar comparison chart between Earth and any selected planet, an SVG orrery showing the launch trajectory, and a telemetry dial for launch window viability.',
  },
  {
    criterion: 'ACCESSIBILITY',
    requirement: 'Make it accessible to someone with no background in space or science',
    response: 'Every technical term has an inline tooltip explaining it in plain language. The radar chart makes planet comparison intuitive — no numbers needed. The narrative framing (Earth is dying, find a new home) gives non-scientists an immediate emotional hook to engage with the data.',
  },
  {
    criterion: 'STORYTELLING',
    requirement: 'Does it feel like a discovery, not just a chart?',
    response: 'The app is structured as three acts: dread (watch Earth deteriorate), hope (search for a new home), and decision (confirm the mission). The CVI score is withheld until Act 3 as a final reveal. The AI mission log, cinematic launch sequence, and countdown timer all serve the narrative arc.',
  },
]

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const panelVariants = {
  hidden: { x: -40, opacity: 0, scale: 0.97 },
  visible: { x: 0, opacity: 1, scale: 1, transition: { type: 'spring', damping: 22, stiffness: 280 } },
  exit: { x: -30, opacity: 0, scale: 0.97, transition: { duration: 0.18 } },
}

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.07 + 0.15, duration: 0.25 },
  }),
}

function InstructionsPopup({ onClose }: { onClose: () => void }) {
  const [activePart, setActivePart] = useState<number>(0)

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        className="relative z-10 w-[520px] bg-[#0e0e0e]/95 border border-rose-500/30 shadow-[0_0_60px_rgba(244,63,94,0.15)] overflow-hidden"
        variants={panelVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Top glow line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-400/80 to-transparent" />

        {/* Header */}
        <div className="px-6 py-4 border-b border-rose-500/20 flex items-center justify-between">
          <div>
            <span className="text-rose-300 text-xs font-black uppercase tracking-[0.2em]">
              MISSION BRIEFING
            </span>
            <div className="text-[9px] font-mono text-stone-600 uppercase tracking-wider mt-0.5">
              OPERATION EXODUS — FIELD GUIDE
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-600 hover:text-rose-300 text-lg leading-none transition-colors font-mono"
          >
            ✕
          </button>
        </div>

        {/* Part tabs */}
        <div className="flex border-b border-stone-800">
          {INSTRUCTIONS.map((inst, i) => (
            <button
              key={inst.part}
              onClick={() => setActivePart(i)}
              className={`flex-1 py-2.5 text-[9px] font-black uppercase tracking-[0.15em] transition-all relative ${
                activePart === i ? 'text-rose-300 bg-stone-900/60' : 'text-stone-600 hover:text-stone-400'
              }`}
            >
              {activePart === i && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-px bg-rose-400"
                  layoutId="activeTab"
                  style={{ boxShadow: '0 0 6px rgba(244,63,94,0.8)' }}
                />
              )}
              PART {inst.part}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activePart}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="px-6 py-5"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="text-4xl font-black text-stone-800 font-mono leading-none shrink-0">
                {INSTRUCTIONS[activePart].part}
              </div>
              <div>
                <h3 className="text-white text-lg font-black uppercase tracking-tight">
                  {INSTRUCTIONS[activePart].title}
                </h3>
                <div className="w-8 h-px bg-rose-500/60 mt-1.5" style={{ boxShadow: '0 0 6px rgba(244,63,94,0.6)' }} />
              </div>
            </div>
            <p className="text-stone-400 text-sm leading-relaxed font-mono">
              {INSTRUCTIONS[activePart].content}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Footer nav */}
        <div className="px-6 py-4 border-t border-stone-800 flex justify-between items-center">
          <button
            onClick={() => setActivePart(p => Math.max(0, p - 1))}
            disabled={activePart === 0}
            className="text-[9px] font-black uppercase tracking-widest text-stone-600 hover:text-stone-300 disabled:opacity-20 transition-colors font-mono"
          >
            ← PREV
          </button>
          <div className="flex gap-1.5">
            {INSTRUCTIONS.map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full transition-all"
                style={{
                  backgroundColor: activePart === i ? '#f43f5e' : '#3f3f46',
                  boxShadow: activePart === i ? '0 0 6px rgba(244,63,94,0.8)' : 'none',
                }}
              />
            ))}
          </div>
          <button
            onClick={() =>
              activePart < INSTRUCTIONS.length - 1 ? setActivePart(p => p + 1) : onClose()
            }
            className="text-[9px] font-black uppercase tracking-widest text-rose-400 hover:text-rose-200 transition-colors font-mono"
          >
            {activePart < INSTRUCTIONS.length - 1 ? 'NEXT →' : 'LAUNCH ↗'}
          </button>
        </div>

        {/* Bottom glow */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-rose-400/40 to-transparent" />
      </motion.div>
    </motion.div>
  )
}

function DevpostPopup({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        className="relative z-10 w-[560px] max-h-[80vh] bg-[#0e0e0e]/95 border border-emerald-500/30 shadow-[0_0_60px_rgba(16,185,129,0.12)] overflow-hidden flex flex-col"
        variants={panelVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent" />

        {/* Header */}
        <div className="px-6 py-4 border-b border-emerald-500/20 flex items-center justify-between shrink-0">
          <div>
            <span className="text-emerald-400 text-xs font-black uppercase tracking-[0.2em]">
              DEVPOST SUBMISSION
            </span>
            <div className="text-[9px] font-mono text-stone-600 uppercase tracking-wider mt-0.5">
              SPACE DATA VISUALIZATION TRACK
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-600 hover:text-emerald-400 text-lg leading-none transition-colors font-mono"
          >
            ✕
          </button>
        </div>

        {/* Project title */}
        <div className="px-6 py-4 border-b border-stone-800 bg-stone-900/30 shrink-0">
          <h2 className="text-white text-2xl font-black uppercase tracking-tight">
            OPERATION EXODUS
          </h2>
          <p className="text-stone-500 text-[11px] font-mono mt-1 leading-4">
            A narrative data visualization that uses real NASA climate and exoplanet data to tell the story of humanity's search for a new home.
          </p>
        </div>

        {/* Criteria list */}
        <div className="overflow-y-auto flex-1 divide-y divide-stone-800/60">
          {DEVPOST_CRITERIA.map((item, i) => (
            <motion.div
              key={item.criterion}
              custom={i}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="px-6 py-4 hover:bg-stone-900/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-5 h-5 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5"
                  style={{ boxShadow: '0 0 8px rgba(16,185,129,0.2)' }}
                >
                  <span className="text-emerald-400 text-[9px] font-black">✓</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                      {item.criterion}
                    </span>
                  </div>
                  <div className="text-stone-600 text-[9px] font-mono uppercase tracking-wider mb-1.5 italic">
                    "{item.requirement}"
                  </div>
                  <p className="text-stone-300 text-[11px] font-mono leading-4">{item.response}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
      </motion.div>
    </motion.div>
  )
}

export function SideNav() {
  const [openPanel, setOpenPanel] = useState<'instructions' | 'devpost' | null>(null)
  const setTimerPaused = useAppStore((state) => state.setTimerPaused)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const hasSeenGuide = window.sessionStorage.getItem(GUIDE_SEEN_SESSION_KEY) === 'true'

    if (!hasSeenGuide) {
      setOpenPanel('instructions')
      window.sessionStorage.setItem(GUIDE_SEEN_SESSION_KEY, 'true')
    }
  }, [])

  useEffect(() => {
    setTimerPaused(openPanel !== null)

    return () => {
      setTimerPaused(false)
    }
  }, [openPanel, setTimerPaused])

  const toggle = (panel: 'instructions' | 'devpost') => {
    setOpenPanel(prev => (prev === panel ? null : panel))
  }

  return (
    <>
      <div className="w-[60px] h-full bg-[#171717] border-r border-neutral-800 flex flex-col items-center py-4 gap-2 shrink-0">
        {/* Instructions button */}
        <button
          onClick={() => toggle('instructions')}
          className={`w-full py-3 flex flex-col items-center gap-1 cursor-pointer relative transition-colors ${
            openPanel === 'instructions' ? 'bg-stone-900' : 'hover:bg-neutral-800/40'
          }`}
        >
          {openPanel === 'instructions' && (
            <div
              className="absolute left-0 top-0 bottom-0 w-[3px] bg-rose-300"
              style={{ boxShadow: '2px 0 8px rgba(244,63,94,0.6)' }}
            />
          )}
          <span className={`text-base ${openPanel === 'instructions' ? 'text-rose-300' : 'text-neutral-600'}`}>
            ?
          </span>
          <span
            className={`text-[7px] font-bold uppercase tracking-wider ${
              openPanel === 'instructions' ? 'text-rose-300' : 'text-neutral-600'
            }`}
          >
            GUIDE
          </span>
        </button>

        {/* Devpost button */}
        <button
          onClick={() => toggle('devpost')}
          className={`w-full py-3 flex flex-col items-center gap-1 cursor-pointer relative transition-colors ${
            openPanel === 'devpost' ? 'bg-stone-900' : 'hover:bg-neutral-800/40'
          }`}
        >
          {openPanel === 'devpost' && (
            <div
              className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-400"
              style={{ boxShadow: '2px 0 8px rgba(16,185,129,0.6)' }}
            />
          )}
          <span className={`text-base ${openPanel === 'devpost' ? 'text-emerald-400' : 'text-neutral-600'}`}>✦</span>
          <span
            className={`text-[7px] font-bold uppercase tracking-wider ${
              openPanel === 'devpost' ? 'text-emerald-400' : 'text-neutral-600'
            }`}
          >
            POST
          </span>
        </button>
      </div>

      <AnimatePresence>
        {openPanel === 'instructions' && <InstructionsPopup onClose={() => setOpenPanel(null)} />}
        {openPanel === 'devpost' && <DevpostPopup onClose={() => setOpenPanel(null)} />}
      </AnimatePresence>
    </>
  )
}
