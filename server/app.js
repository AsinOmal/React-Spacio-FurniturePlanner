const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const helmet = require('helmet')
const cookieParser = require('cookie-parser')
const pinoHttp = require('pino-http')
const path = require('path')

const { config } = require('./config/env')
const logger = require('./config/logger')
const { globalLimiter } = require('./middleware/rateLimiters')
const { notFound, errorHandler } = require('./middleware/errorHandler')

const authRoutes = require('./routes/auth')
const designRoutes = require('./routes/designs')
const modelRoutes = require('./routes/models')

// Builds the Express app WITHOUT connecting to Mongo or starting a listener,
// so tests can import it side-effect-free. Bootstrap lives in index.js.
function createApp() {
  const app = express()

  // Per-request structured logging — attaches req.id and req.log.
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.headers['x-request-id'] || require('crypto').randomUUID(),
    })
  )

  app.use(helmet())
  app.use(cors({ origin: config.CLIENT_URL, credentials: true }))
  app.use(express.json({ limit: '10mb' }))
  app.use(cookieParser())
  app.use('/api', globalLimiter)

  // Static uploaded 3D models.
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

  // Readiness probe — only healthy when the DB connection is live.
  app.get('/api/health', (req, res) => {
    const dbUp = mongoose.connection.readyState === 1
    res.status(dbUp ? 200 : 503).json({
      status: dbUp ? 'ok' : 'degraded',
      db: dbUp ? 'connected' : 'disconnected',
      uptime: process.uptime(),
    })
  })

  app.use('/api/auth', authRoutes)
  app.use('/api/designs', designRoutes)
  app.use('/api/models', modelRoutes)

  app.use(notFound)
  app.use(errorHandler)

  return app
}

module.exports = createApp
