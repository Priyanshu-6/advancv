import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FullPageSpinner } from './ui/Spinner'

/**
 * Gate for the authenticated `/app` area. Waits for the session restore to
 * finish before deciding, so a signed-in user reloading the page isn't
 * bounced to /login on the first render.
 */
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) return <FullPageSpinner label="Loading your workspace" />

  if (!isAuthenticated) {
    // Remember where they were headed so login can send them back.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}
