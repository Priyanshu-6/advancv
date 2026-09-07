import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Copy,
  ExternalLink,
  FileText,
  Globe,
  Lock,
  Plus,
  Trash2,
} from 'lucide-react'
import { api } from '../lib/api'
import { getCompleteness, timeAgo } from '../lib/resumeUtils'
import { getTemplate } from '../components/templates'
import { useToast } from '../context/ToastContext'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { TextField } from '../components/ui/Field'
import { Spinner } from '../components/ui/Spinner'

/** Thin progress bar for the completeness score. */
const CompletenessBar = ({ value }) => {
  const tone =
    value >= 80 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-500' : 'bg-slate-400'

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${tone}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-8 shrink-0 text-right text-xs tabular-nums text-slate-500">
        {value}%
      </span>
    </div>
  )
}

const ResumeCard = ({ resume, onDuplicate, onDelete, busy }) => {
  const template = getTemplate(resume.template)
  const completeness = getCompleteness(resume)

  return (
    <div className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to={`/app/builder/${resume._id}`}
            className="block truncate text-base font-semibold text-slate-900 hover:text-teal-700"
          >
            {resume.title}
          </Link>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {resume.personal_info?.profession || 'No role set'} · edited{' '}
            {timeAgo(resume.updatedAt)}
          </p>
        </div>

        <span
          className="h-7 w-7 shrink-0 rounded-lg ring-1 ring-inset ring-black/5"
          style={{ backgroundColor: resume.accent_color }}
          title={`Accent ${resume.accent_color}`}
          aria-hidden="true"
        />
      </div>

      <div className="mt-3.5">
        <CompletenessBar value={completeness} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
          {template.name}
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${
            resume.public
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {resume.public ? (
            <>
              <Globe className="h-3 w-3" aria-hidden="true" />
              Public
            </>
          ) : (
            <>
              <Lock className="h-3 w-3" aria-hidden="true" />
              Private
            </>
          )}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-3">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onDuplicate(resume)}
          disabled={busy}
          icon={Copy}
        >
          Duplicate
        </Button>

        {resume.public && (
          <a
            href={`/view/${resume._id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            View
          </a>
        )}

        <button
          type="button"
          onClick={() => onDelete(resume)}
          disabled={busy}
          aria-label={`Delete ${resume.title}`}
          className="ml-auto rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

export const Dashboard = () => {
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const toast = useToast()
  const navigate = useNavigate()

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const result = await api.listResumes()
      setResumes(result.resumes || [])
    } catch (error) {
      setLoadError(error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleCreate = async (event) => {
    event.preventDefault()
    setCreating(true)
    try {
      const result = await api.createResume({
        title: newTitle.trim() || 'Untitled Resume',
      })
      toast.success('Resume created')
      // Straight into the builder — an empty card on the dashboard is a dead end.
      navigate(`/app/builder/${result.resume._id}`)
    } catch (error) {
      toast.error(error.message)
      setCreating(false)
    }
  }

  const handleDuplicate = async (resume) => {
    setBusyId(resume._id)
    try {
      const result = await api.duplicateResume(resume._id)
      setResumes((current) => [result.resume, ...current])
      toast.success(`Duplicated "${resume.title}"`)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const target = deleteTarget
    setDeleteTarget(null)
    setBusyId(target._id)
    try {
      await api.deleteResume(target._id)
      setResumes((current) => current.filter((r) => r._id !== target._id))
      toast.success('Resume deleted')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            My resumes
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {loading
              ? 'Loading…'
              : resumes.length === 0
                ? 'Nothing here yet.'
                : `${resumes.length} resume${resumes.length === 1 ? '' : 's'}`}
          </p>
        </div>

        <Button icon={Plus} onClick={() => setCreateOpen(true)}>
          New resume
        </Button>
      </div>

      <div className="mt-7">
        {loading ? (
          <div className="flex items-center justify-center gap-2.5 py-20 text-sm text-slate-500">
            <Spinner className="h-5 w-5 text-teal-600" />
            Loading your resumes…
          </div>
        ) : loadError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm font-semibold text-red-800">
              Could not load your resumes
            </p>
            <p className="mt-1 text-sm text-red-700">{loadError}</p>
            <Button variant="secondary" className="mt-4" onClick={load}>
              Try again
            </Button>
          </div>
        ) : resumes.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <FileText className="h-6 w-6" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-base font-semibold text-slate-900">
              Create your first resume
            </h2>
            <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-slate-600">
              Start from a blank document. You can let AI draft the summary and
              bullet points once you have added your experience.
            </p>
            <Button icon={Plus} className="mt-5" onClick={() => setCreateOpen(true)}>
              New resume
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resumes.map((resume) => (
              <ResumeCard
                key={resume._id}
                resume={resume}
                busy={busyId === resume._id}
                onDuplicate={handleDuplicate}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------ create modal */}
      <Modal
        open={createOpen}
        onClose={() => !creating && setCreateOpen(false)}
        title="New resume"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setCreateOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button form="create-resume-form" type="submit" loading={creating}>
              Create and open
            </Button>
          </>
        }
      >
        <form id="create-resume-form" onSubmit={handleCreate}>
          <TextField
            label="Title"
            placeholder="e.g. Frontend Engineer — 2026"
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            hint="Just for your own reference. It does not appear on the resume."
            autoFocus
            maxLength={120}
          />
        </form>
      </Modal>

      {/* ------------------------------------------------------ delete modal */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete this resume?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} icon={Trash2}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-slate-600">
          <span className="font-semibold text-slate-900">
            {deleteTarget?.title}
          </span>{' '}
          will be permanently deleted. This cannot be undone, and any public link
          will stop working.
        </p>
      </Modal>
    </div>
  )
}

export default Dashboard
