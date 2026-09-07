import { useState } from 'react'
import {
  Check,
  ClipboardCheck,
  Lightbulb,
  Target,
  TriangleAlert,
} from 'lucide-react'
import { api } from '../../lib/api'
import { Button } from '../ui/Button'
import { TextArea } from '../ui/Field'
import { Spinner } from '../ui/Spinner'

const scoreTone = (score) => {
  if (score === null) return { bar: 'bg-slate-400', text: 'text-slate-600' }
  if (score >= 75) return { bar: 'bg-emerald-500', text: 'text-emerald-700' }
  if (score >= 50) return { bar: 'bg-amber-500', text: 'text-amber-700' }
  return { bar: 'bg-red-500', text: 'text-red-700' }
}

/** Keyword pill list, tinted by whether the keyword was matched or missing. */
const KeywordList = ({ items, tone, label }) => {
  if (!items?.length) return null

  const styles =
    tone === 'matched'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
      : 'bg-amber-50 text-amber-800 ring-amber-200'

  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-slate-700">{label}</p>
      <ul className="flex flex-wrap gap-1.5">
        {items.map((keyword) => (
          <li
            key={keyword}
            className={`rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${styles}`}
          >
            {keyword}
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * The job-description matching feature.
 *
 * Sends the live resume draft (not the saved copy) plus the pasted posting to
 * /api/ai/match, then renders the score, keyword gaps, and suggested bullets.
 * Suggested bullets can be appended straight into an experience entry, and the
 * retargeted summary can replace the current one — both via callbacks so the
 * builder owns all state mutation.
 */
export const JobMatchPanel = ({
  resume,
  resumeId,
  aiEnabled,
  onApplySummary,
  onAppendBullet,
  onAddSkill,
  initialJobDescription = '',
}) => {
  const [jobDescription, setJobDescription] = useState(initialJobDescription)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [copiedIndex, setCopiedIndex] = useState(null)

  const runAnalysis = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await api.aiMatch({
        resume,
        resumeId,
        jobDescription,
      })
      setAnalysis(result.analysis)
    } catch (err) {
      setError(err.message)
      setAnalysis(null)
    } finally {
      setLoading(false)
    }
  }

  const copyBullet = async (bullet, index) => {
    try {
      await navigator.clipboard.writeText(bullet)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 1500)
    } catch {
      /* clipboard unavailable — the Add button is the primary path anyway */
    }
  }

  const tone = scoreTone(analysis?.match_score ?? null)
  const canRun = aiEnabled && jobDescription.trim().length >= 60 && !loading

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-slate-900">
            Match a job description
          </h2>
        </div>

        {!aiEnabled && (
          <div className="mb-3 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
            <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>
              AI features are off. Set <code className="text-[11px]">GEMINI_API_KEY</code>{' '}
              in <code className="text-[11px]">server/.env</code> and restart the API.
            </span>
          </div>
        )}

        <TextArea
          label="Job posting"
          rows={7}
          value={jobDescription}
          onChange={(event) => setJobDescription(event.target.value)}
          placeholder="Paste the full job description here — responsibilities, requirements, everything."
          hint={
            jobDescription.trim().length > 0 && jobDescription.trim().length < 60
              ? 'Paste a bit more — at least a couple of sentences.'
              : 'The more complete the posting, the better the suggestions.'
          }
          maxLength={6000}
          disabled={!aiEnabled}
        />

        <Button
          variant="ai"
          className="mt-3 w-full"
          onClick={runAnalysis}
          disabled={!canRun}
          loading={loading}
          icon={Target}
        >
          {analysis ? 'Re-analyse' : 'Analyse match'}
        </Button>

        {error && (
          <p className="mt-2.5 rounded-lg bg-red-50 p-2.5 text-xs leading-relaxed text-red-700">
            {error}
          </p>
        )}
      </div>

      {loading && !analysis && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-10 text-sm text-slate-500">
          <Spinner className="h-4 w-4 text-violet-600" />
          Reading the posting against your resume…
        </div>
      )}

      {analysis && (
        <>
          {/* ------------------------------------------------------- score */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Match score
              </p>
              <p className={`text-2xl font-bold tabular-nums ${tone.text}`}>
                {analysis.match_score ?? '—'}
                <span className="text-sm font-medium text-slate-400">/100</span>
              </p>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all ${tone.bar}`}
                style={{ width: `${analysis.match_score ?? 0}%` }}
              />
            </div>

            {analysis.verdict && (
              <p className="mt-3 text-xs leading-relaxed text-slate-600">
                {analysis.verdict}
              </p>
            )}
          </div>

          {/* ---------------------------------------------------- keywords */}
          {(analysis.matched_keywords?.length > 0 ||
            analysis.missing_keywords?.length > 0) && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
              <KeywordList
                items={analysis.matched_keywords}
                tone="matched"
                label="Already covered"
              />

              {analysis.missing_keywords?.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-slate-700">
                    Missing — add if genuinely true
                  </p>
                  <ul className="flex flex-wrap gap-1.5">
                    {analysis.missing_keywords.map((keyword) => (
                      <li key={keyword}>
                        <button
                          type="button"
                          onClick={() => onAddSkill?.(keyword)}
                          title={`Add "${keyword}" to your skills`}
                          className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 ring-1 ring-inset ring-amber-200 transition-colors hover:bg-amber-100"
                        >
                          + {keyword}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                    Only add skills you can speak to in an interview.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ---------------------------------------------- suggested bullets */}
          {analysis.suggested_bullets?.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Suggested bullet points
              </h3>
              <ul className="space-y-2">
                {analysis.suggested_bullets.map((bullet, index) => (
                  <li
                    key={index}
                    className="rounded-lg border border-slate-100 bg-slate-50 p-2.5"
                  >
                    <p className="text-xs leading-relaxed text-slate-700">{bullet}</p>
                    <div className="mt-2 flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => copyBullet(bullet, index)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-500 transition-colors hover:bg-white hover:text-slate-700"
                      >
                        {copiedIndex === index ? (
                          <>
                            <Check className="h-3 w-3" aria-hidden="true" />
                            Copied
                          </>
                        ) : (
                          <>
                            <ClipboardCheck className="h-3 w-3" aria-hidden="true" />
                            Copy
                          </>
                        )}
                      </button>

                      {resume.experience?.length > 0 && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onAppendBullet?.(bullet)}
                        >
                          Add to latest role
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-2.5 text-[11px] leading-relaxed text-slate-500">
                Edit these to match what you actually did. Never claim a metric you
                cannot back up.
              </p>
            </div>
          )}

          {/* --------------------------------------------- summary rewrite */}
          {analysis.summary_rewrite && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Retargeted summary
              </h3>
              <p className="rounded-lg bg-slate-50 p-2.5 text-xs leading-relaxed text-slate-700">
                {analysis.summary_rewrite}
              </p>
              <Button
                size="sm"
                variant="ai"
                icon={Check}
                className="mt-2.5 w-full"
                onClick={() => onApplySummary?.(analysis.summary_rewrite)}
              >
                Replace my summary
              </Button>
            </div>
          )}

          {/* ------------------------------------------------- focus areas */}
          {analysis.focus_areas?.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
                What to emphasise
              </h3>
              <ul className="space-y-1.5">
                {analysis.focus_areas.map((area, index) => (
                  <li
                    key={index}
                    className="flex gap-2 text-xs leading-relaxed text-slate-600"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-teal-500"
                    />
                    {area}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}
