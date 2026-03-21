import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

function TestApp() {
  return (
    <div style={{ background: '#0A0A0F', color: 'white', padding: '20px', minHeight: '100vh' }}>
      <h1>🥊 ShadowCoach AI Test</h1>
      <p>If you see this, React is working!</p>
      <button 
        onClick={() => alert('Button works!')}
        style={{ 
          background: 'linear-gradient(to right, #E94560, #FF6B35)', 
          color: 'white', 
          padding: '10px 20px', 
          border: 'none', 
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        Test Button
      </button>
    </div>
  )
}

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <StrictMode>
      <TestApp />
    </StrictMode>
  )
} else {
  console.error('Root element not found!')
}
