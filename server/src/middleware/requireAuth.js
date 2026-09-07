import { User } from '../models/User.js'
import { ApiError, asyncHandler } from '../utils/ApiError.js'
import { verifySessionToken } from '../services/tokenService.js'

const extractBearerToken = (req) => {
  const header = req.headers.authorization || ''
  if (!header.startsWith('Bearer ')) return null
  const token = header.slice('Bearer '.length).trim()
  return token || null
}

/**
 * Verifies the session JWT and attaches the live user document to req.user.
 * Reloading the user (rather than trusting the token payload) means a deleted
 * account stops working immediately instead of at token expiry.
 */
export const requireAuth = asyncHandler(async (req, res, next) => {
  const token = extractBearerToken(req)
  if (!token) {
    throw ApiError.unauthorized('Missing authentication token')
  }

  const payload = verifySessionToken(token)
  const user = await User.findById(payload.sub)
  if (!user) {
    throw ApiError.unauthorized('Account no longer exists')
  }

  req.user = user
  next()
})
