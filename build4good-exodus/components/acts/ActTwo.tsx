'use client'

import { useEffect } from 'react'
import { getPlanetTextureSource } from '@/components/exoplanets/planetTextures'
import { MissionNav } from '@/components/layout/MissionNav'
import { SideNav } from '@/components/layout/SideNav'
import { FilterPanel } from '@/components/exoplanets/FilterPanel'
import { PlanetDetail } from '@/components/exoplanets/PlanetDetail'
import { StarField } from '@/components/three/StarField'
import { PlanetMesh } from '@/components/three/PlanetMesh'
import { useAppStore } from '@/store/useAppStore'
import type { Planet } from '@/store/useAppStore'

type Act = 'earth' | 'exoplanet' | 'launch'
const VISIBLE_PLANET_LIMIT = 10

function hashPlanetId(planetId: string) {
  let hash = 2166136261

  for (let index = 0; index < planetId.length; index += 1) {
    hash ^= planetId.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

function seededUnit(seed: number, offset: number) {
  const value = Math.sin((seed + offset) * 12.9898) * 43758.5453
  return value - Math.floor(value)
}

// Convert RA/Dec into a wider 3D distribution so the visible set stays readable.
function planetPosition(planet: Planet, index: number): [number, number, number] {
  const seed = hashPlanetId(planet.id)
  const angleJitter = (seededUnit(seed, 1) - 0.5) * 0.9
  const radiusJitter = (seededUnit(seed, 2) - 0.5) * 7
  const xStretch = 0.75 + seededUnit(seed, 3) * 0.65
  const zStretch = 0.75 + seededUnit(seed, 4) * 0.7
  const xDrift = (seededUnit(seed, 5) - 0.5) * 4.5
  const zDrift = (seededUnit(seed, 6) - 0.5) * 5.5
  const yJitter = (seededUnit(seed, 7) - 0.5) * 6
  const angle = (index / VISIBLE_PLANET_LIMIT) * Math.PI * 2 + (planet.ra / 360) * 0.35 + angleJitter
  const ring = Math.floor(index / 5)
  const radius = (ring === 0 ? 15 : 24) + radiusJitter
  const verticalBand = ring === 0 ? 4.5 : -4.5
  const verticalOffset = (planet.dec / 90) * 1.8 + yJitter

  return [
    Math.cos(angle) * radius * xStretch + xDrift,
    verticalBand + verticalOffset,
    Math.sin(angle) * radius * zStretch + zDrift,
  ]
}

// Color by temperature
function tempToColor(temp: number): string {
  if (temp < 220) return '#88ccff'
  if (temp < 260) return '#aaddcc'
  if (temp < 300) return '#88ee88'
  if (temp < 320) return '#ffdd88'
  return '#ff8866'
}

export default function ActTwo({ onNavigate, onSelectDestination }: {
  onNavigate: (act: Act) => void
  onSelectDestination: () => void
}) {
  const { planets, setPlanets, selectedPlanet, setSelectedPlanet, filters } = useAppStore()

  useEffect(() => {
    fetch('/api/planets')
      .then(r => r.json())
      .then((payload: { data: Planet[] }) => setPlanets(payload.data))
      .catch(() => {/* fallback mock already in store if needed */})
  }, [setPlanets])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedPlanet(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setSelectedPlanet])

  const filteredPlanets = planets.filter(p =>
    p.cvi >= filters.cvi &&
    p.radius <= filters.radius &&
    p.distanceLy <= filters.distanceLy
  ).slice(0, VISIBLE_PLANET_LIMIT)

  return (
    <div className="w-full h-screen bg-[#0e0e0e] flex flex-col overflow-hidden">
      <MissionNav activeAct="exoplanet" onNavigate={onNavigate} />
      <div className="flex flex-1 overflow-hidden pt-[60px]">
        <SideNav />
        <FilterPanel />
        <div className="flex-1 h-full relative">
          <StarField>
            {filteredPlanets.map((planet, i) => (
              <PlanetMesh
                key={planet.id}
                position={planetPosition(planet, i)}
                radius={Math.max(0.4, planet.radius * 0.8)}
                color={tempToColor(planet.temp)}
                textureUrl={getPlanetTextureSource(planet.id, i)}
                isSelected={selectedPlanet?.id === planet.id}
                label={planet.name}
                onClick={() => setSelectedPlanet(planet)}
              />
            ))}
          </StarField>

          {/* HUD overlays */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 px-2 py-1 bg-neutral-800/80 border-l-2 border-rose-300 pointer-events-none">
            <span className="text-rose-100 text-[10px] font-mono">
              {filteredPlanets.length} CANDIDATES IDENTIFIED
            </span>
          </div>
          {selectedPlanet && (
            <>
              <div className="absolute top-6 right-6 z-10">
                <button
                  type="button"
                  onClick={() => setSelectedPlanet(null)}
                  className="border border-stone-700 bg-neutral-900/85 px-3 py-2 text-[10px] font-mono uppercase tracking-[0.2em] text-stone-200 transition-colors hover:border-rose-300 hover:text-white"
                >
                  Esc Reset View
                </button>
              </div>
              <div className="absolute bottom-6 right-1/3 px-2 py-1 bg-neutral-800/80 border-r-2 border-emerald-500 pointer-events-none">
                <span className="text-emerald-400 text-[10px] font-mono">
                  CVI: {selectedPlanet.cvi}% — {selectedPlanet.name.toUpperCase()}
                </span>
              </div>
            </>
          )}
        </div>
        <PlanetDetail onSelectDestination={onSelectDestination} />
      </div>
    </div>
  )
}
