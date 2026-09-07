import mongoose from 'mongoose'
import { Resume, TEMPLATE_IDS } from '../models/Resume.js'
import { ApiError, asyncHandler } from '../utils/ApiError.js'
import { env } from '../config/env.js'

/**
 * Fields a client is allowed to write. Anything else in the request body
 * (userId, timestamps, _id) is ignored, so a caller cannot reassign a resume
 * to another account.
 */
const WRITABLE_FIELDS = [
  'title',
  'public',
  'personal_info',
  'professional_summary',
  'skills',
  'experience',
  'education',
  'project',
  'template',
  'accent_color',
  'target_job_description',
]

const pickWritable = (body = {}) => {
  const update = {}
  for (const field of WRITABLE_FIELDS) {
    if (body[field] !== undefined) update[field] = body[field]
  }

  // Normalise a few fields that the form can submit loosely.
  if (Array.isArray(update.skills)) {
    update.skills = update.skills
      .map((skill) => String(skill).trim())
      .filter(Boolean)
  }
  if (update.template && !TEMPLATE_IDS.includes(update.template)) {
    throw ApiError.badRequest(
      `Unknown template "${update.template}". Valid options: ${TEMPLATE_IDS.join(', ')}`,
    )
  }
  return update
}

const assertValidId = (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw ApiError.badRequest('Invalid resume id')
  }
}

/** Loads a resume the caller owns, or throws 404/403. */
const findOwnedResume = async (resumeId, userId) => {
  assertValidId(resumeId)
  const resume = await Resume.findById(resumeId)
  if (!resume) throw ApiError.notFound('Resume not found')
  if (String(resume.userId) !== String(userId)) {
    throw ApiError.forbidden('This resume belongs to another account')
  }
  return resume
}

/** GET /api/resumes — the caller's resumes, newest edit first. */
export const listResumes = asyncHandler(async (req, res) => {
  const resumes = await Resume.find({ userId: req.user._id })
    .sort({ updatedAt: -1 })
    .lean()

  res.json({ success: true, resumes })
})

/** POST /api/resumes — creates a resume, seeded from the Google profile. */
export const createResume = asyncHandler(async (req, res) => {
  const body = pickWritable(req.body)

  const resume = await Resume.create({
    ...body,
    userId: req.user._id,
    title: body.title || 'Untitled Resume',
    personal_info: {
      // Pre-fill what we already know so the builder isn't fully empty.
      full_name: req.user.name,
      email: req.user.email,
      image: req.user.picture,
      ...(body.personal_info || {}),
    },
  })

  res.status(201).json({ success: true, resume: resume.toObject() })
})

/** GET /api/resumes/:resumeId — a single owned resume. */
export const getResume = asyncHandler(async (req, res) => {
  const resume = await findOwnedResume(req.params.resumeId, req.user._id)
  res.json({ success: true, resume: resume.toObject() })
})

/** PATCH /api/resumes/:resumeId — partial update, used by builder autosave. */
export const updateResume = asyncHandler(async (req, res) => {
  const resume = await findOwnedResume(req.params.resumeId, req.user._id)
  const update = pickWritable(req.body)

  Object.assign(resume, update)
  await resume.save() // save() (not findOneAndUpdate) so schema validators run

  res.json({ success: true, resume: resume.toObject() })
})

/** DELETE /api/resumes/:resumeId */
export const deleteResume = asyncHandler(async (req, res) => {
  const resume = await findOwnedResume(req.params.resumeId, req.user._id)
  await resume.deleteOne()
  res.json({ success: true, message: 'Resume deleted' })
})

/** POST /api/resumes/:resumeId/duplicate — copy an existing resume. */
export const duplicateResume = asyncHandler(async (req, res) => {
  const source = await findOwnedResume(req.params.resumeId, req.user._id)
  const copy = source.toObject()

  delete copy._id
  delete copy.createdAt
  delete copy.updatedAt

  const resume = await Resume.create({
    ...copy,
    title: `${source.title} (copy)`,
    public: false, // a duplicate should not inherit a live share link
  })

  res.status(201).json({ success: true, resume: resume.toObject() })
})

/**
 * POST /api/resumes/:resumeId/share — toggles public visibility and returns
 * the shareable URL.
 */
export const setResumeVisibility = asyncHandler(async (req, res) => {
  const resume = await findOwnedResume(req.params.resumeId, req.user._id)
  const { public: isPublic } = req.body || {}

  if (typeof isPublic !== 'boolean') {
    throw ApiError.badRequest('"public" must be true or false')
  }

  resume.public = isPublic
  await resume.save()

  res.json({
    success: true,
    public: resume.public,
    shareUrl: resume.public
      ? `${env.clientUrl.replace(/\/$/, '')}/view/${resume._id}`
      : null,
  })
})

/**
 * GET /api/resumes/public/:resumeId — unauthenticated read for the public
 * /view/:resumeId page. Only resumes explicitly marked public are returned,
 * and a private resume yields 404 rather than 403 so ids aren't enumerable.
 */
export const getPublicResume = asyncHandler(async (req, res) => {
  assertValidId(req.params.resumeId)

  const resume = await Resume.findOne({
    _id: req.params.resumeId,
    public: true,
  })
    .select('-userId -target_job_description')
    .lean()

  if (!resume) {
    throw ApiError.notFound('This resume is not available')
  }

  res.json({ success: true, resume })
})
