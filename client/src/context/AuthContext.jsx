import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { api, getToken, setToken } from '../lib/api'

const AuthContext = createContext(null)

/**
 * Holds the signed-in user and the server's feature flags.
 *
 * On mount it restores the session from the stored JWT by calling
 * /api/auth/me, and fetches /api/auth/config so the UI knows whether Google
 * sign-in and the AI features are actually configured on the server.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [config, setConfig] = useState({
    googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || null,
    features: { googleAuth: false, ai: false },
  })
  const [loading, setLoading] = useState(true)
  const [serverReachable, setServerReachable] = useState(true)

  useEffect(() => {
    let cancelled = false

    const bootstrap = async () => {
      // Server config first — it tells us what's available even when signed out.
      try {
        const result = await api.getConfig()
        if (!cancelled) {
          setConfig({
            googleClientId:
              result.googleClientId ||
              import.meta.env.VITE_GOOGLE_CLIENT_ID ||
              null,
            features: result.features || { googleAuth: false, ai: false },
          })
          setServerReachable(true)
        }
      } catch {
        if (!cancelled) setServerReachable(false)
      }

      // Restore the session if a token is present.
      if (getToken()) {
        try {
          const result = await api.getCurrentUser()
          if (!cancelled) setUser(result.user)
        } catch {
          // Token expired or invalid — clear it silently.
          setToken(null)
        }
      }

      if (!cancelled) setLoading(false)
    }

    bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  /** Exchanges a Google ID token for an AdvanCV session. */
  const loginWithGoogle = useCallback(async (credential) => {
    const result = await api.loginWithGoogle(credential)
    setToken(result.token)
    setUser(result.user)
    return result.user
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      config,
      loading,
      serverReachable,
      isAuthenticated: Boolean(user),
      aiEnabled: Boolean(config.features?.ai),
      loginWithGoogle,
      logout,
    }),
    [user, config, loading, serverReachable, loginWithGoogle, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside an <AuthProvider>')
  }
  return context
}
