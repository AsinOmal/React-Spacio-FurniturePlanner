const { z } = require('zod')

// ── Centralised, validated environment configuration ──────────────────────
// Single source of truth for every env var (especially the JWT secrets, which
// were previously read under inconsistent names in different files). Validates
// at boot and fails fast in production rather than silently mis-authenticating.

const KNOWN_FALLBACKS = ['fallback_secret', 'fallback_refresh_secret', 'changeme']

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5005),
  MONGODB_URI: z.string().min(1).default('mongodb://localhost:27017/spacio'),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  // Accept REFRESH_TOKEN_SECRET as an alias so docs/.env that use either name work.
  JWT_SECRET: z.string().optional(),
  JWT_REFRESH_SECRET: z.string().optional(),
  REFRESH_TOKEN_SECRET: z.string().optional(),
  LOG_LEVEL: z.string().optional(),
})

function loadConfig(raw = process.env) {
  const parsed = envSchema.safeParse(raw)
  if (!parsed.success) {
    console.error('❌ Invalid environment configuration:', parsed.error.flatten().fieldErrors)
    process.exit(1)
  }

  const env = parsed.data
  const isProd = env.NODE_ENV === 'production'

  // Resolve the refresh secret from either supported name.
  const refreshSecret = env.JWT_REFRESH_SECRET || env.REFRESH_TOKEN_SECRET
  const accessSecret = env.JWT_SECRET

  if (isProd) {
    // In production, both secrets must be present, distinct, and non-trivial.
    const problems = []
    if (!accessSecret) problems.push('JWT_SECRET is required')
    if (!refreshSecret) problems.push('JWT_REFRESH_SECRET (or REFRESH_TOKEN_SECRET) is required')
    if (accessSecret && KNOWN_FALLBACKS.includes(accessSecret))
      problems.push('JWT_SECRET uses an insecure default')
    if (refreshSecret && KNOWN_FALLBACKS.includes(refreshSecret))
      problems.push('refresh secret uses an insecure default')
    if (accessSecret && refreshSecret && accessSecret === refreshSecret)
      problems.push('JWT_SECRET and the refresh secret must differ')
    if (problems.length) {
      console.error('❌ Refusing to start in production:\n  - ' + problems.join('\n  - '))
      process.exit(1)
    }
  }

  // Outside production, fall back to dev-only secrets but make the risk explicit.
  const resolvedAccess = accessSecret || 'dev_only_access_secret'
  const resolvedRefresh = refreshSecret || 'dev_only_refresh_secret'
  if (env.NODE_ENV === 'development' && (!accessSecret || !refreshSecret)) {
    console.warn(
      '⚠️  Using development JWT secrets — set JWT_SECRET and JWT_REFRESH_SECRET for anything real.'
    )
  }

  return Object.freeze({
    NODE_ENV: env.NODE_ENV,
    isProd,
    isTest: env.NODE_ENV === 'test',
    PORT: env.PORT,
    MONGODB_URI: env.MONGODB_URI,
    CLIENT_URL: env.CLIENT_URL,
    JWT_SECRET: resolvedAccess,
    JWT_REFRESH_SECRET: resolvedRefresh,
    LOG_LEVEL: env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
  })
}

module.exports = { loadConfig, config: loadConfig() }
