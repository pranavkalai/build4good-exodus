'use client'

import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere, Html } from '@react-three/drei'
import * as THREE from 'three'

interface PlanetMeshProps {
  position: [number, number, number]
  radius: number
  color: string
  isSelected: boolean
  label?: string
  onClick: () => void
}

export function PlanetMesh({ position, radius, color, isSelected, label, onClick }: PlanetMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.1
    }
  })

  return (
    <group position={position}>
      <Sphere
        ref={meshRef}
        args={[radius, 32, 32]}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          color={color}
          roughness={0.8}
          metalness={0.1}
          emissive={color}
          emissiveIntensity={isSelected ? 0.15 : hovered ? 0.1 : 0.05}
        />
      </Sphere>

      {/* Selection ring */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius * 1.3, radius * 1.4, 64]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Label */}
      {(isSelected || hovered) && label && (
        <Html position={[radius + 0.5, radius + 0.5, 0]} center={false}>
          <div className="text-[10px] font-mono text-white whitespace-nowrap bg-neutral-900/80 px-2 py-0.5 border-l border-rose-300">
            {label}
          </div>
        </Html>
      )}
    </group>
  )
}