import { OAuth2Client } from 'google-auth-library'
import { env, features } from '../config/env.js'
import { User } from '../models/User.js'
import { ApiError, asyncHandler } from '../utils/ApiError.js'
import { createSessionToken } from '../services/tokenService.js'

const googleClient = features.googleAuth
  ? new OAuth2Client(env.googleClientId)
  : null

/**
 * POST /api/auth/google
 *
 * Body: { credential } — the ID token issued by Google Identity Services in
 * the browser. We verify the signature and audience server-side; the browser
 * is never trusted to assert who the user is.
 */
export const loginWithGoogle = asyncHandler(async (req, res) => {
  if (!googleClient) {
    throw ApiError.serviceUnavailable(
      'Google sign-in is not configured. Set GOOGLE_CLIENT_ID on the server.',
    )
  }

  const { credential } = req.body || {}
  if (!credential || typeof credential !== 'string') {
    throw ApiError.badRequest('A Google "credential" token is required')
  }

  let payload
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: env.googleClientId,
    })
    payload = ticket.getPayload()
  } catch {
    throw ApiError.unauthorized('Google sign-in could not be verified')
  }

  if (!payload?.sub || !payload.email) {
    throw ApiError.unauthorized('Google account is missing required details')
  }
  if (payload.email_verified === false) {
    throw ApiError.unauthorized('Your Google email address is not verified')
  }

  // Upsert: first sign-in creates the account, later ones refresh the profile.
  const user = await User.findOneAndUpdate(
    { googleId: payload.sub },
    {
      $set: {
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        picture: payload.picture || '',
        lastLoginAt: new Date(),
      },
      $setOnInsert: { googleId: payload.sub },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  )

  res.json({
    success: true,
    token: createSessionToken(user),
    user: user.toPublicJSON(),
  })
})

/** GET /api/auth/me — returns the signed-in user, for session restore. */
export const getCurrentUser = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toPublicJSON() })
})

/**
 * GET /api/auth/config
 *
 * Lets the frontend discover the Google client ID and whether AI features are
 * available, so the UI can degrade gracefully instead of showing dead buttons.
 */
export const getAuthConfig = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    googleClientId: env.googleClientId || null,
    features: {
      googleAuth: features.googleAuth,
      ai: features.gemini,
    },
  })
})
