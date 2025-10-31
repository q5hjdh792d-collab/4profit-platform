import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'
import { getDb } from '@/app/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'

function json(data, init = 200) {
  return NextResponse.json(data, { status: typeof init === 'number' ? init : 200, headers: { 'Cache-Control': 'no-store' } })
}

function maskContact(text = '') {
  if (!text) return ''
  if (text.includes('@')) {
    const [name, domain] = text.split('@')
    const masked = name.slice(0, 2) + '***' + name.slice(-1)
    return `${masked}@${domain}`
  }
  if (text.startsWith('http')) return text
  if (text.startsWith('@')) return '@' + text.slice(1, 2) + '***' + text.slice(-1)
  return text.slice(0, 2) + '***' + text.slice(-1)
}

async function ensureMonthlyCredits(db, investorId, monthly = 3) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  let doc = await db.collection('contact_credits').findOne({ user_id: investorId })
  if (!doc) {
    doc = { user_id: investorId, credits_total: monthly, credits_used: 0, period_start: startOfMonth }
    await db.collection('contact_credits').insertOne(doc)
    return doc
  }
  if (!doc.period_start || new Date(doc.period_start) < startOfMonth) {
    await db.collection('contact_credits').updateOne({ user_id: investorId }, { $set: { credits_total: monthly, credits_used: 0, period_start: startOfMonth } })
    doc = await db.collection('contact_credits').findOne({ user_id: investorId })
  }
  return doc
}

async function getSessionUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null
  return { id: session.user.id, email: session.user.email, role: session.user.role, name: session.user.name }
}

async function requireAuth() {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')
  return user
}

export async function GET(request) {
  try {
    const url = new URL(request.url)
    const pathname = url.pathname.replace('/api', '')
    const db = await getDb()

    if (pathname === '/seed') {
      const seededFlag = await db.collection('meta').findOne({ key: 'seed_v1' })
      if (seededFlag) return json({ ok: true, seeded: false })

      const password = await bcrypt.hash('Passw0rd!', 10)
      const users = [
        { id: uuidv4(), name: 'Admin', email: 'admin@4profit.dev', role: 'admin', password },
        { id: uuidv4(), name: 'Investor One', email: 'investor1@4profit.dev', role: 'investor', password },
        { id: uuidv4(), name: 'Investor Two', email: 'investor2@4profit.dev', role: 'investor', password },
      ]
      for (let i = 1; i <= 10; i++) {
        users.push({ id: uuidv4(), name: `Trader ${i}`, email: `trader${String(i).padStart(2,'0')}@4profit.dev`, role: 'trader', password })
      }
      await db.collection('users').insertMany(users)

      const avatars = [
        'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1629425733761-caae3b5f2e50?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
        'https://images.pexels.com/photos/2381069/pexels-photo-2381069.jpeg',
        'https://images.pexels.com/photos/762020/pexels-photo-762020.jpeg',
        'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg',
        'https://images.unsplash.com/photo-1642257859842-c95f9fa8121d?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1600607687920-4ce8c559d2b8?auto=format&fit=crop&w=400&q=80'
      ]
      const assetsOptions = [['stocks'], ['crypto'], ['FX'], ['stocks','crypto'], ['stocks','FX']]
      const stylesOptions = [['intraday'], ['swing'], ['position'], ['intraday','swing']]
      const countries = ['US','UK','DE','RU','AE','SG','KZ','PL']
      const languages = [['en'], ['ru'], ['en','ru']]

      const traderUsers = users.filter(u => u.role === 'trader')
      const now = new Date()
      const profiles = traderUsers.map((u, idx) => {
        const experience_years = 2 + (idx % 8)
        const cagr = 10 + (idx*3) % 45
        const mdd = 8 + (idx*2) % 25
        const win = 45 + (idx*3) % 40
        return {
          id: uuidv4(),
          user_id: u.id,
          slug: `trader-${idx+1}`,
          avatar: avatars[idx % avatars.length],
          name: u.name,
          country: countries[idx % countries.length],
          languages: languages[idx % languages.length],
          styles: stylesOptions[idx % stylesOptions.length],
          assets: assetsOptions[idx % assetsOptions.length],
          experience_years,
          risk_level: ['low','medium','high'][idx % 3],
          about: 'Seasoned trader focusing on risk-adjusted returns with strict risk management. This is a demo profile.',
          links: {
            tradingview: `https://www.tradingview.com/u/demo_trader_${idx+1}/`,
            telegram: `@demo_trader_${idx+1}`,
            twitter: `https://x.com/demo_trader_${idx+1}`,
            youtube: idx % 2 === 0 ? `https://youtube.com/@demotrader${idx+1}` : '' ,
            email: `trader${String(idx+1).padStart(2,'0')}@4profit.dev`
          },
          metrics: { CAGR: cagr, max_drawdown: mdd, win_rate: win },
          is_verified: false,
          created_at: now
        }
      })
      await db.collection('trader_profiles').insertMany(profiles)

      const listings = profiles.map((p, idx) => ({ trader_id: p.id, is_pro: idx % 3 === 0, boosted_until: idx % 5 === 0 ? new Date(Date.now()+7*24*3600*1000) : null, updated_at: now }))
      await db.collection('listings').insertMany(listings)

      await db.collection('meta').insertOne({ key: 'seed_v1', at: new Date() })

      return json({ ok: true, seeded: true })
    }

    if (pathname === '/traders') {
      const q = url.searchParams
      const filters = {}
      if (q.get('assets')) filters.assets = { $in: q.get('assets').split(',') }
      if (q.get('styles')) filters.styles = { $in: q.get('styles').split(',') }
      if (q.get('languages')) filters.languages = { $in: q.get('languages').split(',') }
      if (q.get('risk_level')) filters.risk_level = q.get('risk_level')
      if (q.get('experience_min') || q.get('experience_max')) {
        filters.experience_years = {}
        if (q.get('experience_min')) filters.experience_years.$gte = Number(q.get('experience_min'))
        if (q.get('experience_max')) filters.experience_years.$lte = Number(q.get('experience_max'))
      }
      if (q.get('has_youtube')) filters['links.youtube'] = { $ne: '' }
      if (q.get('has_telegram')) filters['links.telegram'] = { $ne: '' }
      if (q.get('has_tradingview')) filters['links.tradingview'] = { $ne: '' }

      const page = Number(q.get('page') || '1')
      const limit = Math.min(Number(q.get('limit') || '20'), 50)
      const skip = (page - 1) * limit

      const dbq = db.collection('trader_profiles').aggregate([
        { $match: filters },
        { $lookup: { from: 'listings', localField: 'id', foreignField: 'trader_id', as: 'listing' } },
        { $addFields: { listing: { $first: '$listing' } } },
        { $addFields: { boosted_first: { $cond: [{ $and: ['$listing.boosted_until', { $gt: ['$listing.boosted_until', new Date()] }] }, 1, 0] } } },
        { $sort: { boosted_first: -1, 'listing.is_pro': -1, created_at: -1 } },
        { $skip: skip },
        { $limit: limit }
      ])
      const items = await dbq.toArray()

      // Mask contacts by default
      const user = await getSessionUser()
      const investorId = user?.role === 'investor' ? user.id : null
      if (investorId) {
        const open = await db.collection('contact_requests').find({ investor_id: investorId, status: 'accepted', opened_until: { $gt: new Date() } }).toArray()
        const map = new Map(open.map(o => [o.trader_id, true]))
        items.forEach(it => {
          if (!map.get(it.id)) {
            it.links = { ...it.links, email: maskContact(it.links?.email), telegram: maskContact(it.links?.telegram) }
          }
        })
      } else {
        items.forEach(it => {
          it.links = { ...it.links, email: maskContact(it.links?.email), telegram: maskContact(it.links?.telegram) }
        })
      }

      const total = await db.collection('trader_profiles').countDocuments(filters)
      return json({ items, page, limit, total })
    }

    if (pathname.startsWith('/trader/')) {
      const slug = pathname.split('/').pop()
      const prof = await db.collection('trader_profiles').findOne({ slug })
      if (!prof) return json({ error: 'Not found' }, 404)
      const user = await getSessionUser()
      let mask = true
      if (user?.role === 'investor') {
        const open = await db.collection('contact_requests').findOne({ investor_id: user.id, trader_id: prof.id, status: 'accepted', opened_until: { $gt: new Date() } })
        if (open) mask = false
      }
      if (mask) {
        prof.links = { ...prof.links, email: maskContact(prof.links?.email), telegram: maskContact(prof.links?.telegram) }
      }
      return json({ profile: prof })
    }

    if (pathname === '/session') {
      const user = await getSessionUser()
      return json({ user })
    }

    return json({ ok: true })
  } catch (e) {
    console.error(e)
    return json({ error: String(e.message || e) }, 500)
  }
}

