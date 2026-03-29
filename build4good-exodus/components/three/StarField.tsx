'use client'

import { Canvas } from '@react-three/fiber'
import { Stars, OrbitControls } from '@react-three/drei'

export function StarField({ children }: { children?: React.ReactNode }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 30], fov: 60 }}
      style={{ background: 'transparent' }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1.5} />
      <Stars radius={200} depth={60} count={5000} factor={3} fade speed={0.5} />
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        zoomSpeed={0.4}
        rotateSpeed={0.3}
        minDistance={15}
        maxDistance={80}
      />
      {children}
    </Canvas>
  )
}