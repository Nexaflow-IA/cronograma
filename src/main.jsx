import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.jsx'

// TODO: Reemplaza con tu Client ID de Google Cloud Console
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "TU_GOOGLE_CLIENT_ID";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
