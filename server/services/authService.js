const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { config } = require('../config/env')
const { ApiError } = require('../middleware/errorHandler')

// ── Auth business logic (no Express types here) ───────────────────────────

function generateTokens(user) {
  const payload = { userId: user._id, email: user.email }
  const accessToken = jwt.sign(payload, config.JWT_SECRET, { expiresIn: '15m' })
  const refreshToken = jwt.sign(payload, config.JWT_REFRESH_SECRET, { expiresIn: '7d' })
  return { accessToken, refreshToken }
}

async function registerUser(email, password) {
  const existing = await User.findOne({ email })
  if (existing) throw new ApiError(400, 'Email is already taken')

  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(password, salt)
  const user = await new User({ email, password: hashedPassword }).save()

  return { user, tokens: generateTokens(user) }
}

async function loginUser(email, password) {
  const user = await User.findOne({ email })
  if (!user) throw new ApiError(401, 'Invalid email or password')

  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) throw new ApiError(401, 'Invalid email or password')

  return { user, tokens: generateTokens(user) }
}

async function refreshTokens(refreshToken) {
  if (!refreshToken) throw new ApiError(401, 'No refresh token provided')

  let decoded
  try {
    decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET)
  } catch {
    throw new ApiError(403, 'Invalid or expired refresh token')
  }

  const user = await User.findById(decoded.userId)
  if (!user) throw new ApiError(401, 'User no longer exists')

  return generateTokens(user)
}

module.exports = { generateTokens, registerUser, loginUser, refreshTokens }
