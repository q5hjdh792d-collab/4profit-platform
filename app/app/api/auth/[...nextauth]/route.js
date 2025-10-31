import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { MongoClient } from 'mongodb'
import bcrypt from 'bcryptjs'

const MONGO_URL = process.env.MONGO_URL
const DB_NAME = process.env.DB_NAME || 'fourprofit'

let clientPromise
async function getDb() {
  if (!clientPromise) clientPromise = new MongoClient(MONGO_URL, { maxPoolSize: 10 }).connect()
  const client = await clientPromise
  return client.db(DB_NAME)
}

const authHandler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      authorize: async (credentials) => {
        try {
          const db = await getDb()
          const user = await db.collection('users').findOne({ email: credentials?.email })
          if (!user) return null
          const ok = await bcrypt.compare(credentials?.password || '', user.password || '')
          if (!ok) return null
          return { id: user.id, name: user.name, email: user.email, role: user.role }
        } catch (e) {
          console.error(e)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    }
  }
})

export { authHandler as GET, authHandler as POST }
