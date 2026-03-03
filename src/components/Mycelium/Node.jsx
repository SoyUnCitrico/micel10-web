import { Sphere, Html } from '@react-three/drei'
import { useStore } from '../../store/useStore'
import { useState, useCallback, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import * as Tone from 'tone'
import { playNodeTone, stopNodeTone } from '../../audio/synth'

export function Node({ data, links, allNodes, audioReady, onArmAudio }) {
  const setSelectedNode = useStore((state) => state.setSelectedNode)
  const setHoveredNode = useStore((state) => state.setHoveredNode)
  const clearHoveredNode = useStore((state) => state.clearHoveredNode)
  const isSelected = useStore((state) => state.selectedNode?.id === data.id)
  const hoveredNodeId = useStore((state) => state.hoveredNodeId)
  const [isLocalHovered, setIsLocalHovered] = useState(false)
  const pulseRef = useRef()
  const groupRef = useRef()
  const basePosRef = useRef([data.position[0], data.position[1], data.position[2]])
  const motionParams = useRef({
    baseAmplitude: 0.05 + Math.random() * 0.08,
    baseSpeed: 0.18 + Math.random() * 0.2
  })

  useEffect(() => {
    basePosRef.current = [data.position[0], data.position[1], data.position[2]]
    if (groupRef.current) {
      groupRef.current.position.set(...basePosRef.current)
    }
  }, [data.position])

  // Gentle pulsing for luminous nodes + subtle floating drift
  useFrame(({ clock }) => {
    if (data.variant === 'luminous' && pulseRef.current) {
      const t = clock.elapsedTime
      const s = 1 + Math.sin(t * 2.2 + data.id) * 0.08
      pulseRef.current.scale.setScalar(s)
    }

    if (groupRef.current) {
      const t = clock.elapsedTime
      const phase = data.id * 0.17
      const boost = isLocalHovered ? 1.5 : 1
      const amplitude = Math.min(motionParams.current.baseAmplitude * boost, 0.16)
      const speed = motionParams.current.baseSpeed * boost
      const x = basePosRef.current[0] + Math.sin(t * speed + phase) * amplitude
      const y = basePosRef.current[1] + Math.cos(t * (speed * 0.9) + phase) * (amplitude * 0.8)
      const z = basePosRef.current[2] + Math.sin(t * (speed * 0.85) + phase) * (amplitude * 0.9)
      groupRef.current.position.set(x, y, z)
    }
  })

  // Determinar si este nodo está conectado al nodo hovereado
  const isConnectedToHovered = hoveredNodeId !== null && links?.some(link => 
    (link.startId === data.id && link.endId === hoveredNodeId) ||
    (link.endId === data.id && link.startId === hoveredNodeId)
  )

  // Color handling: luminous nodes stay colored; standard nodes gray until hover/connect
  const isActive = isLocalHovered || data.id === hoveredNodeId || isConnectedToHovered
  const displayColor = data.variant === 'luminous'
    ? data.color
    : isActive
      ? data.color
      : '#808080'

  const handlePointerDown = useCallback(async () => {
    if (onArmAudio) {
      await onArmAudio()
    }
  }, [onArmAudio])

  const handlePointerOver = useCallback(async () => {
    document.body.style.cursor = 'pointer'
    setIsLocalHovered(true)
    setHoveredNode(data.id)

    if (audioReady) {
      const midi = typeof data.note === 'number' ? data.note : 60
      const note = Tone.Frequency(midi, 'midi')
      playNodeTone(note)
    }
  }, [audioReady, data.id, setHoveredNode])

  const handlePointerOut = useCallback(() => {
    document.body.style.cursor = 'auto'
    setIsLocalHovered(false)
    clearHoveredNode()
    if (audioReady) {
      stopNodeTone()
    }
  }, [audioReady, clearHoveredNode])

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    setSelectedNode(data);
  }, [data, setSelectedNode])
  // console.log('Rendering Node:', data)
  return (
    <group ref={groupRef}>
      <Sphere 
        args={[0.22, 32, 32]} 
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        ref={pulseRef}
      >
        {data.variant === 'luminous' ? (
          <meshStandardMaterial 
            color={displayColor}
            emissive={displayColor}
            emissiveIntensity={isSelected ? 14 : isLocalHovered ? 8 : 6}
            metalness={0.4}
            roughness={0.2}
            transparent
            opacity={0.92}
            toneMapped={false}
          />
        ) : (
          <meshStandardMaterial 
            color={displayColor} 
            emissive={displayColor}
            emissiveIntensity={isSelected ? 12 : isLocalHovered ? 3.5 : 1.2} 
            toneMapped={false} 
          />
        )}
      </Sphere>

      {data.variant === 'luminous' && (
        <mesh position={[0, 0, 0]} scale={1.25}>
          <sphereGeometry args={[0.22, 32, 32]} />
          <shaderMaterial
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            uniforms={{
              time: { value: 0 },
              glowColor: { value: new THREE.Color(data.color) },
              intensity: { value: 1.5 }
            }}
            vertexShader={`
              varying vec3 vNormal;
              void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `}
            fragmentShader={`
              varying vec3 vNormal;
              uniform vec3 glowColor;
              uniform float intensity;
              void main() {
                float edge = pow(1.0 - max(vNormal.z, 0.0), 2.0);
                float glow = edge * intensity;
                gl_FragColor = vec4(glowColor, glow);
              }
            `}
          />
        </mesh>
      )}

      {(isLocalHovered || data.id === hoveredNodeId) && (
        <Html
          position={[0, -0.45, 0]}
          center
          style={{
            background: 'rgba(0,0,0,0.65)',
            color: '#fff',
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '12px',
            letterSpacing: '0.4px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            boxShadow: `0 2px 10px ${data.color}33`,
            border: `1px solid ${data.color}55`,
          }}
        >
          {data.title}
        </Html>
      )}
    </group>
  )
}