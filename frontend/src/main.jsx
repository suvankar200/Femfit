import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'

// In production (mobile APK / Capacitor build), __API_BASE__ is injected by
// Vite as the full Render backend URL.  In development it is an empty string
// so the Vite dev-server proxy continues to handle /api calls normally.
if (typeof __API_BASE__ !== 'undefined' && __API_BASE__) {
  axios.defaults.baseURL = __API_BASE__
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
