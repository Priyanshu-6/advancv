/**
 * Error type carrying an HTTP status code, so controllers can throw
 * meaningful failures and a single middleware can translate them into
 * responses.
 */
export class ApiError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.details = details
    Error.captureStackTrace?.(this, ApiError)
  }

  static badRequest(message = 'Bad request', details) {
    return new ApiError(400, message, details)
  }

  static unauthorized(message = 'Authentication required') {
    return new ApiError(401, message)
  }

  static forbidden(message = 'You do not have access to this resource') {
    return new ApiError(403, message)
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message)
  }

  static serviceUnavailable(message = 'Service unavailable') {
    return new ApiError(503, message)
  }
}

/**
 * Wraps an async route handler so rejected promises reach Express's error
 * pipeline instead of becoming unhandled rejections.
 */
export const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next)
