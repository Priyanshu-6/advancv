import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Cloud,
  CloudOff,
  Copy,
  Download,
  ExternalLink,
  Globe,
  Lock,
  Minus,
  Pencil,
  Plus,
  RefreshCw,
  Target,
} from 'lucide-react'
import { api } from '../lib/api'
import { createEmptyExperience, toUpdatePayload } from '../lib/resumeUtils'
import { buildFilename, printResume } from '../lib/pdfExport'
import { useAutosave } from '../hooks/useAutosave'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { ResumeForm } from '../components/builder/ResumeForm'
import { JobMatchPanel } from '../components/builder/JobMatchPanel'
import { ResumeSheet, SHEET_WIDTH } from '../components/ResumeSheet'
import { Button } from '../components/ui/Button'
import { FullPageSpinner, Spinner } from '../components/ui/Spinner'
import { Modal } from '../components/ui/Modal'

const ZOOM_STEPS = [0.4, 0.5, 0.6, 0.7, 0.85, 1]

/** Autosave status readout. Deliberately quiet — it only shouts on failure. */
const SaveIndicator = ({ status, error, onRetry }) => {
  if (status === 'error') {
    return (
      <button
        type="button"
        onClick={onRetry}
        title={error || 'Save failed'}
        className="inline-flex items-center gap-1.5 rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-100"
      >
        <CloudOff className="h-3.5 w-3.5" aria-hidden="true" />
        Not saved — retry
      </button>
    )
  }

  const map = {
    saving: { icon: null, label: 'Saving…' },
    saved: { icon: Check, label: 'Saved' },
    pending: { icon: Cloud, label: 'Unsaved changes' },
    idle: { icon: Cloud, label: 'Up to date' },
  }
  const { icon: Icon, label } = map[status] || map.idle

  return (
    <span
      className="inline-flex items-center gap-1.5 px-1 text-xs text-slate-500"
      aria-live="polite"
    >
      {Icon ? (
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      ) : (
        <Spinner className="h-3.5 w-3.5" />
      )}
      {label}
    </span>
  )
}

/**
 * The split-screen builder.
 *
 * Owns the single source of truth for the resume being edited. `ResumeForm`
 * and `JobMatchPanel` are fully controlled — they hand edits back through
 * callbacks, so the live preview and the debounced autosave both react to the
 * same object and can never drift apart.
 */
