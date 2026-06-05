const rateLimit = require('express-rate-limit')

// ── Rate limiters ─────────────────────────────────────────────────────────
// Global limiter protects the whole API; the stricter auth limiter guards the
// credential endpoints (login/register) against brute-force attempts.

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' },
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later.' },
})

module.exports = { globalLimiter, authLimiter }
