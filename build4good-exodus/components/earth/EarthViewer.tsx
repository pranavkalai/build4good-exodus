'use client'

import { OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useAppStore } from '@/store/useAppStore'
import earthCloudMap from './2k_earth_clouds.jpg'
import earthDayMap from './2k_earth_daymap.jpg'
import earthNightMap from './2k_earth_nightmap.jpg'

type EarthTextureSet = {
  cloudTexture: THREE.Texture | null
  dayTexture: THREE.Texture | null
  nightTexture: THREE.Texture | null
}

type SurfaceTextureSet = Pick<EarthTextureSet, 'dayTexture' | 'nightTexture'>

const LIGHT_DIRECTION = new THREE.Vector3(1, 0.35, 0.8).normalize()
const ATMOSPHERE_COLOR = new THREE.Color('#4db2ff')
const HEAT_COLOR = new THREE.Color('#ff5a36')
const DEFAULT_CAMERA_POSITION = new THREE.Vector3(0, 0, 5.7)
const EARTH_RADIUS = 1.38
const EARTH_SPIN_SPEED = 0.08
const CLOUD_SPIN_OFFSET = 0.012

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
  uniform vec3 uHeatColor;
  uniform float uHeatLevel;

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
    float heatMask = smoothstep(0.15, 1.0, 1.0 - daylight) * 0.55 + fresnel * 0.45;
    float heatWave = 0.92 + 0.08 * sin(vUv.y * 22.0 + vUv.x * 9.0);
    float heatStrength = clamp(uHeatLevel * heatMask * heatWave, 0.0, 1.0);

    vec3 finalColor = baseColor;
    finalColor += uAtmosphereColor * fresnel * 0.24;
    finalColor += vec3(1.0, 0.96, 0.92) * specular;
    finalColor = mix(finalColor, finalColor + uHeatColor * 0.28, heatStrength);

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
  uniform vec3 uHeatColor;
  uniform float uHeatLevel;

  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - abs(dot(viewDir, normal)), 5.0);
    float sunlight = max(dot(normal, normalize(uLightDirection)), 0.0);
    float heatGlow = mix(1.0, 1.7, uHeatLevel);

    vec3 baseColor = uAtmosphereColor * (0.8 + sunlight * 1.05);
    vec3 heatedColor = (uHeatColor * 1.05 + vec3(0.24, 0.04, 0.02)) * (0.9 + sunlight * 0.65);
    vec3 color = mix(baseColor, heatedColor, uHeatLevel);

    gl_FragColor = vec4(color, fresnel * heatGlow);
  }
`

const cloudVertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldNormal;

  void main() {
    vUv = uv;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);

    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`

