import { ApiError } from '../utils/ApiError.js'

/**
 * Minimal in-memory fixed-window rate limiter.
 *
 * Good enough to stop a runaway loop or a single abusive session from burning
 * through the Gemini quota. It is per-process and resets on restart — if you
 * deploy multiple instances, swap this for express-rate-limit backed by Redis.
 */
export const createRateLimiter = ({
  windowMs = 60_000,
  max = 20,
  message = 'Too many requests. Please slow down.',
} = {}) => {
  const hits = new Map()

  // Drop expired buckets periodically so the map cannot grow unbounded.
  const sweeper = setInterval(() => {
    const now = Date.now()
    for (const [key, bucket] of hits) {
      if (bucket.resetAt <= now) hits.delete(key)
    }
  }, windowMs)
  sweeper.unref?.()

  return (req, res, next) => {
    // Key on user id when authenticated, else IP.
    const key = req.user ? `u:${req.user._id}` : `ip:${req.ip}`
    const now = Date.now()
    const bucket = hits.get(key)

    if (!bucket || bucket.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs })
      return next()
    }

    bucket.count += 1
    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000)
      res.set('Retry-After', String(retryAfter))
      return next(new ApiError(429, message))
    }
    next()
  }
}

/** AI calls are the expensive ones: 15 per minute per user. */
export const aiRateLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 15,
  message:
    'You have made a lot of AI requests in a short time. Please wait a moment and try again.',
})

/** Broad safety net on the whole API surface. */
export const globalRateLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 300,
})
