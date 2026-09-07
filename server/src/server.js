import { createApp } from './app.js'
import { connectDatabase, disconnectDatabase } from './config/database.js'
import { env, reportConfigWarnings } from './config/env.js'

const start = async () => {
  reportConfigWarnings()

  await connectDatabase()

  const app = createApp()
  const server = app.listen(env.port, () => {
    console.log(`[server] AdvanCV API listening on http://localhost:${env.port}`)
    console.log(`[server] allowed origins: ${env.clientOrigins.join(', ')}`)
  })

  const shutdown = async (signal) => {
    console.log(`\n[server] ${signal} received, shutting down`)
    server.close(async () => {
      await disconnectDatabase()
      process.exit(0)
    })
    // Don't hang forever on a stuck connection.
    setTimeout(() => process.exit(1), 10_000).unref()
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

start().catch((error) => {
  console.error('[server] failed to start:', error.message)
  process.exit(1)
})
