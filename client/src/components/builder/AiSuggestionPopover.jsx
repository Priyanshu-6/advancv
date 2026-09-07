import { Check, Sparkles, X } from 'lucide-react'
import { Button } from '../ui/Button'
import { Spinner } from '../ui/Spinner'

/**
 * Presents AI output as choices rather than silently overwriting the user's
 * text. Nothing is applied until the user picks an option.
 */
export const AiSuggestionPopover = ({
  open,
  loading,
  error,
  title,
  options = [],
  onApply,
  onClose,
  applyLabel = 'Use this',
  multi = false,
}) => {
  if (!open) return null

  return (
    <div className="mt-2 rounded-xl border border-violet-200 bg-violet-50/70 p-3">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-violet-600" aria-hidden="true" />
        <p className="flex-1 text-xs font-semibold text-violet-900">{title}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss suggestions"
          className="rounded p-0.5 text-violet-400 transition-colors hover:text-violet-700"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      {loading ? (
        <p className="flex items-center gap-2 py-2 text-xs text-violet-700" role="status">
          <Spinner className="h-3.5 w-3.5" />
          Thinking…
        </p>
      ) : error ? (
        <p className="py-1 text-xs leading-relaxed text-red-700">{error}</p>
      ) : options.length === 0 ? (
        <p className="py-1 text-xs text-violet-700">No suggestions came back.</p>
      ) : (
        <ul className="space-y-2">
          {options.map((option, index) => (
            <li
              key={index}
              className="rounded-lg border border-violet-100 bg-white p-2.5"
            >
              <p className="text-xs leading-relaxed text-slate-700">{option}</p>
              <div className="mt-2 flex justify-end">
                <Button
                  size="sm"
                  variant="ai"
                  icon={Check}
                  onClick={() => onApply(option, index)}
                >
                  {applyLabel}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {multi && options.length > 1 && !loading && !error && (
        <Button
          size="sm"
          variant="secondary"
          className="mt-2 w-full"
          onClick={() => onApply(options.join('\n'), -1)}
        >
          Use all {options.length}
        </Button>
      )}
    </div>
  )
}

/** Small "Improve with AI" trigger placed beside a field label. */
export const AiButton = ({ onClick, loading, disabled, label = 'AI' }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled || loading}
    className="inline-flex items-center gap-1 rounded-md bg-violet-100 px-2 py-1 text-[11px] font-semibold text-violet-700 transition-colors hover:bg-violet-200 disabled:cursor-not-allowed disabled:opacity-50"
    title={
      disabled
        ? 'AI is not configured on the server'
        : `${label} — generate suggestions`
    }
  >
    {loading ? (
      <Spinner className="h-3 w-3" />
    ) : (
      <Sparkles className="h-3 w-3" aria-hidden="true" />
    )}
    {label}
  </button>
)
