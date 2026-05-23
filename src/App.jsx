import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import LoginPage    from '@/pages/LoginPage'
import BDHome       from '@/pages/BDHome'
import PMOHome      from '@/pages/PMOHome'
import Layout       from '@/components/layout/Layout'
import NewLead      from '@/pages/NewLead'
import UpdateLead   from '@/pages/UpdateLead'
import DeleteLead   from '@/pages/DeleteLead'
import POUpload     from '@/pages/POUpload'
import Dashboard    from '@/pages/Dashboard'

function ProtectedRoute({ children, requirePMO = false }) {
  const { user, isPMO } = useAuth()
  if (!user)            return <Navigate to="/login" replace />
  if (requirePMO && !isPMO) return <Navigate to="/bd" replace />
  return children
}

export default function App() {
  const { user, isPMO } = useAuth()

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={user ? <Navigate to={isPMO ? '/pmo' : '/bd'} replace /> : <LoginPage />}
      />

      {/* BD Routes */}
      <Route path="/bd" element={
        <ProtectedRoute><Layout /></ProtectedRoute>
      }>
        <Route index element={<BDHome />} />
        <Route path="new-lead"    element={<NewLead />} />
        <Route path="update-lead" element={<UpdateLead />} />
        <Route path="delete-lead" element={<DeleteLead />} />
        <Route path="po-upload"   element={<POUpload />} />
      </Route>

      {/* PMO Routes — inherits all BD + extras */}
      <Route path="/pmo" element={
        <ProtectedRoute requirePMO><Layout /></ProtectedRoute>
      }>
        <Route index element={<PMOHome />} />
        <Route path="new-lead"    element={<NewLead />} />
        <Route path="update-lead" element={<UpdateLead />} />
        <Route path="delete-lead" element={<DeleteLead />} />
        <Route path="po-upload"   element={<POUpload />} />
        <Route path="dashboard"   element={<Dashboard />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={
        user ? <Navigate to={isPMO ? '/pmo' : '/bd'} replace /> : <Navigate to="/login" replace />
      } />
    </Routes>
  )
}
