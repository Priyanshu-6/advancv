import { useEffect, useRef, useState } from 'react'

const GSI_SRC = 'https://accounts.google.com/gsi/client'

/** Loads the Google Identity Services script once and resolves when ready. */
const loadGsiScript = () => {
  if (window.google?.accounts?.id) return Promise.resolve()

  const existing = document.querySelector(`script[src="${GSI_SRC}"]`)
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', resolve, { once: true })
      existing.addEventListener('error', reject, { once: true })
    })
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = GSI_SRC
    script.async = true
    script.defer = true
    script.onload = resolve
    script.onerror = () => reject(new Error('Failed to load Google sign-in'))
    document.head.appendChild(script)
  })
}

/**
 * Renders Google's official sign-in button into `buttonRef` and hands the
 * resulting ID token to `onCredential`.
 *
 * Using GSI's own rendered button (rather than a custom one) keeps us on the
 * supported path for consent and avoids re-implementing the OAuth dance. The
 * ID token is verified server-side, so nothing here is security-critical.
 */
const MISSING_CLIENT_ID =
  'Google sign-in is not configured. Set GOOGLE_CLIENT_ID on the server.'

export const useGoogleSignIn = ({ clientId, onCredential, enabled = true }) => {
  const buttonRef = useRef(null)
  // Tracks the script load only. The "no client id" case is derived below
  // rather than pushed through state, which would mean a setState during the
  // effect body and an extra render.
  const [scriptState, setScriptState] = useState({
    status: 'loading', // loading | ready | error
    error: null,
  })

  // Keep the latest callback without re-initialising GSI on every render.
  const callbackRef = useRef(onCredential)
  useEffect(() => {
    callbackRef.current = onCredential
  }, [onCredential])

  useEffect(() => {
    if (!enabled || !clientId) return

    let cancelled = false

    loadGsiScript()
      .then(() => {
        if (cancelled || !buttonRef.current) return

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response?.credential) callbackRef.current?.(response.credential)
          },
        })

        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          logo_alignment: 'left',
          width: 320,
        })

        setScriptState({ status: 'ready', error: null })
      })
      .catch((err) => {
        if (cancelled) return
        setScriptState({ status: 'error', error: err.message })
      })

    return () => {
      cancelled = true
    }
  }, [clientId, enabled])

  if (enabled && !clientId) {
    return { buttonRef, status: 'error', error: MISSING_CLIENT_ID }
  }

  return { buttonRef, ...scriptState }
}
