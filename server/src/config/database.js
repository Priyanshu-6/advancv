import mongoose from 'mongoose'
import { env } from './env.js'

/**
 * Opens the shared Mongoose connection. Mongoose maintains an internal
 * connection pool, so this is called once at startup and reused everywhere.
 */
export const connectDatabase = async () => {
  mongoose.set('strictQuery', true)

  mongoose.connection.on('connected', () => {
    console.log('[db] connected to MongoDB')
  })
  mongoose.connection.on('error', (error) => {
    console.error('[db] connection error:', error.message)
  })
  mongoose.connection.on('disconnected', () => {
    console.warn('[db] disconnected from MongoDB')
  })

  await mongoose.connect(env.mongodbUri, {
    serverSelectionTimeoutMS: 10_000,
  })

  return mongoose.connection
}

export const disconnectDatabase = () => mongoose.disconnect()
