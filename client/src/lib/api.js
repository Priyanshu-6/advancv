/**
 * Thin fetch wrapper around the AdvanCV API.
 *
 * Uses the native fetch API rather than a HTTP library to keep the dependency
 * footprint at zero. Attaches the session JWT, normalises error responses into
 * thrown `ApiError`s, and exposes one function per endpoint.
 */

const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:5001'
).replace(/\/$/, '')

const TOKEN_KEY = 'advancv:token'

/* -------------------------------------------------------------------------- */
/* Token storage                                                              */
/* -------------------------------------------------------------------------- */

// sessionStorage/localStorage are unavailable in some embedded contexts, so
// every access is guarded and falls back to an in-memory value.
let memoryToken = null

export const getToken = () => {
  if (memoryToken) return memoryToken
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export const setToken = (token) => {
  memoryToken = token
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* in-memory only */
  }
}

/* -------------------------------------------------------------------------- */
/* Core request helper                                                        */
/* -------------------------------------------------------------------------- */

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

const request = async (path, { method = 'GET', body, auth = true } = {}) => {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(
      'Cannot reach the server. Is the API running?',
      0,
    )
  }

  // 204 and other empty bodies.
  const text = await response.text()
  const data = text ? safeParse(text) : null

  if (!response.ok) {
    throw new ApiError(
      data?.message || `Request failed (${response.status})`,
      response.status,
      data?.details,
    )
  }
  return data
}

const safeParse = (text) => {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

/* -------------------------------------------------------------------------- */
/* Auth                                                                       */
/* -------------------------------------------------------------------------- */

export const api = {
  getConfig: () => request('/api/auth/config', { auth: false }),

  loginWithGoogle: (credential) =>
    request('/api/auth/google', {
      method: 'POST',
      body: { credential },
      auth: false,
    }),

  getCurrentUser: () => request('/api/auth/me'),

  /* ------------------------------ Resumes ------------------------------- */

  listResumes: () => request('/api/resumes'),

  createResume: (payload = {}) =>
    request('/api/resumes', { method: 'POST', body: payload }),

  getResume: (resumeId) => request(`/api/resumes/${resumeId}`),

  updateResume: (resumeId, payload) =>
    request(`/api/resumes/${resumeId}`, { method: 'PATCH', body: payload }),

  deleteResume: (resumeId) =>
    request(`/api/resumes/${resumeId}`, { method: 'DELETE' }),

  duplicateResume: (resumeId) =>
    request(`/api/resumes/${resumeId}/duplicate`, { method: 'POST' }),

  setResumeVisibility: (resumeId, isPublic) =>
    request(`/api/resumes/${resumeId}/share`, {
      method: 'POST',
      body: { public: isPublic },
    }),

  getPublicResume: (resumeId) =>
    request(`/api/resumes/public/${resumeId}`, { auth: false }),

  /* -------------------------------- AI ---------------------------------- */

  aiSummary: ({ resume, tone }) =>
    request('/api/ai/summary', { method: 'POST', body: { resume, tone } }),

  aiImprove: ({ text, context, kind, jobDescription }) =>
    request('/api/ai/improve', {
      method: 'POST',
      body: { text, context, kind, jobDescription },
    }),

  aiSkills: ({ resume, jobDescription }) =>
    request('/api/ai/skills', {
      method: 'POST',
      body: { resume, jobDescription },
    }),

  aiMatch: ({ resume, resumeId, jobDescription }) =>
    request('/api/ai/match', {
      method: 'POST',
      body: { resume, resumeId, jobDescription },
    }),
}

export { API_URL }
