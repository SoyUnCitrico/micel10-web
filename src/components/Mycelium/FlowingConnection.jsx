import { useRef, useCallback, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../../store/useStore'

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float time;
  uniform vec3 color;
  uniform float intensity;
  uniform float direction;
  varying vec2 vUv;
  void main() {
    // Crea un efecto de pulso que viaja por la línea
    float dash = fract(vUv.x * 2.0 - time * 1.2 * direction);
    float opacity = smoothstep(0.4, 0.5, dash) * smoothstep(0.6, 0.5, dash);
    float baseOpacity = opacity * 0.8 + 0.1;
    
    // Añadir brillo adicional cuando está hovereado
    float pulseGlow = sin(vUv.x * 3.14159 - time * 2.0 * direction) * 0.5 + 0.5;
    float finalOpacity = baseOpacity + (pulseGlow * intensity * 0.5);
    
    gl_FragColor = vec4(color, finalOpacity);
  }
`;

export function FlowingLine({ start, end, startId, endId, connectionId, nodeColors }) {
  const materialRef = useRef();
  const meshRef = useRef();
  const geometryRef = useRef();
  const uniformsRef = useRef({
    time: { value: 0 },
    color: { value: new THREE.Color("#808080") },
    intensity: { value: 0 },
    direction: { value: 1 }
  });

  const hoveredNodeId = useStore((state) => state.hoveredNodeId)
  const hoveredConnectionId = useStore((state) => state.hoveredConnectionId)
  const setHoveredConnection = useStore((state) => state.setHoveredConnection)
  const clearHoveredConnection = useStore((state) => state.clearHoveredConnection)
  
  // Determinar si alguno de los nodos conectados está siendo hovereado
  const isNodeHovered = hoveredNodeId !== null && (hoveredNodeId === startId || hoveredNodeId === endId)
  const isConnectionHovered = hoveredConnectionId === connectionId

  // Usar useFrame sin dependencies para que se ejecute continuamente
  useFrame(({ clock }) => {
    try {
      if (materialRef.current && uniformsRef.current) {
        uniformsRef.current.time.value = clock.elapsedTime;
      }
    } catch (error) {
      // Silenciar errores si el material se ha eliminado
      console.error('[FlowingLine] Error in useFrame:', error);
    }
  });

  // Actualizar colores e intensidad usando useEffect para evitar recrear material
  useEffect(() => {
    if (!uniformsRef.current) return;

    let lineColor = "#808080"
    let intensity = 0
    let direction = 1
    
    if (isConnectionHovered) {
      lineColor = nodeColors[startId] || "#00f2ff"
      intensity = 1.5
    } else if (isNodeHovered) {
      lineColor = "#00ff00"
      intensity = 0.5
      direction = hoveredNodeId === endId ? -1 : 1
    }

    // Actualizar uniforms sin recrear el material
    uniformsRef.current.color.value.setStyle(lineColor);
    uniformsRef.current.intensity.value = intensity;
    uniformsRef.current.direction.value = direction;
  }, [isConnectionHovered, isNodeHovered, startId, endId, hoveredNodeId, nodeColors])

  // Cleanup para borrar geometría y material cuando se desmonta
  useEffect(() => {
    return () => {
      // Limpiar geometría
      if (geometryRef.current) {
        geometryRef.current.dispose();
      }
      // Limpiar material
      if (materialRef.current) {
        materialRef.current.dispose();
      }
    };
  }, []);

  // Memoizar event handlers para evitar actualizaciones excesivas
  const handlePointerOver = useCallback(() => {
    document.body.style.cursor = 'pointer'
    setHoveredConnection(connectionId)
  }, [connectionId, setHoveredConnection])

  const handlePointerOut = useCallback(() => {
    document.body.style.cursor = 'auto'
    clearHoveredConnection()
  }, [clearHoveredConnection])

  // Creamos la geometría de la línea
  const points = [new THREE.Vector3(...start), new THREE.Vector3(...end)];
  const curve = new THREE.CatmullRomCurve3(points);
  
  return (
    <mesh
      ref={meshRef}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <tubeGeometry ref={geometryRef} args={[curve, 20, 0.02, 8, false]} />
      <shaderMaterial
        ref={materialRef}
        transparent
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniformsRef.current}
      />
    </mesh>
  );
}