import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Verify from './Verify.jsx'

// Check if the URL has ?id= (which means someone scanned the QR code)
const isVerifyRoute = window.location.pathname === '/verify' || window.location.search.includes('?id=');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isVerifyRoute ? <Verify /> : <App />}
  </StrictMode>,
)
