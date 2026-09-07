import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Download, FileQuestion, Sparkles } from 'lucide-react'
import { api } from '../lib/api'
import { buildFilename, printResume } from '../lib/pdfExport'
import { ResumeSheet, SHEET_WIDTH } from '../components/ResumeSheet'
import { Button } from '../components/ui/Button'
import { FullPageSpinner } from '../components/ui/Spinner'

/**
 * Public, unauthenticated view of a shared resume.
 *
 * Reads from /api/resumes/public/:id, which 404s for private resumes — so a
 * revoked link is indistinguishable from one that never existed.
 */
const Preview = () => {
  const { resumeId } = useParams()

  // One state object tagged with the id it belongs to. Keeping the fetch result
  // and its key together means the effect never has to synchronously reset
  // "loading" — a stale id simply reads as still-loading.
  const [fetched, setFetched] = useState({ id: null, resume: null, error: null })
  const [scale, setScale] = useState(1)

  const sheetRef = useRef(null)
  const paneRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    api
      .getPublicResume(resumeId)
      .then(({ resume: loaded }) => {
        if (!cancelled) setFetched({ id: resumeId, resume: loaded, error: null })
      })
      .catch((err) => {
        if (cancelled) return
        setFetched({
          id: resumeId,
          resume: null,
          error: err.message || 'This resume is not available',
        })
      })

    return () => {
      cancelled = true
    }
  }, [resumeId])

  const loading = fetched.id !== resumeId
  const error = fetched.error
  const resume = fetched.resume

  // Shrink the A4 sheet on narrow screens so it never overflows horizontally.
  useEffect(() => {
    if (!resume) return
    const pane = paneRef.current
    if (!pane || typeof ResizeObserver === 'undefined') return

    const fit = () => {
      const available = pane.clientWidth
      if (available <= 0) return
      setScale(Math.min(1, available / SHEET_WIDTH))
    }

    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(pane)
    return () => observer.disconnect()
  }, [resume])

  if (loading) return <FullPageSpinner label="Loading resume" />

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <div className="max-w-md text-center">
          <FileQuestion
            className="mx-auto h-9 w-9 text-slate-400"
            aria-hidden="true"
          />
          <h1 className="mt-3 text-lg font-semibold text-slate-900">
            Resume not available
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            This link may have been turned off by its owner, or it never existed.
          </p>
          <Link
            to="/"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:text-teal-800"
          >
            Build your own resume with AdvanCV
          </Link>
        </div>
      </div>
    )
  }

  const name = resume.personal_info?.full_name?.trim()

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-[850px] items-center justify-between gap-4 px-5 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {name || 'Resume'}
            </p>
            {resume.personal_info?.profession && (
              <p className="truncate text-xs text-slate-500">
                {resume.personal_info.profession}
              </p>
            )}
          </div>

          <Button
            size="sm"
            icon={Download}
            onClick={() =>
              sheetRef.current &&
              printResume(sheetRef.current, buildFilename(resume))
            }
          >
            <span className="hidden sm:inline">Download PDF</span>
            <span className="sm:hidden">PDF</span>
          </Button>
        </div>
      </header>

      <main
        ref={paneRef}
        className="mx-auto max-w-[850px] px-3 py-6 print:max-w-none print:p-0"
      >
        <ResumeSheet
          ref={sheetRef}
          resume={resume}
          scale={scale}
          className="mx-auto"
        />
      </main>

      <footer className="pb-10 text-center print:hidden">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200 transition-colors hover:text-slate-900"
        >
          <Sparkles className="h-3.5 w-3.5 text-violet-600" aria-hidden="true" />
          Made with AdvanCV — build yours free
        </Link>
      </footer>
    </div>
  )
}

export default Preview
