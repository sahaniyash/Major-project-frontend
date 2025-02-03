import mongoose from 'mongoose'

// Define the type for cached mongoose instance
interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

// Declare global mongoose type
declare global {
  var mongoose: MongooseCache | undefined
}

const MONGODB_URI = process.env.MONGODB_URI!

if (!process.env.MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable')
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null }

global.mongoose = cached

async function dbConnect() {
  if (cached?.conn) {
    return cached.conn
  }

  if (!cached?.promise) {
    const opts = {
        bufferCommands: false,
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }

    try {
        cached.promise = mongoose.connect(MONGODB_URI, opts)
    } catch (error) {
        console.error('MongoDB connection error: ', error)
        throw error
    }
  }
  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }
  return cached.conn
}

export default dbConnect