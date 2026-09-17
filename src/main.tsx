import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { runJavaCode } from './lib/javaRunner'

// Expose for testing
(window as any).runJavaCode = runJavaCode;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
