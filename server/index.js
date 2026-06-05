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

  const server = app.listen(config.PORT, () => {
    logger.info(`Spacio API running on http://localhost:${config.PORT}`)
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
