import { useEffect, useRef } from 'react'
import { CameraControls } from '@react-three/drei'
import { useStore } from '../../store/useStore'

export function SceneController() {
  const controls = useRef()
  const selectedNode = useStore((state) => state.selectedNode)
  const cameraSnapshot = useStore((state) => state.cameraSnapshot)
  const setCameraSnapshot = useStore((state) => state.setCameraSnapshot)
  const clearCameraSnapshot = useStore((state) => state.clearCameraSnapshot)
  const skipDefaultReset = useRef(false)

  useEffect(() => {
    if (!controls.current) return

    const zoomToNode = () => {
      const { x, y, z } = selectedNode.position
      controls.current.enabled = false
      controls.current.setLookAt(
        x + 5, y + 3, z + 7,
        x, y, z,
        true
      )
      setTimeout(() => {
        if (controls.current) controls.current.enabled = true
      }, 500)
    }

    // const zoomToNode = () => {
    //   const { x, y, z } = selectedNode.position
    //   controls.current.enabled = false
    //   controls.current.setLookAt(
    //     x + 5, y + 3, z + 7,
    //     x, y, z,
    //     true
    //   )
    //   setTimeout(() => {
    //     if (controls.current) controls.current.enabled = true
    //   }, 500)
    // }

    if (selectedNode) {
      if (!cameraSnapshot) {
        const position = controls.current.getPosition()
        const target = controls.current.getTarget()
        setCameraSnapshot({
          position: { x: position.x, y: position.y, z: position.z },
          target: { x: target.x, y: target.y, z: target.z },
        })
      }
      skipDefaultReset.current = false
      zoomToNode()
    } else if (cameraSnapshot) {
      controls.current.enabled = false
      controls.current.setLookAt(
        cameraSnapshot.position.x,
        cameraSnapshot.position.y,
        cameraSnapshot.position.z,
        cameraSnapshot.target.x,
        cameraSnapshot.target.y,
        cameraSnapshot.target.z,
        true
      )
      setTimeout(() => {
        if (controls.current) controls.current.enabled = true
        clearCameraSnapshot()
        skipDefaultReset.current = true
      }, 600)
      return
    } else if (skipDefaultReset.current) {
      skipDefaultReset.current = false
      return
    } else {
      controls.current.enabled = false
      controls.current.setLookAt(
        20, 20, 20,
        0, 0, 0,
        true
      )
      setTimeout(() => {
        if (controls.current) controls.current.enabled = true
      }, 1000)
    }
  }, [selectedNode, cameraSnapshot, setCameraSnapshot, clearCameraSnapshot])

  return (
    <CameraControls 
      ref={controls} 
      makeDefault 
      minDistance={1} 
      maxDistance={60}
      dollySpeed={0.5}
      truckSpeed={2}
      smoothTime={0.5}
      draggingSmoothTime={0.4}
    />
  )
}