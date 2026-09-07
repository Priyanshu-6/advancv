import {
  analyseJobDescription,
  generateSummary,
  improveDescription,
  suggestSkills,
} from '../services/geminiService.js'
import { Resume } from '../models/Resume.js'
import { ApiError, asyncHandler } from '../utils/ApiError.js'

/**
 * AI endpoints accept either a `resumeId` (loaded from the DB, ownership
 * checked) or an inline `resume` object — the builder holds unsaved edits in
 * component state, so it sends the live draft rather than forcing a save first.
 */
const resolveResume = async (req) => {
  const { resumeId, resume } = req.body || {}

  // An inline draft wins over the stored copy. The builder sends both — the id
  // so the JD can be persisted and ownership verified, the object because it
  // holds edits that have not been flushed by autosave yet. Analysing the
  // saved version would silently ignore what the user is looking at.
  if (resumeId) {
    const found = await Resume.findById(resumeId).select('userId')
    if (!found) throw ApiError.notFound('Resume not found')
    if (String(found.userId) !== String(req.user._id)) {
      throw ApiError.forbidden('This resume belongs to another account')
    }

    if (resume && typeof resume === 'object') return resume

    const full = await Resume.findById(resumeId)
    return full.toObject()
  }

  if (resume && typeof resume === 'object') return resume

  throw ApiError.badRequest('Provide either a resumeId or a resume object')
}

/** POST /api/ai/summary */
export const postSummary = asyncHandler(async (req, res) => {
  const resume = await resolveResume(req)
  const result = await generateSummary({ resume, tone: req.body?.tone })
  res.json({ success: true, ...result })
})

/** POST /api/ai/improve — rewrite one description into bullets. */
export const postImprove = asyncHandler(async (req, res) => {
  const { text, context, kind, jobDescription } = req.body || {}
  const result = await improveDescription({ text, context, kind, jobDescription })
  res.json({ success: true, ...result })
})

/** POST /api/ai/skills */
export const postSkills = asyncHandler(async (req, res) => {
  const resume = await resolveResume(req)
  const result = await suggestSkills({
    resume,
    jobDescription: req.body?.jobDescription,
  })
  res.json({ success: true, ...result })
})

/**
 * POST /api/ai/match — the JD analysis feature.
 * Persists the job description when a saved resumeId was supplied, so the
 * panel can restore it on the next visit.
 */
export const postJobMatch = asyncHandler(async (req, res) => {
  const resume = await resolveResume(req)
  const { jobDescription, resumeId } = req.body || {}

  const result = await analyseJobDescription({ resume, jobDescription })

  if (resumeId) {
    await Resume.updateOne(
      { _id: resumeId, userId: req.user._id },
      { $set: { target_job_description: String(jobDescription).slice(0, 6000) } },
    )
  }

  res.json({ success: true, analysis: result })
})