const cloudFragmentShader = `
  uniform sampler2D uCloudTexture;
  uniform vec3 uLightDirection;

  varying vec2 vUv;
  varying vec3 vWorldNormal;

  void main() {
    float cloudMask = texture2D(uCloudTexture, vUv).r;
    vec3 normal = normalize(vWorldNormal);
    float lightAmount = dot(normal, normalize(uLightDirection));
    float dayMask = smoothstep(0.02, 0.24, lightAmount);
    float alpha = cloudMask * dayMask * 0.7;

    if (alpha < 0.01) {
      discard;
    }

    gl_FragColor = vec4(vec3(1.0), alpha);
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

function EarthSphere({ dayTexture, nightTexture, heatLevel }: SurfaceTextureSet & { heatLevel: number }) {
  const { gl } = useThree()
  const shaderRef = useRef<THREE.ShaderMaterial>(null)

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

  useEffect(() => {
    if (!shaderRef.current) {
      return
    }

    shaderRef.current.uniforms.uHeatLevel.value = heatLevel
  }, [heatLevel])

  if (dayTexture && nightTexture) {
    return (
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS, 128, 128]} />
        <shaderMaterial
          ref={shaderRef}
          uniforms={{
            uDayTexture: { value: dayTexture },
            uNightTexture: { value: nightTexture },
            uLightDirection: { value: LIGHT_DIRECTION },
            uAtmosphereColor: { value: ATMOSPHERE_COLOR },
            uHeatColor: { value: HEAT_COLOR },
            uHeatLevel: { value: heatLevel },
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
          color={new THREE.Color().lerpColors(new THREE.Color('#ffffff'), HEAT_COLOR, heatLevel * 0.14)}
          emissive="#2a0c0c"
          emissiveIntensity={0.18 + heatLevel * 0.24}
        />
      </mesh>
    )
  }

  return (
    <mesh>
      <sphereGeometry args={[EARTH_RADIUS, 128, 128]} />
      <meshStandardMaterial
        color={new THREE.Color().lerpColors(new THREE.Color('#4c7691'), new THREE.Color('#92525a'), heatLevel * 0.38)}
        roughness={0.92}
        metalness={0.02}
        emissive="#2a0c0c"
        emissiveIntensity={0.3 + heatLevel * 0.26}
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
      <shaderMaterial
        uniforms={{
          uCloudTexture: { value: cloudTexture },
          uLightDirection: { value: LIGHT_DIRECTION },
        }}
        vertexShader={cloudVertexShader}
        fragmentShader={cloudFragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

function AtmosphereShell({ heatLevel }: { heatLevel: number }) {
  return (
    <mesh scale={1.12}>
      <sphereGeometry args={[EARTH_RADIUS, 128, 128]} />
      <shaderMaterial
        vertexShader={atmosphereVertexShader}
        fragmentShader={atmosphereFragmentShader}
        uniforms={{
          uAtmosphereColor: { value: ATMOSPHERE_COLOR },
          uLightDirection: { value: LIGHT_DIRECTION },
          uHeatColor: { value: HEAT_COLOR },
          uHeatLevel: { value: heatLevel },
        }}
        transparent
        depthWrite={false}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

function EarthRig({ cloudTexture, dayTexture, nightTexture, heatLevel }: EarthTextureSet & { heatLevel: number }) {
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
        <EarthSphere dayTexture={dayTexture} nightTexture={nightTexture} heatLevel={heatLevel} />
        <group ref={cloudRef}>
          <CloudLayer cloudTexture={cloudTexture} />
        </group>
      </group>
      <AtmosphereShell heatLevel={heatLevel} />
    </group>
  )
}

function EarthControls() {
  const setEarthView = useAppStore((state) => state.setEarthView)
  const lastCameraRef = useRef(new THREE.Vector3())
  const lastTargetRef = useRef(new THREE.Vector3())

  return (
    <OrbitControls
      makeDefault
      enablePan={false}
      enableZoom={false}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.45}
      minDistance={DEFAULT_CAMERA_POSITION.length()}
      maxDistance={DEFAULT_CAMERA_POSITION.length()}
      onChange={(event) => {
        if (!event) {
          return
        }

        const controls = event.target
        const camera = controls.object as THREE.PerspectiveCamera
        const target = controls.target as THREE.Vector3

        if (
          lastCameraRef.current.distanceToSquared(camera.position) < 0.000001 &&
          lastTargetRef.current.distanceToSquared(target) < 0.000001
        ) {
          return
        }

        lastCameraRef.current.copy(camera.position)
        lastTargetRef.current.copy(target)
        setEarthView(
          [camera.position.x, camera.position.y, camera.position.z],
          [target.x, target.y, target.z],
        )
      }}
    />
  )
}

function EarthScene() {
  const textures = useEarthTextures()
  const heatLevel = useAppStore((state) => state.earthHeatLevel)

  return (
    <>
      <ambientLight
        intensity={0.26 + heatLevel * 0.08}
        color={new THREE.Color().lerpColors(new THREE.Color('#9fc2e8'), new THREE.Color('#ffb08b'), heatLevel * 0.6)}
      />
      <hemisphereLight
        args={['#d7ecff', '#1c1310', 0.85 + heatLevel * 0.18]}
        color={new THREE.Color().lerpColors(new THREE.Color('#d7ecff'), new THREE.Color('#ffd1bd'), heatLevel * 0.55)}
        groundColor={new THREE.Color().lerpColors(new THREE.Color('#1c1310'), new THREE.Color('#44110f'), heatLevel * 0.72)}
      />
      <directionalLight
        position={[5, 1.5, 4]}
        intensity={2.45 + heatLevel * 0.42}
        color={new THREE.Color().lerpColors(new THREE.Color('#fff4df'), new THREE.Color('#ffb56b'), heatLevel * 0.65)}
      />
      <directionalLight
        position={[-4, -2, -3]}
        intensity={0.28 + heatLevel * 0.16}
        color={new THREE.Color().lerpColors(new THREE.Color('#5e84b0'), new THREE.Color('#b33b2e'), heatLevel * 0.82)}
      />
      <EarthRig {...textures} heatLevel={heatLevel} />
      <EarthControls />
    </>
  )
}

export function EarthViewer() {
  const heatLevel = useAppStore((state) => state.earthHeatLevel)
  const pulseDuration = `${Math.max(1.5, 3 - heatLevel * 1.3)}s`

  return (
    <div className="relative flex h-full flex-1 items-center justify-center overflow-hidden bg-[#0c0a09]/45">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at center, rgba(12,10,9,0.08) 0%, rgba(12,10,9,0.2) 42%, rgba(12,10,9,0.78) 100%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          opacity: heatLevel * 0.6,
          background:
            'radial-gradient(circle at center, rgba(255,87,66,0.05) 0%, rgba(255,70,38,0.12) 28%, rgba(127,29,29,0.32) 62%, rgba(12,10,9,0) 82%)',
        }}
      />

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

      <div className="absolute w-full h-[0.5px] bg-rose-300/30 top-1/2 pointer-events-none shadow-[0_0_10px_rgba(251,113,133,0.2)]" />
      <div className="absolute h-full w-[0.5px] bg-rose-300/30 left-1/2 pointer-events-none shadow-[0_0_10px_rgba(251,113,133,0.2)]" />

      <div className="absolute w-[580px] h-[580px] rounded-full border-[0.5px] border-rose-300/30 pointer-events-none shadow-[0_0_10px_rgba(251,113,133,0.2)]" />
      <div className="absolute w-[500px] h-[500px] rounded-full border-[0.5px] border-rose-300/30 pointer-events-none shadow-[0_0_10px_rgba(251,113,133,0.2)]" />

      <div className="relative z-10 w-[380px] h-[380px]">
        <div
          className="absolute inset-0 rounded-full overflow-hidden"
          style={{
            boxShadow: `0 0 ${120 + heatLevel * 110}px rgba(251,113,133,${0.28 + heatLevel * 0.16})`,
          }}
        >
          <Canvas
            camera={{ position: DEFAULT_CAMERA_POSITION.toArray() as [number, number, number], fov: 28 }}
            dpr={[1, 1.75]}
            gl={{ antialias: true, alpha: true }}
          >
            <EarthScene />
          </Canvas>
          <div
            className="absolute inset-0 opacity-60 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at center, rgba(15,23,42,0) 0%, rgba(7,10,17,0.18) 45%, rgba(2,6,23,0.7) 100%)',
            }}
          />
          <div
            className="absolute inset-0 rounded-full pointer-events-none transition-opacity duration-700"
            style={{
              opacity: heatLevel * 0.9,
              background:
                'radial-gradient(circle at 50% 50%, rgba(255,173,122,0) 34%, rgba(255,116,86,0.08) 58%, rgba(239,68,68,0.24) 78%, rgba(127,29,29,0.42) 100%)',
              mixBlendMode: 'screen',
            }}
          />
        </div>

        <div className="absolute inset-0 rounded-full border-[0.5px] border-rose-300/30 pointer-events-none shadow-[0_0_10px_rgba(251,113,133,0.2)]" />

        <div
          className={`absolute inset-0 rounded-full pointer-events-none ${heatLevel > 0 ? 'earth-heat-pulse' : ''}`}
          style={{
            transform: `scale(${1.1 + heatLevel * 0.08})`,
            opacity: heatLevel,
            animationDuration: pulseDuration,
            boxShadow: `0 0 ${54 + heatLevel * 52}px rgba(244,63,94,${0.14 + heatLevel * 0.48}), inset 0 0 ${34 + heatLevel * 22}px rgba(251,113,133,${0.08 + heatLevel * 0.34})`,
          }}
        />
        <div
          className={`absolute inset-0 rounded-full border-2 pointer-events-none ${heatLevel > 0 ? 'earth-heat-pulse' : ''}`}
          style={{
            transform: `scale(${1.1 + heatLevel * 0.08})`,
            opacity: heatLevel * 0.92,
            borderColor: `rgba(251, 113, 97, ${0.18 + heatLevel * 0.56})`,
            animationDuration: pulseDuration,
          }}
        />
        <div
          className={`absolute inset-0 rounded-full pointer-events-none ${heatLevel > 0 ? 'earth-heat-pulse' : ''}`}
          style={{
            transform: `scale(${1.25 + heatLevel * 0.12})`,
            opacity: heatLevel * 0.78,
            animationDuration: pulseDuration,
            animationDelay: '0.4s',
            boxShadow: `0 0 ${44 + heatLevel * 48}px rgba(251,113,133,${0.12 + heatLevel * 0.3}), inset 0 0 ${26 + heatLevel * 20}px rgba(255,144,100,${0.06 + heatLevel * 0.16})`,
          }}
        />
        <div
          className={`absolute inset-0 rounded-full border pointer-events-none ${heatLevel > 0 ? 'earth-heat-pulse' : ''}`}
          style={{
            transform: `scale(${1.25 + heatLevel * 0.12})`,
            opacity: heatLevel * 0.74,
            borderColor: `rgba(251, 146, 120, ${0.14 + heatLevel * 0.34})`,
            animationDuration: pulseDuration,
            animationDelay: '0.4s',
          }}
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
