import { createContext, useContext, useState, useEffect } from 'react'
import { ROLES } from '@/lib/constants'

const AuthContext = createContext(null)

const SESSION_KEY = 'jio_crm_session'

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveSession(session) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY)
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(loadSession)
  const [loading, setLoading] = useState(false)

  // BD login — no password, just name selection
  function loginBD(bdName) {
    const session = {
      role:   ROLES.BD,
      name:   bdName,
      loginAt: new Date().toISOString(),
    }
    saveSession(session)
    setUser(session)
  }

  // PMO login — PIN validation
  function loginPMO(pin) {
    const correctPin = import.meta.env.VITE_PMO_PIN || '123456'
    if (String(pin) !== String(correctPin)) {
      throw new Error('Incorrect PMO PIN. Please try again.')
    }
    const session = {
      role:    ROLES.PMO,
      name:    'PMO',
      loginAt: new Date().toISOString(),
    }
    saveSession(session)
    setUser(session)
  }

  function logout() {
    clearSession()
    setUser(null)
  }

  const isPMO = user?.role === ROLES.PMO
  const isBD  = user?.role === ROLES.BD

  return (
    <AuthContext.Provider value={{ user, loading, loginBD, loginPMO, logout, isPMO, isBD }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
