import { useId } from 'react'

const baseInput =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 disabled:bg-slate-50 disabled:text-slate-500'

/**
 * Labelled text input. The generated id ties <label> to the control so
 * clicking the label focuses the field and screen readers announce it.
 */
export const TextField = ({
  label,
  hint,
  type = 'text',
  className = '',
  ...rest
}) => {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        aria-describedby={hintId}
        className={baseInput}
        {...rest}
      />
      {hint && (
        <p id={hintId} className="mt-1 text-xs text-slate-500">
          {hint}
        </p>
      )}
    </div>
  )
}

/** Labelled multi-line input. */
export const TextArea = ({
  label,
  hint,
  rows = 4,
  className = '',
  action,
  ...rest
}) => {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined

  return (
    <div className={className}>
      {(label || action) && (
        <div className="mb-1.5 flex items-center justify-between gap-2">
          {label && (
            <label
              htmlFor={id}
              className="block text-xs font-semibold uppercase tracking-wide text-slate-600"
            >
              {label}
            </label>
          )}
          {action}
        </div>
      )}
      <textarea
        id={id}
        rows={rows}
        aria-describedby={hintId}
        className={`${baseInput} resize-y leading-relaxed`}
        {...rest}
      />
      {hint && (
        <p id={hintId} className="mt-1 text-xs text-slate-500">
          {hint}
        </p>
      )}
    </div>
  )
}

/** Labelled checkbox with the label to the right of the box. */
export const CheckboxField = ({ label, className = '', ...rest }) => {
  const id = useId()
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <input
        id={id}
        type="checkbox"
        className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-2 focus:ring-teal-500/40"
        {...rest}
      />
      <label htmlFor={id} className="text-sm text-slate-600">
        {label}
      </label>
    </div>
  )
}
