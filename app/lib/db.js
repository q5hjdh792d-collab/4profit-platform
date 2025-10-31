import { MongoClient } from 'mongodb'

const MONGO_URL = process.env.MONGODB_URI || process.env.MONGO_URL
const DB_NAME = process.env.DB_NAME || 'fourprofit'

let clientPromise
export async function getDb() {
  if (!clientPromise) {
    if (!MONGO_URL) throw new Error('MONGO_URL/MONGODB_URI missing')
    clientPromise = new MongoClient(MONGO_URL, { maxPoolSize: 10 }).connect()
  }
  const client = await clientPromise
  return client.db(DB_NAME)
}
