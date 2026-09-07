import { env, features } from '../config/env.js'
import { ApiError } from '../utils/ApiError.js'

/**
 * Calls the Gemini REST API directly via fetch (Node 18+) rather than pulling
 * in the SDK — the request shape is small and stable, and this keeps the
 * dependency surface minimal.
 */
const GEMINI_API_BASE =
  'https://generativelanguage.googleapis.com/v1beta/models'

const SYSTEM_INSTRUCTION =
  'You are an expert technical resume writer and career coach. You write ' +
  'concise, specific, achievement-oriented resume copy in a confident ' +
  'professional register. You never invent employers, dates, credentials, ' +
  'metrics, or technologies that are not present in the input. When the ' +
  'input lacks detail, you write about what is there rather than ' +
  'fabricating specifics. You always reply with valid JSON only, with no ' +
  'markdown fences and no commentary.'

const assertConfigured = () => {
  if (!features.gemini) {
    throw ApiError.serviceUnavailable(
      'AI features are not configured. Set GEMINI_API_KEY on the server.',
    )
  }
}

/** Issues one generateContent call and returns the raw text part. */
const callGemini = async (prompt) => {
  assertConfigured()

  const url = `${GEMINI_API_BASE}/${encodeURIComponent(env.geminiModel)}:generateContent`

  // Abort rather than letting a hung upstream call hold the request open.
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 45_000)

  let response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': env.geminiApiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
      }),
      signal: controller.signal,
    })
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new ApiError(504, 'The AI request timed out. Please try again.')
    }
    console.error('[gemini] network error:', error.message)
    throw new ApiError(502, 'Could not reach the AI service.')
  } finally {
    clearTimeout(timeout)
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    console.error(`[gemini] HTTP ${response.status}: ${body.slice(0, 500)}`)

    if (response.status === 400 || response.status === 403) {
      throw ApiError.serviceUnavailable(
        'The AI service rejected the request. Check that GEMINI_API_KEY is valid.',
      )
    }
    if (response.status === 429) {
      throw new ApiError(
        429,
        'The AI service quota has been exceeded. Please try again later.',
      )
    }
    throw new ApiError(502, 'The AI service returned an error.')
  }

  const data = await response.json()

  const blockReason = data?.promptFeedback?.blockReason
  if (blockReason) {
    throw ApiError.badRequest(
      `The AI declined this request (${blockReason}). Try rephrasing the input.`,
    )
  }

  const text = data?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('')

  if (!text) {
    throw new ApiError(502, 'The AI returned an empty response.')
  }
  return text
}

/**
 * Models sometimes wrap JSON in ```json fences despite instructions, so strip
 * them before parsing. Throws a 502-ish error if the payload is unusable.
 */
const parseJsonResponse = (raw) => {
  const cleaned = String(raw)
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()

  try {
    return JSON.parse(cleaned)
  } catch {
    // Last resort: grab the outermost JSON object/array in the text.
    const match = cleaned.match(/[[{][\s\S]*[\]}]/)
    if (match) {
      try {
        return JSON.parse(match[0])
      } catch {
        /* fall through */
      }
    }
    throw new ApiError(
      502,
      'The AI response could not be understood. Please try again.',
    )
  }
}

const generateJson = async (prompt) =>
  parseJsonResponse(await callGemini(prompt))

/** Truncates untrusted user text to keep prompts (and costs) bounded. */
const clamp = (value, max) => String(value ?? '').slice(0, max)

/**
 * Renders the resume as compact context for the model. Contact details are
 * deliberately excluded — the model does not need PII to write copy.
 */
const summariseResume = (resume = {}) => {
  const lines = []
  if (resume.personal_info?.profession) {
    lines.push(`Target role: ${clamp(resume.personal_info.profession, 120)}`)
  }
  if (resume.professional_summary) {
    lines.push(`Current summary: ${clamp(resume.professional_summary, 1200)}`)
  }
  if (resume.skills?.length) {
    lines.push(`Skills: ${resume.skills.slice(0, 40).join(', ')}`)
  }
  if (resume.experience?.length) {
    lines.push('Experience:')
    for (const job of resume.experience.slice(0, 8)) {
      lines.push(
        `- ${clamp(job.position, 100)} at ${clamp(job.company, 100)} ` +
          `(${clamp(job.start_date, 20)} to ${clamp(job.end_date, 20) || 'Present'}): ` +
          clamp(job.description, 700),
      )
    }
  }
  if (resume.education?.length) {
    lines.push('Education:')
    for (const school of resume.education.slice(0, 5)) {
      lines.push(
        `- ${clamp(school.degree, 80)} ${clamp(school.field, 80)}, ` +
          `${clamp(school.institution, 120)} (${clamp(school.graduation_date, 20)})`,
      )
    }
  }
  if (resume.project?.length) {
    lines.push('Projects:')
    for (const project of resume.project.slice(0, 6)) {
      lines.push(
        `- ${clamp(project.name, 120)} (${clamp(project.type, 80)}): ` +
          clamp(project.description, 500),
      )
    }
  }
  return lines.join('\n') || 'No resume details provided yet.'
}

/**
 * Writes or rewrites the professional summary.
 * Returns { options: string[] } — a few variants so the user can pick.
 */
