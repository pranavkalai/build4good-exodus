'use client'

import { useState } from 'react'
import ActOne from '@/components/acts/ActOne'
import ActTwo from '@/components/acts/ActTwo'
import ActThree from '@/components/acts/ActThree'

type Act = 'earth' | 'exoplanet' | 'launch'

export default function Home() {
  const [act, setAct] = useState<Act>('earth')

  return (
    <main className="w-full h-screen overflow-hidden bg-[#0e0e0e]">
      {act === 'earth' && (
        <ActOne onInitiateExodus={() => setAct('exoplanet')} onNavigate={setAct} />
      )}
      {act === 'exoplanet' && (
        <ActTwo onNavigate={setAct} onSelectDestination={() => setAct('launch')} />
      )}
      {act === 'launch' && (
        <ActThree onNavigate={setAct} />
      )}
    </main>
  )
}
