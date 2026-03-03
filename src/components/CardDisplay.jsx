import { useStore } from '../store/useStore'
import { useState, useEffect } from 'react'

export function CardDisplay({ node }) {
  const resetView = useStore((state) => state.resetView)
  const [isClosing, setIsClosing] = useState(false)

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      resetView()
    }, 150)
  }

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  return (
    <>
      {/* Overlay background - spans entire screen */}
      <div 
        onClick={handleClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(8px)',
          zIndex: 999,
          animation: isClosing ? 'fadeOutOverlay 0.15s ease-out' : 'fadeInOverlay 0.3s ease-out',
          pointerEvents: 'all'
        }}
      />

      {/* Card centered on screen */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: `linear-gradient(135deg, rgba(10, 10, 20, 0.98) 0%, rgba(5, 5, 10, 0.95) 100%)`,
          border: `1px solid ${node.color}88`,
          boxShadow: `0 0 60px ${node.color}44, inset 0 0 60px ${node.color}11`,
          color: 'white',
          padding: '30px',
          borderRadius: '20px',
          width: '90%',
          maxWidth: '400px',
          backdropFilter: 'blur(20px)',
          zIndex: 1000,
          animation: isClosing ? 'scaleOutCard 0.15s ease-in' : 'scaleInCard 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          maxHeight: '90vh',
          overflow: 'auto',
          pointerEvents: 'all'
        }}
      >
        {/* Close button */}
        <button 
          onClick={(e) => {
            e.stopPropagation()
            handleClose()
          }}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: 'white',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            cursor: 'pointer',
            fontSize: '20px',
            display: 'grid',
            placeItems: 'center',
            margin: '-4px 0 0 0',
            padding: '-0px 0px 2px 2px',
            transition: 'all 0.3s ease',
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            e.target.style.background = node.color
            e.target.style.transform = 'rotate(90deg)'
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.1)'
            e.target.style.transform = 'rotate(0deg)'
          }}
        >
          ×
        </button>

        {/* Image */}
        <img 
          src={node.image} 
          alt={node.title}
          style={{ 
            width: '100%', 
            height: '200px', 
            objectFit: 'cover', 
            borderRadius: '12px',
            marginBottom: '20px',
            boxShadow: `0 0 30px ${node.color}33`
          }} 
        />
        
        {/* Title */}
        <h2 style={{ 
          color: node.color, 
          margin: '0 0 15px 0', 
          fontSize: '1.8rem',
          fontWeight: 'bold',
          textShadow: `0 0 15px ${node.color}66`,
          letterSpacing: '0.5px'
        }}>
          {node.title}
        </h2>
        
        {/* Description */}
        <p style={{ 
          fontSize: '15px', 
          lineHeight: '1.8', 
          opacity: 0.95,
          margin: '0 0 25px 0',
          color: 'rgba(255,255,255,0.9)'
        }}>
          {node.description}
        </p>

        {/* Footer hint */}
        <div style={{
          fontSize: '11px',
          letterSpacing: '1.5px',
          opacity: 0.5,
          textAlign: 'center',
          borderTop: `1px solid ${node.color}33`,
          paddingTop: '15px',
          marginTop: '15px',
          textTransform: 'uppercase',
          fontWeight: '600'
        }}>
          Haz clic fuera o presiona ESC para regresar
        </div>
      </div>
    </>
  )
}