export const generateSummary = async ({ resume, tone = 'professional' }) => {
  const prompt = `Write three alternative professional summaries for this resume.

Rules:
- 2 to 3 sentences each, 40-70 words.
- First person implied, no "I" or "My". Start with a strong descriptor.
- Ground every claim in the details below. Do not invent metrics or employers.
- Tone: ${clamp(tone, 40)}.
- Vary the emphasis between the three options.

Resume details:
${summariseResume(resume)}

Respond with JSON: { "options": ["...", "...", "..."] }`

  const data = await generateJson(prompt)
  const options = Array.isArray(data?.options) ? data.options : []
  return { options: options.filter((o) => typeof o === 'string').slice(0, 3) }
}

/**
 * Rewrites a single experience or project description into strong bullets.
 * Returns { bullets: string[] }.
 */
export const improveDescription = async ({
  text,
  context = '',
  kind = 'experience',
  jobDescription = '',
}) => {
  if (!clamp(text, 4000).trim()) {
    throw ApiError.badRequest('There is no text to improve yet')
  }

  const prompt = `Rewrite the following ${kind === 'project' ? 'project' : 'work experience'} description as 3 to 4 resume bullet points.

Rules:
- Start each bullet with a strong past-tense action verb (or present tense for a current role).
- One idea per bullet, 12-28 words.
- Keep every concrete technology, scope, and number that appears in the input.
- Do NOT invent metrics, percentages, team sizes, or tools that are absent.
- No leading dashes or bullet characters in the strings.
${jobDescription ? '- Where the input genuinely supports it, use vocabulary from the target job description.' : ''}

${context ? `Role context: ${clamp(context, 300)}\n` : ''}${jobDescription ? `Target job description:\n${clamp(jobDescription, 3000)}\n` : ''}
Description to rewrite:
${clamp(text, 4000)}

Respond with JSON: { "bullets": ["...", "..."] }`

  const data = await generateJson(prompt)
  const bullets = Array.isArray(data?.bullets) ? data.bullets : []
  return { bullets: bullets.filter((b) => typeof b === 'string').slice(0, 5) }
}

/** Suggests skills that fit the resume (and optionally a target JD). */
export const suggestSkills = async ({ resume, jobDescription = '' }) => {
  const prompt = `Suggest up to 12 additional resume skills for this candidate.

Rules:
- Only suggest skills that are plausible given the experience shown.
- Exclude anything already listed.
- Prefer concrete, searchable technologies and methods over soft skills.
${jobDescription ? '- Prioritise skills the target job description asks for that the candidate plausibly has.' : ''}

Resume details:
${summariseResume(resume)}
${jobDescription ? `\nTarget job description:\n${clamp(jobDescription, 3000)}` : ''}

Respond with JSON: { "skills": ["...", "..."] }`

  const data = await generateJson(prompt)
  const skills = Array.isArray(data?.skills) ? data.skills : []
  const existing = new Set(
    (resume?.skills || []).map((s) => String(s).toLowerCase()),
  )
  return {
    skills: skills
      .filter((s) => typeof s === 'string' && s.trim())
      .filter((s) => !existing.has(s.toLowerCase()))
      .slice(0, 12),
  }
}

/**
 * The JD-matching feature: compares a resume against a job description and
 * returns a match score, missing keywords, and concrete suggested bullets.
 */
export const analyseJobDescription = async ({ resume, jobDescription }) => {
  const jd = clamp(jobDescription, 6000).trim()
  if (!jd) {
    throw ApiError.badRequest('A job description is required')
  }
  if (jd.length < 60) {
    throw ApiError.badRequest(
      'That job description is too short to analyse. Paste the full posting.',
    )
  }

  const prompt = `Compare this candidate's resume against the target job description and produce tailoring advice.

Return these fields:
- "match_score": integer 0-100, how well the current resume matches the posting.
- "verdict": one sentence, plain and honest, on the overall fit.
- "matched_keywords": up to 12 important terms from the posting already evidenced in the resume.
- "missing_keywords": up to 12 important terms from the posting absent from the resume. Only include ones worth adding.
- "suggested_bullets": 4 to 6 ready-to-paste resume bullet points tailored to this posting. Each must be grounded in the candidate's actual stated experience — rephrase and reframe what they have done, never fabricate new employers, tools, or metrics. 12-28 words each.
- "summary_rewrite": a 2-3 sentence professional summary retargeted at this posting.
- "focus_areas": 2 to 4 short pieces of advice on what to emphasise or de-emphasise.

Be candid in "match_score". If the resume is a weak fit, say so rather than inflating the number.

Resume details:
${summariseResume(resume)}

Target job description:
${jd}

Respond with JSON containing exactly the keys described above.`

  const data = await generateJson(prompt)

  const stringArray = (value, limit) =>
    Array.isArray(value)
      ? value.filter((v) => typeof v === 'string' && v.trim()).slice(0, limit)
      : []

  const rawScore = Number(data?.match_score)
  return {
    match_score: Number.isFinite(rawScore)
      ? Math.max(0, Math.min(100, Math.round(rawScore)))
      : null,
    verdict: typeof data?.verdict === 'string' ? data.verdict : '',
    matched_keywords: stringArray(data?.matched_keywords, 12),
    missing_keywords: stringArray(data?.missing_keywords, 12),
    suggested_bullets: stringArray(data?.suggested_bullets, 6),
    summary_rewrite:
      typeof data?.summary_rewrite === 'string' ? data.summary_rewrite : '',
    focus_areas: stringArray(data?.focus_areas, 4),
  }
}
