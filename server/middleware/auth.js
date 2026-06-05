const jwt = require('jsonwebtoken')
const { config } = require('../config/env')

// Verifies the "Authorization: Bearer <token>" access token and attaches the
// decoded payload to req.user for downstream handlers.
const authMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token, authorization denied' })
  }

  const token = authHeader.split(' ')[1]

  try {
    req.user = jwt.verify(token, config.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Token is not valid' })
  }
}

module.exports = authMiddleware
