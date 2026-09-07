import { useCallback, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { AlertCircle, ArrowLeft, ServerOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useGoogleSignIn } from '../hooks/useGoogleSignIn'
import { useToast } from '../context/ToastContext'
import { FullPageSpinner, Spinner } from '../components/ui/Spinner'

export const Login = () => {
  const {
    isAuthenticated,
    loading,
    config,
    serverReachable,
    loginWithGoogle,
  } = useAuth()
  const location = useLocation()
  const toast = useToast()
  const [submitting, setSubmitting] = useState(false)

  // Exchange the Google ID token for an AdvanCV session.
  const handleCredential = useCallback(
    async (credential) => {
      setSubmitting(true)
      try {
        const user = await loginWithGoogle(credential)
        toast.success(`Welcome, ${user.name.split(' ')[0]}`)
      } catch (error) {
        toast.error(error.message || 'Sign-in failed. Please try again.')
        setSubmitting(false)
      }
    },
    [loginWithGoogle, toast],
  )

  const { buttonRef, status, error } = useGoogleSignIn({
    clientId: config.googleClientId,
    onCredential: handleCredential,
    enabled: !loading && !isAuthenticated,
  })

  if (loading) return <FullPageSpinner label="Checking your session" />

  if (isAuthenticated) {
    // Send the user back where they were headed before the redirect.
    return <Navigate to={location.state?.from || '/app'} replace />
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <div className="px-5 py-5">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to home
        </Link>
      </div>

      <main className="flex flex-1 items-start justify-center px-5 pb-16 pt-6">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="text-center">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-teal-600 text-lg font-bold text-white">
                A
              </span>
              <h1 className="mt-4 text-xl font-bold tracking-tight text-slate-900">
                Sign in to AdvanCV
              </h1>
              <p className="mt-1.5 text-sm text-slate-600">
                Your resumes are tied to your Google account. No password to
                remember.
              </p>
            </div>

            <div className="mt-7">
              {!serverReachable ? (
                <div className="flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-800">
                  <ServerOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="font-semibold">Cannot reach the server</p>
                    <p className="mt-0.5 leading-relaxed">
                      Start the API with{' '}
                      <code className="rounded bg-amber-100 px-1 py-0.5 text-[11px]">
                        npm run dev
                      </code>{' '}
                      in the <code className="text-[11px]">server</code> folder,
                      then reload this page.
                    </p>
                  </div>
                </div>
              ) : status === 'error' ? (
                <div className="flex gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="font-semibold">Google sign-in unavailable</p>
                    <p className="mt-0.5 leading-relaxed">{error}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  {/* Google renders its own button into this node. */}
                  <div ref={buttonRef} className="min-h-[44px]" />

                  {status === 'loading' && (
                    <p className="flex items-center gap-2 text-xs text-slate-500">
                      <Spinner className="h-3.5 w-3.5" />
                      Loading Google sign-in…
                    </p>
                  )}
                  {submitting && (
                    <p
                      className="flex items-center gap-2 text-xs text-slate-600"
                      role="status"
                    >
                      <Spinner className="h-3.5 w-3.5" />
                      Signing you in…
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <p className="mt-5 text-center text-xs leading-relaxed text-slate-500">
            We only read your name, email address, and profile photo — enough to
            save your resumes and pre-fill your details.
          </p>
        </div>
      </main>
    </div>
  )
}

export default Login
