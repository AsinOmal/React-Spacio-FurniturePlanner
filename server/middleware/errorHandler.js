const { config } = require('../config/env')

// ── API error + error-handling middleware ─────────────────────────────────
// Replaces the per-route try/catch + console.error + res.status(500) pattern
// with one consistent path. Controllers throw `ApiError` (or any error) and
// `asyncHandler` forwards rejected promises here.

class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

// Wrap an async route handler so thrown/rejected errors reach `errorHandler`.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

// 404 for any unmatched route.
const notFound = (req, res) => {
  res.status(404).json({ error: 'Not found', path: req.originalUrl })
}

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const status = err.status || 500
  const log = req.log || require('../config/logger')

  if (status >= 500) {
    log.error({ err, requestId: req.id }, 'Unhandled error')
  } else {
    log.warn({ msg: err.message, requestId: req.id }, 'Request error')
  }

  const body = {
    error: status >= 500 && config.isProd ? 'Internal server error' : err.message,
    requestId: req.id,
  }
  if (!config.isProd && status >= 500) body.stack = err.stack
  res.status(status).json(body)
}

module.exports = { ApiError, asyncHandler, notFound, errorHandler }
