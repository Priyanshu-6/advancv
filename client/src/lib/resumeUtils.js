/**
 * Shared helpers for shaping resume data for display, plus the blank-resume
 * factory used when creating a new document.
 */

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/**
 * Formats a "YYYY-MM" value as "Mon YYYY". Passes through anything that isn't
 * in that shape (notably "Present"), so templates can render it verbatim.
 */
export const formatMonth = (value) => {
  if (!value) return ''
  const match = /^(\d{4})-(\d{1,2})$/.exec(String(value).trim())
  if (!match) return String(value)

  const [, year, month] = match
  const index = Number(month) - 1
  if (index < 0 || index > 11) return String(value)
  return `${MONTHS[index]} ${year}`
}

/** Renders a start/end pair as a single date range string. */
export const formatDateRange = (start, end, isCurrent = false) => {
  const from = formatMonth(start)
  const to = isCurrent ? 'Present' : formatMonth(end) || 'Present'
  if (!from) return to === 'Present' ? '' : to
  return `${from} — ${to}`
}

/**
 * Splits a description into displayable bullet lines. Accepts newline-
 * separated text and strips any leading bullet characters the user typed.
 */
export const toBullets = (description) =>
  String(description || '')
    .split('\n')
    .map((line) => line.replace(/^\s*[-•*]\s*/, '').trim())
    .filter(Boolean)

/** True when a section has nothing worth rendering. */
export const isEmptySection = (items) =>
  !Array.isArray(items) || items.length === 0

/** A fresh, empty resume matching the server schema defaults. */
export const createEmptyResume = (overrides = {}) => ({
  title: 'Untitled Resume',
  public: false,
  personal_info: {
    full_name: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    website: '',
    profession: '',
    image: '',
  },
  professional_summary: '',
  skills: [],
  experience: [],
  education: [],
  project: [],
  template: 'minimal',
  accent_color: '#14B8A6',
  target_job_description: '',
  ...overrides,
})

export const createEmptyExperience = () => ({
  company: '',
  position: '',
  start_date: '',
  end_date: '',
  description: '',
  is_current: false,
})

export const createEmptyEducation = () => ({
  institution: '',
  degree: '',
  field: '',
  graduation_date: '',
  gpa: '',
})

export const createEmptyProject = () => ({
  name: '',
  type: '',
  description: '',
  link: '',
})

/**
 * Rough completeness score shown on the dashboard, to nudge users toward
 * filling in the sections that matter most. Weighted, not just a field count.
 */
export const getCompleteness = (resume) => {
  const checks = [
    [Boolean(resume?.personal_info?.full_name), 15],
    [Boolean(resume?.personal_info?.email), 10],
    [Boolean(resume?.personal_info?.profession), 10],
    [Boolean(resume?.professional_summary), 20],
    [(resume?.skills?.length || 0) >= 3, 15],
    [(resume?.experience?.length || 0) >= 1, 20],
    [(resume?.education?.length || 0) >= 1, 10],
  ]

  const earned = checks.reduce(
    (total, [passed, weight]) => total + (passed ? weight : 0),
    0,
  )
  return Math.min(100, earned)
}

/** Strips server-managed fields before sending an update. */
export const toUpdatePayload = (resume) => ({
  title: resume.title,
  personal_info: resume.personal_info,
  professional_summary: resume.professional_summary,
  skills: resume.skills,
  experience: resume.experience,
  education: resume.education,
  project: resume.project,
  template: resume.template,
  accent_color: resume.accent_color,
})

/** Human-readable "3 minutes ago" style timestamps for the dashboard. */
export const timeAgo = (value) => {
  if (!value) return ''
  const then = new Date(value).getTime()
  if (Number.isNaN(then)) return ''

  const seconds = Math.round((Date.now() - then) / 1000)
  if (seconds < 60) return 'just now'

  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`

  const days = Math.round(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`

  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
