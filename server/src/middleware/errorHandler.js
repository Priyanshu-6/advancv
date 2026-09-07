import { env } from '../config/env.js'
import { ApiError } from '../utils/ApiError.js'

/** Catch-all for unmatched routes. */
export const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`))
}

/**
 * Central error translator. Normalises ApiError, Mongoose validation/cast
 * errors, and JWT errors into a consistent JSON shape:
 *   { success: false, message, details? }
 */
export const errorHandler = (error, req, res, _next) => {
  let statusCode = error.statusCode || 500
  let message = error.message || 'Internal server error'
  let details = error.details

  if (error.name === 'ValidationError' && error.errors) {
    statusCode = 400
    message = 'Validation failed'
    details = Object.fromEntries(
      Object.entries(error.errors).map(([field, err]) => [field, err.message]),
    )
  } else if (error.name === 'CastError') {
    statusCode = 400
    message = `Invalid value for "${error.path}"`
  } else if (error.code === 11000) {
    statusCode = 409
    message = 'That record already exists'
    details = error.keyValue
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Invalid authentication token'
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Your session has expired. Please sign in again.'
  }

  if (statusCode >= 500) {
    console.error('[error]', error)
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
    ...(env.isProduction ? {} : { stack: error.stack }),
  })
}
