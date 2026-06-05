const { z } = require('zod')
const { config } = require('../config/env')
const { asyncHandler, ApiError } = require('../middleware/errorHandler')
const authService = require('../services/authService')

const credentialsSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
})

function parseCredentials(body) {
  const result = credentialsSchema.safeParse(body)
  if (!result.success) throw new ApiError(400, result.error.issues[0].message)
  return result.data
}

function setRefreshCookie(res, refreshToken) {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: config.isProd,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  })
}

const register = asyncHandler(async (req, res) => {
  const { email, password } = parseCredentials(req.body)
  const { user, tokens } = await authService.registerUser(email, password)
  setRefreshCookie(res, tokens.refreshToken)
  req.log.info({ userId: user._id }, 'User registered')
  res.status(201).json({ token: tokens.accessToken, email: user.email })
})

const login = asyncHandler(async (req, res) => {
  const { email, password } = parseCredentials(req.body)
  const { user, tokens } = await authService.loginUser(email, password)
  setRefreshCookie(res, tokens.refreshToken)
  req.log.info({ userId: user._id }, 'User logged in')
  res.status(200).json({ token: tokens.accessToken, email: user.email })
})

const refresh = asyncHandler(async (req, res) => {
  const tokens = await authService.refreshTokens(req.cookies.refreshToken)
  setRefreshCookie(res, tokens.refreshToken)
  res.status(200).json({ token: tokens.accessToken })
})

const logout = asyncHandler(async (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: config.isProd,
    sameSite: 'strict',
  })
  res.status(200).json({ message: 'Successfully logged out' })
})

module.exports = { register, login, refresh, logout }
