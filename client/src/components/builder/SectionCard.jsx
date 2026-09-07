import { ChevronDown, GripVertical, Plus, Trash2 } from 'lucide-react'
import { Button } from '../ui/Button'

/** Collapsible wrapper for each editor section. */
export const SectionCard = ({
  title,
  icon: Icon,
  count,
  open,
  onToggle,
  children,
  action,
}) => (
  <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-slate-50"
    >
      {Icon && <Icon className="h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />}
      <span className="flex-1 text-sm font-semibold text-slate-900">{title}</span>
      {typeof count === 'number' && count > 0 && (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
          {count}
        </span>
      )}
      <ChevronDown
        className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        aria-hidden="true"
      />
    </button>

    {open && (
      <div className="space-y-4 border-t border-slate-100 px-4 py-4">
        {children}
        {action}
      </div>
    )}
  </section>
)

/**
 * A single repeatable entry (one job, school, or project) with reorder and
 * remove controls.
 */
export const EntryCard = ({
  title,
  subtitle,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  children,
}) => (
  <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5">
    <div className="mb-3 flex items-start gap-2">
      <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800">
          {title || 'Untitled'}
        </p>
        {subtitle && (
          <p className="truncate text-xs text-slate-500">{subtitle}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={!canMoveUp}
          aria-label="Move up"
          className="rounded p-1 text-slate-400 transition-colors hover:bg-white hover:text-slate-700 disabled:opacity-30"
        >
          <ChevronDown className="h-3.5 w-3.5 rotate-180" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={!canMoveDown}
          aria-label="Move down"
          className="rounded p-1 text-slate-400 transition-colors hover:bg-white hover:text-slate-700 disabled:opacity-30"
        >
          <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove entry"
          className="rounded p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>

    <div className="space-y-3">{children}</div>
  </div>
)

/** "Add another" button used at the foot of repeatable sections. */
export const AddButton = ({ onClick, label }) => (
  <Button variant="secondary" size="sm" icon={Plus} onClick={onClick} className="w-full">
    {label}
  </Button>
)
