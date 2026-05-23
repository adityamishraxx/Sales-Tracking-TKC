import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1a2236',
              color:      '#f1f5f9',
              border:     '1px solid #2d3f63',
              borderRadius: '12px',
              padding:    '12px 16px',
              fontSize:   '14px',
              fontFamily: 'Inter, sans-serif',
              boxShadow:  '0 8px 32px rgba(0,0,0,0.5)',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#0a0f1e' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#0a0f1e' },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
