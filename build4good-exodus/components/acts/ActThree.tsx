'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { MissionNav } from '@/components/layout/MissionNav'
import { SideNav } from '@/components/layout/SideNav'
import { OrbitalMap } from '@/components/launch/OrbitalMap'
import {
  ARMING_DURATION_MS,
  FLIGHT_DURATION_MS,
  TOTAL_LAUNCH_DURATION_MS,
  type LaunchState,
} from '@/components/launch/launchAnimation'
import { useAppStore } from '@/store/useAppStore'

type Act = 'earth' | 'exoplanet' | 'launch'

export default function ActThree({ onNavigate }: { onNavigate: (act: Act) => void }) {
  const selectedPlanet = useAppStore((state) => state.selectedPlanet)
  const [launchState, setLaunchState] = useState<LaunchState>('idle')
  const [progress, setProgress] = useState(0)
  const launchStartTimeRef = useRef<number | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  const stopAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }, [])

  const resetLaunch = useCallback(() => {
    stopAnimation()
    launchStartTimeRef.current = null
    setLaunchState('idle')
    setProgress(0)
  }, [stopAnimation])

  useEffect(() => {
    resetLaunch()
  }, [resetLaunch, selectedPlanet?.id])

  useEffect(() => () => stopAnimation(), [stopAnimation])

  const beginLaunch = useCallback(() => {
    if (!selectedPlanet) return

    stopAnimation()
    setLaunchState('arming')
    setProgress(0)
    launchStartTimeRef.current = null

    const tick = (timestamp: number) => {
      if (launchStartTimeRef.current === null) {
        launchStartTimeRef.current = timestamp
      }

      const elapsed = timestamp - launchStartTimeRef.current

      if (elapsed < ARMING_DURATION_MS) {
        setLaunchState('arming')
        setProgress(0)
        animationFrameRef.current = requestAnimationFrame(tick)
        return
      }

      const flightElapsed = elapsed - ARMING_DURATION_MS
      const nextProgress = Math.min(flightElapsed / FLIGHT_DURATION_MS, 1)

      setLaunchState(nextProgress >= 1 ? 'arrived' : 'inFlight')
      setProgress(nextProgress)

      if (elapsed < TOTAL_LAUNCH_DURATION_MS) {
        animationFrameRef.current = requestAnimationFrame(tick)
        return
      }

      animationFrameRef.current = null
    }

    animationFrameRef.current = requestAnimationFrame(tick)
  }, [selectedPlanet, stopAnimation])

  return (
    <div className="w-full h-screen bg-[#171717] flex flex-col overflow-hidden">
      <MissionNav activeAct="launch" onNavigate={onNavigate} />
      <div className="flex flex-1 overflow-hidden pt-[60px]">
        <SideNav />
        <div className="flex h-full min-w-0 flex-1 flex-col">
          <OrbitalMap
            planet={selectedPlanet}
            launchState={launchState}
            progress={progress}
            onLaunch={beginLaunch}
            onReplay={resetLaunch}
            onSelectNew={() => onNavigate('exoplanet')}
          />
        </div>
      </div>
    </div>
  )
}
