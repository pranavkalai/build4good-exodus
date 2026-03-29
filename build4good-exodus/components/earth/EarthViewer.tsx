'use client'

import { OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import earthCloudMap from './2k_earth_clouds.jpg'
import earthDayMap from './2k_earth_daymap.jpg'
import earthNightMap from './2k_earth_nightmap.jpg'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

type EarthTextureSet = {
  cloudTexture: THREE.Texture | null
  dayTexture: THREE.Texture | null
  nightTexture: THREE.Texture | null
}

type SurfaceTextureSet = Pick<EarthTextureSet, 'dayTexture' | 'nightTexture'>

const LIGHT_DIRECTION = new THREE.Vector3(1, 0.35, 0.8).normalize()
const ATMOSPHERE_COLOR = new THREE.Color('#4db2ff')
const DEFAULT_CAMERA_POSITION = new THREE.Vector3(0, 0, 5.7)
const EARTH_RADIUS = 1.38
const EARTH_SPIN_SPEED = 0.08
const CLOUD_SPIN_OFFSET = 0.012
const CAMERA_RETURN_DELAY_MS = 2400
const CAMERA_RETURN_STRENGTH = 1.9

const surfaceVertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;

    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`

const surfaceFragmentShader = `
  uniform sampler2D uDayTexture;
  uniform sampler2D uNightTexture;
  uniform vec3 uLightDirection;
  uniform vec3 uAtmosphereColor;

  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 lightDir = normalize(uLightDirection);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);

    float lightAmount = dot(normal, lightDir);
    float daylight = smoothstep(-0.10, 0.30, lightAmount);
    float nightMask = 1.0 - smoothstep(-0.25, 0.18, lightAmount);

    vec3 dayColor = texture2D(uDayTexture, vUv).rgb;
    vec3 nightColor = texture2D(uNightTexture, vUv).rgb * 1.35;

    vec3 baseColor = mix(nightColor * nightMask, dayColor, daylight);

    float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0);
    float specular = pow(max(dot(reflect(-lightDir, normal), viewDir), 0.0), 18.0) * 0.18;

    vec3 finalColor = baseColor;
    finalColor += uAtmosphereColor * fresnel * 0.24;
    finalColor += vec3(1.0, 0.96, 0.92) * specular;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`

const atmosphereVertexShader = `
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`

const atmosphereFragmentShader = `
  uniform vec3 uAtmosphereColor;
  uniform vec3 uLightDirection;

  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - abs(dot(viewDir, normal)), 5.0);
    float sunlight = max(dot(normal, normalize(uLightDirection)), 0.0);

    vec3 color = uAtmosphereColor * (0.8 + sunlight * 1.05);
    gl_FragColor = vec4(color, fresnel);
  }