const ResumeBuilder = () => {
  const { resumeId } = useParams()
  const toast = useToast()
  const { aiEnabled } = useAuth()

  const [resume, setResume] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const [tab, setTab] = useState('edit') // edit | match
  const [zoom, setZoom] = useState(0.6)
  const [autoFit, setAutoFit] = useState(true)
  const [shareOpen, setShareOpen] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  const sheetRef = useRef(null)
  const previewPaneRef = useRef(null)

  /* ------------------------------------------------------------------ load */

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError(null)

    api
      .getResume(resumeId)
      .then(({ resume: loaded }) => {
        if (!cancelled) setResume(loaded)
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message || 'Could not load this resume')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [resumeId])

  /* -------------------------------------------------------------- autosave */

  // Only the editable fields feed the debounce, so server metadata coming back
  // from a PATCH (updatedAt) can't trigger another save.
  const draft = useMemo(() => (resume ? toUpdatePayload(resume) : null), [resume])

  // Deliberately does not write the response back into state. Doing so would
  // produce a new `resume` object, hence a new `draft`, which the autosave
  // effect would read as a fresh edit and save again — forever. The server
  // owns updatedAt and the builder never displays it.
  const persist = useCallback(
    async (payload) => {
      if (!payload) return
      await api.updateResume(resumeId, payload)
    },
    [resumeId],
  )

  const { status, error: saveError, saveNow } = useAutosave({
    value: draft,
    onSave: persist,
    enabled: Boolean(resume),
  })

  // Warn before a hard reload/close while a save is still queued.
  useEffect(() => {
    if (status !== 'pending' && status !== 'saving') return

    const onBeforeUnload = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [status])

  /* ------------------------------------------------------------ zoom / fit */

  // Fit the sheet to the pane on resize until the user picks a zoom manually.
  useEffect(() => {
    if (!autoFit) return
    const pane = previewPaneRef.current
    if (!pane || typeof ResizeObserver === 'undefined') return

    const fit = () => {
      const available = pane.clientWidth - 48 // breathing room either side
      if (available <= 0) return
      setZoom(Math.min(1, Math.max(0.3, available / SHEET_WIDTH)))
    }

    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(pane)
    return () => observer.disconnect()
  }, [autoFit, tab])

  const stepZoom = (direction) => {
    setAutoFit(false)
    setZoom((current) => {
      const index = ZOOM_STEPS.findIndex((step) => step >= current - 0.001)
      const from = index === -1 ? ZOOM_STEPS.length - 1 : index
      const next = from + direction
      return ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, Math.max(0, next))]
    })
  }

  /* ----------------------------------------------------- AI apply handlers */

  const applySummary = (text) => {
    setResume((current) => ({ ...current, professional_summary: text }))
    toast.success('Summary replaced')
  }

  /** Appends a suggested bullet to the most recent experience entry. */
  const appendBullet = (bullet) => {
    setResume((current) => {
      const experience = current.experience?.length
        ? [...current.experience]
        : [createEmptyExperience()]

      const target = { ...experience[0] }
      target.description = [target.description?.trim(), `- ${bullet}`]
        .filter(Boolean)
        .join('\n')
      experience[0] = target

      return { ...current, experience }
    })
    toast.success('Bullet added to your latest role')
  }

  const addSkill = (skill) => {
    setResume((current) => {
      const skills = current.skills || []
      if (skills.some((s) => s.toLowerCase() === skill.toLowerCase())) {
        return current
      }
      return { ...current, skills: [...skills, skill] }
    })
  }

  /* ------------------------------------------------------------ share / PDF */

  const shareUrl = `${window.location.origin}/view/${resumeId}`

  const toggleVisibility = async (makePublic) => {
    setSharing(true)
    try {
      // This endpoint answers with the flag and share URL, not a full resume.
      const result = await api.setResumeVisibility(resumeId, makePublic)
      setResume((current) => ({ ...current, public: result.public }))
      toast.success(makePublic ? 'Share link is live' : 'Resume is private again')
    } catch (err) {
      toast.error(err.message || 'Could not change visibility')
    } finally {
      setSharing(false)
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 1800)
    } catch {
      toast.error('Copy failed — select the link and copy it manually')
    }
  }

  const downloadPdf = async () => {
    // Flush pending edits first so the file matches what the user sees.
    if (status === 'pending') await saveNow()
    if (!sheetRef.current) return
    printResume(sheetRef.current, buildFilename(resume))
  }

  /* ---------------------------------------------------------------- render */

  if (loading) return <FullPageSpinner label="Opening your resume" />

  if (loadError) {
    return (
      <div className="mx-auto max-w-md px-5 py-20 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-red-500" aria-hidden="true" />
        <h1 className="mt-3 text-lg font-semibold text-slate-900">
          Could not open this resume
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{loadError}</p>
        <Link
          to="/app"
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:text-teal-800"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to my resumes
        </Link>
      </div>
    )
  }

  return (
    // h-full fills the Layout's <main>, which has a definite height. The two
    // panes below then scroll independently instead of the whole page moving.
    <div className="flex h-full flex-col overflow-hidden">
      {/* ----------------------------------------------------------- toolbar */}
      <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-slate-200 bg-white px-4 py-2 print:hidden">
        <Link
          to="/app"
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Resumes</span>
        </Link>

        <div className="h-5 w-px bg-slate-200" aria-hidden="true" />

        <input
          value={resume.title || ''}
          onChange={(event) =>
            setResume((current) => ({ ...current, title: event.target.value }))
          }
          aria-label="Resume title"
          maxLength={120}
          className="min-w-0 max-w-[16rem] flex-1 rounded-lg border border-transparent px-2 py-1 text-sm font-semibold text-slate-900 transition-colors hover:border-slate-300 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
        />

        <SaveIndicator status={status} error={saveError} onRetry={saveNow} />

        <div className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            icon={resume.public ? Globe : Lock}
            onClick={() => setShareOpen(true)}
          >
            <span className="hidden sm:inline">
              {resume.public ? 'Public' : 'Share'}
            </span>
          </Button>

          <Button size="sm" icon={Download} onClick={downloadPdf}>
            <span className="hidden sm:inline">PDF</span>
          </Button>
        </div>
      </div>

      {/* -------------------------------------------------------- split view */}
      {/* Below lg the two panes stack and the whole area scrolls as one; from
          lg up they sit side by side and scroll independently. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        {/* ----------------------------------------------------- left column */}
        <div className="flex w-full flex-col border-slate-200 lg:min-h-0 lg:w-[46%] lg:max-w-2xl lg:border-r print:hidden">
          <div
            role="tablist"
            aria-label="Editor panels"
            className="flex shrink-0 gap-1 border-b border-slate-200 bg-white px-3 pt-2"
          >
            {[
              { id: 'edit', label: 'Edit', icon: Pencil },
              { id: 'match', label: 'Job match', icon: Target },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={`-mb-px inline-flex items-center gap-1.5 rounded-t-lg border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                  tab === id
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>

          <div className="bg-slate-50 p-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            {tab === 'edit' ? (
              <ResumeForm resume={resume} onChange={setResume} aiEnabled={aiEnabled} />
            ) : (
              <JobMatchPanel
                resume={resume}
                resumeId={resumeId}
                aiEnabled={aiEnabled}
                initialJobDescription={resume.target_job_description || ''}
                onApplySummary={applySummary}
                onAppendBullet={appendBullet}
                onAddSkill={addSkill}
              />
            )}
          </div>
        </div>

        {/* ---------------------------------------------------- right column */}
        <div className="flex flex-1 flex-col bg-slate-200/60 lg:min-h-0">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-300/70 bg-white/70 px-3 py-1.5 print:hidden">
            <p className="text-xs font-medium text-slate-600">Live preview</p>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => stepZoom(-1)}
                disabled={zoom <= ZOOM_STEPS[0]}
                aria-label="Zoom out"
                className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-200 disabled:opacity-40"
              >
                <Minus className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <span className="w-10 text-center text-xs tabular-nums text-slate-600">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => stepZoom(1)}
                disabled={zoom >= 1}
                aria-label="Zoom in"
                className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-200 disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setAutoFit(true)}
                aria-pressed={autoFit}
                title="Fit to window"
                className={`ml-1 rounded-md p-1 transition-colors hover:bg-slate-200 ${
                  autoFit ? 'text-teal-600' : 'text-slate-500'
                }`}
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div
            ref={previewPaneRef}
            className="p-6 lg:min-h-0 lg:flex-1 lg:overflow-auto print:overflow-visible print:p-0"
          >
            <ResumeSheet
              ref={sheetRef}
              resume={resume}
              scale={zoom}
              className="mx-auto"
            />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------- share modal */}
      <Modal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title="Share this resume"
        footer={
          <Button variant="secondary" onClick={() => setShareOpen(false)}>
            Done
          </Button>
        }
      >
        <p className="text-sm leading-relaxed text-slate-600">
          A public link lets anyone with the URL view and download this resume. It
          stays private until you turn sharing on, and revoking it takes effect
          immediately.
        </p>

        <div className="mt-4 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          {resume.public ? (
            <Globe
              className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
              aria-hidden="true"
            />
          ) : (
            <Lock
              className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
              aria-hidden="true"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900">
              {resume.public ? 'Public link is on' : 'This resume is private'}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
              {resume.public
                ? 'Anyone with the link can view it.'
                : 'Only you can see it while signed in.'}
            </p>
          </div>
          <Button
            size="sm"
            variant={resume.public ? 'secondary' : 'primary'}
            loading={sharing}
            onClick={() => toggleVisibility(!resume.public)}
          >
            {resume.public ? 'Turn off' : 'Turn on'}
          </Button>
        </div>

        {resume.public && (
          <div className="mt-3 flex items-center gap-2">
            <input
              readOnly
              value={shareUrl}
              onFocus={(event) => event.target.select()}
              aria-label="Public resume link"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
            <Button
              size="sm"
              variant="secondary"
              icon={linkCopied ? Check : Copy}
              onClick={copyLink}
            >
              {linkCopied ? 'Copied' : 'Copy'}
            </Button>
            <a
              href={shareUrl}
              target="_blank"
              rel="noreferrer"
              title="Open in a new tab"
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default ResumeBuilder
