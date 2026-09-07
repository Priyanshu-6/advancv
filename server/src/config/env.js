import dotenv from 'dotenv'

dotenv.config()

/**
 * Reads an environment variable, falling back to `fallback` when unset.
 * Throws when a variable is required but missing so the process fails fast
 * at boot instead of at the first request.
 */
const read = (key, { fallback = undefined, required = false } = {}) => {
  const value = process.env[key]
  if (value === undefined || value === '') {
    if (required) {
      throw new Error(
        `Missing required environment variable "${key}". ` +
          'Copy server/.env.example to server/.env and fill it in.',
      )
    }
    return fallback
  }
  return value
}

const parseOrigins = (raw) =>
  String(raw)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

export const env = {
  port: Number(read('PORT', { fallback: 5001 })),
  nodeEnv: read('NODE_ENV', { fallback: 'development' }),
  isProduction: read('NODE_ENV', { fallback: 'development' }) === 'production',

  clientOrigins: parseOrigins(
    read('CLIENT_ORIGINS', { fallback: 'http://localhost:5173' }),
  ),
  clientUrl: read('CLIENT_URL', { fallback: 'http://localhost:5173' }),

  mongodbUri: read('MONGODB_URI', {
    fallback: 'mongodb://127.0.0.1:27017/advancv',
  }),

  jwtSecret: read('JWT_SECRET', { fallback: '' }),
  jwtExpiresIn: read('JWT_EXPIRES_IN', { fallback: '30d' }),

  googleClientId: read('GOOGLE_CLIENT_ID', { fallback: '' }),

  geminiApiKey: read('GEMINI_API_KEY', { fallback: '' }),
  geminiModel: read('GEMINI_MODEL', { fallback: 'gemini-2.0-flash' }),
}

/**
 * Feature flags derived from which credentials are actually present. The API
 * stays bootable without Google/Gemini keys — the relevant routes return a
 * clear 503 instead, which keeps local development friction low.
 */
export const features = {
  googleAuth: Boolean(env.googleClientId),
  gemini: Boolean(env.geminiApiKey),
}

/** Warn loudly at boot about anything that will limit functionality. */
export const reportConfigWarnings = (log = console) => {
  if (!env.jwtSecret) {
    log.warn(
      '[config] JWT_SECRET is not set. Authentication is disabled until you set it.',
    )
  }
  if (!features.googleAuth) {
    log.warn(
      '[config] GOOGLE_CLIENT_ID is not set. Google sign-in will return 503.',
    )
  }
  if (!features.gemini) {
    log.warn('[config] GEMINI_API_KEY is not set. AI routes will return 503.')
  }
}
