import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Debounced autosave.
 *
 * Watches `value` and calls `onSave` after `delay` ms of quiet. Returns the
 * current save status plus a `saveNow` escape hatch for explicit saves.
 *
 * The first render is skipped so loading a resume doesn't immediately trigger
 * a pointless PATCH.
 */
export const useAutosave = ({ value, onSave, delay = 1200, enabled = true }) => {
  const [status, setStatus] = useState('idle') // idle | pending | saving | saved | error
  const [error, setError] = useState(null)
  const [lastSavedAt, setLastSavedAt] = useState(null)

  const timerRef = useRef(null)
  const skipRef = useRef(true)
  const savingRef = useRef(false)
  // Keep the newest value/handler in refs so the debounce timer always sees
  // current data without being torn down on every keystroke.
  const valueRef = useRef(value)
  const onSaveRef = useRef(onSave)

  valueRef.current = value
  onSaveRef.current = onSave

  const flush = useCallback(async () => {
    if (savingRef.current) return
    savingRef.current = true
    setStatus('saving')
    setError(null)

    try {
      await onSaveRef.current(valueRef.current)
      setStatus('saved')
      setLastSavedAt(new Date())
    } catch (err) {
      setStatus('error')
      setError(err.message || 'Could not save')
    } finally {
      savingRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    // Ignore the initial value — it came from the server.
    if (skipRef.current) {
      skipRef.current = false
      return
    }

    setStatus('pending')
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(flush, delay)

    return () => clearTimeout(timerRef.current)
  }, [value, delay, enabled, flush])

  // Best-effort save if the user navigates away mid-debounce.
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        if (!skipRef.current && !savingRef.current) {
          onSaveRef.current?.(valueRef.current)?.catch?.(() => {})
        }
      }
    }
  }, [])

  const saveNow = useCallback(() => {
    clearTimeout(timerRef.current)
    return flush()
  }, [flush])

  return { status, error, lastSavedAt, saveNow }
}