`

function useEarthTextures() {
  const [textures, setTextures] = useState<EarthTextureSet>({
    cloudTexture: null,
    dayTexture: null,
    nightTexture: null,
  })

  useEffect(() => {
    let isCancelled = false
    const loader = new THREE.TextureLoader()

    const loadTextures = async () => {
      try {
        const [dayTexture, nightTexture, cloudTexture] = await Promise.all([
          loader.loadAsync(earthDayMap.src),
          loader.loadAsync(earthNightMap.src),
          loader.loadAsync(earthCloudMap.src),
        ])

        dayTexture.colorSpace = THREE.SRGBColorSpace
        nightTexture.colorSpace = THREE.SRGBColorSpace
        cloudTexture.colorSpace = THREE.SRGBColorSpace
        dayTexture.needsUpdate = true
        nightTexture.needsUpdate = true
        cloudTexture.needsUpdate = true

        if (isCancelled) {
          dayTexture.dispose()
          nightTexture.dispose()
          cloudTexture.dispose()
          return
        }

        setTextures({ cloudTexture, dayTexture, nightTexture })
      } catch {
        if (!isCancelled) {
          setTextures({ cloudTexture: null, dayTexture: null, nightTexture: null })
        }
      }
    }

    loadTextures()

    return () => {
      isCancelled = true
    }
  }, [])

  return textures
}

function EarthSphere({ dayTexture, nightTexture }: SurfaceTextureSet) {
  const { gl } = useThree()

  useEffect(() => {
    const anisotropy = gl.capabilities.getMaxAnisotropy()

    for (const texture of [dayTexture, nightTexture]) {
      if (!texture) {
        continue
      }

      texture.anisotropy = anisotropy
      texture.needsUpdate = true
    }
  }, [dayTexture, gl, nightTexture])

  if (dayTexture && nightTexture) {
    return (
        <mesh>
        <sphereGeometry args={[EARTH_RADIUS, 128, 128]} />
        <shaderMaterial
          uniforms={{
            uDayTexture: { value: dayTexture },
            uNightTexture: { value: nightTexture },
            uLightDirection: { value: LIGHT_DIRECTION },
            uAtmosphereColor: { value: ATMOSPHERE_COLOR },
          }}
          vertexShader={surfaceVertexShader}
          fragmentShader={surfaceFragmentShader}
        />
      </mesh>
    )
  }

  if (dayTexture) {
    return (
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS, 128, 128]} />
        <meshStandardMaterial
          map={dayTexture}
          roughness={0.95}
          metalness={0.02}
          emissive="#08111d"
          emissiveIntensity={0.18}
        />
      </mesh>
    )
  }

  return (
    <mesh>
      <sphereGeometry args={[EARTH_RADIUS, 128, 128]} />
      <meshStandardMaterial
        color="#4c7691"
        roughness={0.92}
        metalness={0.02}
        emissive="#08111d"
        emissiveIntensity={0.3}
      />
    </mesh>
  )
}

function CloudLayer({ cloudTexture }: { cloudTexture: THREE.Texture | null }) {
  const { gl } = useThree()

  useEffect(() => {
    if (!cloudTexture) {
      return
    }

    cloudTexture.anisotropy = gl.capabilities.getMaxAnisotropy()
    cloudTexture.needsUpdate = true
  }, [cloudTexture, gl])

  if (!cloudTexture) {
    return null
  }

  return (
    <mesh>
      <sphereGeometry args={[EARTH_RADIUS + 0.025, 128, 128]} />
      <meshStandardMaterial
        color="#eefbff"
        alphaMap={cloudTexture}
        transparent
        opacity={0.38}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        roughness={1}
        metalness={0}
        emissive="#8fdfff"
        emissiveIntensity={0.1}
      />
    </mesh>
  )
}

function AtmosphereShell() {
  return (
    <mesh scale={1.12}>
      <sphereGeometry args={[EARTH_RADIUS, 128, 128]} />
      <shaderMaterial
        vertexShader={atmosphereVertexShader}
        fragmentShader={atmosphereFragmentShader}
        uniforms={{
          uAtmosphereColor: { value: ATMOSPHERE_COLOR },
          uLightDirection: { value: LIGHT_DIRECTION },
        }}
        transparent
        depthWrite={false}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

function EarthRig({ cloudTexture, dayTexture, nightTexture }: EarthTextureSet) {
  const spinRef = useRef<THREE.Group>(null)
  const cloudRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (spinRef.current) {
      spinRef.current.rotation.y += delta * EARTH_SPIN_SPEED
    }

    if (cloudRef.current) {
      cloudRef.current.rotation.y += delta * CLOUD_SPIN_OFFSET
    }
  })

  return (
    <group>
      <group ref={spinRef}>
        <EarthSphere dayTexture={dayTexture} nightTexture={nightTexture} />
        <group ref={cloudRef}>
          <CloudLayer cloudTexture={cloudTexture} />
        </group>
      </group>
      <AtmosphereShell />
    </group>
  )
}

function EarthControls() {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const { camera } = useThree()
  const isDraggingRef = useRef(false)
  const lastInteractionAtRef = useRef<number>(Number.NEGATIVE_INFINITY)

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) {
      return
    }

    const handleStart = () => {
      isDraggingRef.current = true
    }

    const handleEnd = () => {
      isDraggingRef.current = false
      lastInteractionAtRef.current = performance.now()
    }

    controls.addEventListener('start', handleStart)
    controls.addEventListener('end', handleEnd)

    return () => {
      controls.removeEventListener('start', handleStart)
      controls.removeEventListener('end', handleEnd)
    }
  }, [])

  useFrame((_, delta) => {
    const controls = controlsRef.current
    if (!controls) {
      return
    }

    if (
      !isDraggingRef.current &&
      performance.now() - lastInteractionAtRef.current > CAMERA_RETURN_DELAY_MS
    ) {
      const easing = 1 - Math.exp(-delta * CAMERA_RETURN_STRENGTH)
      camera.position.lerp(DEFAULT_CAMERA_POSITION, easing)
    }

    controls.update()
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableZoom={false}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.45}
      minDistance={DEFAULT_CAMERA_POSITION.length()}
      maxDistance={DEFAULT_CAMERA_POSITION.length()}
    />
  )
}

function EarthScene() {
  const textures = useEarthTextures()

  return (
    <>
      <ambientLight intensity={0.26} color="#9fc2e8" />
      <hemisphereLight args={['#d7ecff', '#1c1310', 0.85]} />
      <directionalLight position={[5, 1.5, 4]} intensity={2.45} color="#fff4df" />
      <directionalLight position={[-4, -2, -3]} intensity={0.28} color="#5e84b0" />
      <EarthRig {...textures} />
      <EarthControls />
    </>
  )
}

export function EarthViewer() {
  return (
    <div className="flex-1 h-full bg-[#0c0a09] relative flex items-center justify-center overflow-hidden">
      <div className="absolute top-4 left-4 pointer-events-none z-20">
        <div className="border border-cyan-300/40 bg-[#07131b]/80 px-4 py-2 shadow-[0_0_24px_rgba(103,232,249,0.18)] backdrop-blur-sm">
          <div className="font-mono text-[9px] uppercase tracking-[0.45em] text-cyan-300/70">
            Alert Node
          </div>
          <div className="mt-1 font-mono text-sm font-bold uppercase tracking-[0.32em] text-cyan-100">
            Critical Warning
          </div>
        </div>
      </div>

      <div className="absolute w-full h-px bg-rose-300/10 top-1/2 pointer-events-none" />
      <div className="absolute h-full w-px bg-rose-300/10 left-1/2 pointer-events-none" />

      <div className="absolute w-[580px] h-[580px] rounded-full border border-rose-300/15 pointer-events-none" />
      <div className="absolute w-[500px] h-[500px] rounded-full border border-rose-300/10 pointer-events-none" />

      <div className="relative z-10 w-[380px] h-[380px]">
        <div className="absolute inset-0 rounded-full overflow-hidden shadow-[0_0_100px_rgba(239,68,68,0.18)]">
          <Canvas
            camera={{ position: DEFAULT_CAMERA_POSITION.toArray() as [number, number, number], fov: 28 }}
            dpr={[1, 1.75]}
            gl={{ antialias: true, alpha: true }}
          >
            <EarthScene />
          </Canvas>
        </div>

        <div className="absolute inset-0 rounded-full border border-rose-300/10 pointer-events-none" />

        <div
          className="absolute inset-0 rounded-full border-2 border-rose-500/30 scale-110 animate-ping pointer-events-none"
          style={{ animationDuration: '2.5s' }}
        />
        <div
          className="absolute inset-0 rounded-full border border-rose-500/15 scale-125 animate-ping pointer-events-none"
          style={{ animationDuration: '2.5s', animationDelay: '0.4s' }}
        />
      </div>

      <div className="absolute top-3 right-4 text-right text-[10px] text-stone-500 font-mono leading-5 pointer-events-none">
        <div>SECTOR: SOL-03</div>
        <div>STATUS: UNSTABLE</div>
      </div>

      <div className="absolute bottom-3 left-4 text-[10px] text-rose-300/50 font-mono leading-5 pointer-events-none">
        <div>34.0522&deg; N</div>
        <div>118.2437&deg; W</div>
        <div>408,000 M</div>
      </div>
    </div>
  )
}
