const pino = require('pino')
const { config } = require('./env')

// ── Structured application logger ─────────────────────────────────────────
// JSON logs in production (machine-parseable for log aggregators); pretty,
// colourised logs in development. Silent during tests to keep output clean.
const logger = pino({
  level: config.isTest ? 'silent' : config.LOG_LEVEL,
  base: { service: 'spacio-api' },
  transport:
    config.isProd || config.isTest
      ? undefined
      : {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:HH:MM:ss',
            ignore: 'pid,hostname,service',
          },
        },
})

module.exports = logger
