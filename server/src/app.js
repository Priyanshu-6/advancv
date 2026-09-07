import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import { env, features } from './config/env.js'
import { globalRateLimiter } from './middleware/rateLimit.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import authRoutes from './routes/authRoutes.js'
import resumeRoutes from './routes/resumeRoutes.js'
import aiRoutes from './routes/aiRoutes.js'

export const createApp = () => {
  const app = express()

  app.set('trust proxy', 1)

  // Only the configured frontend origins may call the API with credentials.
  app.use(
    cors({
      origin(origin, callback) {
        // Same-origin/server-to-server requests have no Origin header.
        if (!origin) return callback(null, true)
        if (env.clientOrigins.includes(origin)) return callback(null, true)
        callback(new Error(`Origin ${origin} is not allowed by CORS`))
      },
      credentials: true,
    }),
  )

  // Resume payloads include a base64 profile photo, so allow a larger body
  // than the 100kb default.
  app.use(express.json({ limit: '2mb' }))
  app.use(globalRateLimiter)

  app.get('/api/health', (req, res) => {
    res.json({
      success: true,
      status: 'ok',
      database:
        mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      features: { googleAuth: features.googleAuth, ai: features.gemini },
    })
  })

  app.use('/api/auth', authRoutes)
  app.use('/api/resumes', resumeRoutes)
  app.use('/api/ai', aiRoutes)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