export async function POST(request) {
  try {
    const url = new URL(request.url)
    const pathname = url.pathname.replace('/api', '')
    const db = await getDb()

    if (pathname === '/contact/request') {
      const me = await requireAuth()
      if (me.role !== 'investor') return json({ error: 'Only investors can request' }, 403)
      const { trader_id } = await request.json()
      if (!trader_id) return json({ error: 'trader_id required' }, 400)

      const oneHourAgo = new Date(Date.now() - 3600 * 1000)
      const recent = await db.collection('contact_requests').countDocuments({ investor_id: me.id, created_at: { $gt: oneHourAgo } })
      if (recent >= 5) return json({ error: 'Rate limit: max 5 per hour' }, 429)

      const credits = await ensureMonthlyCredits(db, me.id, 3)
      if (credits.credits_used >= credits.credits_total) return json({ error: 'No credits left' }, 402)

      const existing = await db.collection('contact_requests').findOne({ investor_id: me.id, trader_id, status: { $in: ['pending','accepted'] } })
      if (existing) return json({ ok: true, existing: true, status: existing.status })

      const reqDoc = { id: uuidv4(), trader_id, investor_id: me.id, status: 'pending', opened_until: null, created_at: new Date() }
      await db.collection('contact_requests').insertOne(reqDoc)
      await db.collection('contact_credits').updateOne({ user_id: me.id }, { $inc: { credits_used: 1 } }, { upsert: true })
      return json({ ok: true, request: reqDoc })
    }

    if (pathname === '/contact/decision') {
      const me = await requireAuth()
      if (me.role !== 'trader' && me.role !== 'admin') return json({ error: 'Only traders or admin' }, 403)
      const { request_id, accept } = await request.json()
      const reqDoc = await db.collection('contact_requests').findOne({ id: request_id })
      if (!reqDoc) return json({ error: 'Request not found' }, 404)

      const prof = await db.collection('trader_profiles').findOne({ id: reqDoc.trader_id })
      const owner = await db.collection('users').findOne({ id: prof.user_id })
      if (me.role !== 'admin' && owner?.id !== me.id) return json({ error: 'Forbidden' }, 403)

      if (accept) {
        await db.collection('contact_requests').updateOne({ id: request_id }, { $set: { status: 'accepted', opened_until: new Date(Date.now() + 7*24*3600*1000) } })
      } else {
        await db.collection('contact_requests').updateOne({ id: request_id }, { $set: { status: 'declined' } })
      }
      return json({ ok: true })
    }

    return json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 })
  }
}
