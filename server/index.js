require('dotenv').config()
const mongoose = require('mongoose')

const { config } = require('./config/env')
const logger = require('./config/logger')
const createApp = require('./app')

// ── Server bootstrap ──────────────────────────────────────────────────────
// Connects to Mongo, starts the HTTP listener, and shuts everything down
// cleanly on SIGINT/SIGTERM (important for Docker).

const app = createApp()

mongoose.connection.on('error', (err) => logger.error({ err }, 'MongoDB connection error'))
mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'))

async function start() {
  try {
    await mongoose.connect(config.MONGODB_URI)
    logger.info('Connected to MongoDB')
  } catch (err) {
    logger.error({ err }, 'Failed to connect to MongoDB — exiting')
    process.exit(1)
  }

  // Bind to 0.0.0.0 so the container accepts connections on all interfaces
  // (IPv4 included) — required by container platforms like Choreo/Kubernetes,
  // whose mesh dials the pod over IPv4. Binding the default (::) can refuse it.
  const server = app.listen(config.PORT, '0.0.0.0', () => {
    logger.info(`Spacio API running on http://0.0.0.0:${config.PORT}`)
  })

  const shutdown = (signal) => {
    logger.info({ signal }, 'Shutting down gracefully')
    server.close(async () => {
      await mongoose.connection.close()
      logger.info('Closed HTTP server and MongoDB connection')
      process.exit(0)
    })
    // Force-exit if cleanup hangs.
    setTimeout(() => process.exit(1), 10000).unref()
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

start()

module.exports = app
