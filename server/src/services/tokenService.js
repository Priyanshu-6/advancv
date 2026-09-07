import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { ApiError } from '../utils/ApiError.js'

const assertSecret = () => {
  if (!env.jwtSecret) {
    throw ApiError.serviceUnavailable(
      'Authentication is not configured: JWT_SECRET is missing on the server.',
    )
  }
}

/** Signs a session token for a user document. */
export const createSessionToken = (user) => {
  assertSecret()
  return jwt.sign(
    { sub: String(user._id), email: user.email },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  )
}

/** Verifies a session token, throwing on tampering or expiry. */
export const verifySessionToken = (token) => {
  assertSecret()
  return jwt.verify(token, env.jwtSecret)
}
