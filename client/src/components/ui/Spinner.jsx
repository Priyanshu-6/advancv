import { Loader2 } from 'lucide-react'

/** Inline spinner. `aria-hidden` because the label lives with the caller. */
export const Spinner = ({ className = 'h-4 w-4' }) => (
  <Loader2 className={`animate-spin ${className}`} aria-hidden="true" />
)

/** Centred full-viewport loading state with an accessible live label. */
export const FullPageSpinner = ({ label = 'Loading' }) => (
  <div
    className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50"
    role="status"
    aria-live="polite"
  >
    <Spinner className="h-8 w-8 text-teal-600" />
    <p className="text-sm text-slate-500">{label}…</p>
  </div>
)
