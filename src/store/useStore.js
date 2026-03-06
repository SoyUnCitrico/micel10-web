import { create } from 'zustand'

export const useStore = create((set) => ({
  selectedNode: null,
  cardOpen: false,
  hoveredNodeId: null,
  hoveredConnectionId: null,
  cameraSnapshot: null,
  sceneVersion: 0,
  // Función para seleccionar un nodo y activar el zoom
  setSelectedNode: (node) => {
    set({ selectedNode: node, cardOpen: true })
  },
  // Función para volver a la vista global y reiniciar el sistema completo
  resetView: () => {
    set((state) => ({ 
      selectedNode: null, 
      cardOpen: false,
      hoveredNodeId: null,
      hoveredConnectionId: null,
      sceneVersion: state.sceneVersion + 1,
    }))
  },
  // Función para marcar nodo como hovereado
  setHoveredNode: (nodeId) => {
    set({ hoveredNodeId: nodeId })
  },
  clearHoveredNode: () => {
    set({ hoveredNodeId: null })
  },
  // Función para marcar conexión como hovereada
  setHoveredConnection: (connectionId) => {
    set({ hoveredConnectionId: connectionId })
  },
  clearHoveredConnection: () => {
    set({ hoveredConnectionId: null })
  },
  setCameraSnapshot: (snapshot) => {
    set({ cameraSnapshot: snapshot })
  },
  clearCameraSnapshot: () => {
    set({ cameraSnapshot: null })
  },
  incrementSceneVersion: () => {
    set((state) => ({ sceneVersion: state.sceneVersion + 1 }))
  }
}));