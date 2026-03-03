import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Suppress THREE.Clock deprecation warning (from react-three-fiber, not our code)
const originalWarn = console.warn
console.warn = function(...args) {
  if (args[0]?.includes?.('THREE.Clock') || args[0]?.includes?.('This module has been deprecated')) {
    return; // Suppress this specific warning
  }
  originalWarn.apply(console, args)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
