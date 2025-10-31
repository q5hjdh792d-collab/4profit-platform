import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'
import { getDb } from '@/app/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'
import { sendMail } from '@/app/lib/mailer'

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

async function getSettings(db) {
  const s = await db.collection('settings').findOne({ key: 'global' })
  return { monthly_free_credits: s?.monthly_free_credits ?? 3 }
}

async function ensureMonthlyCredits(db, investorId) {
  const { monthly_free_credits } = await getSettings(db)
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  let doc = await db.collection('contact_credits').findOne({ user_id: investorId })
  if (!doc) {
    doc = { user_id: investorId, credits_total: monthly_free_credits, credits_used: 0, period_start: startOfMonth }
    await db.collection('contact_credits').insertOne(doc)
    return doc
  }
  if (!doc.period_start || new Date(doc.period_start) < startOfMonth) {
    await db.collection('contact_credits').updateOne({ user_id: investorId }, { $set: { credits_total: monthly_free_credits, credits_used: 0, period_start: startOfMonth } })
    doc = await db.collection('contact_credits').findOne({ user_id: investorId })
  }
  return doc
}

async function getSessionUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null
  return { id: session.user.id, email: session.user.email, role: session.user.role, name: session.user.name }
}

async function requireAuth(roles = []) {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')
  if (roles.length && !roles.includes(user.role)) throw new Error('Forbidden')
  return user
}

export async function GET(request) {
  try {
    const url = new URL(request.url)
    const pathname = url.pathname.replace('/api', '')
    const db = await getDb()

    if (pathname === '/health') {
      return json({ ok: true, ts: new Date().toISOString() })
    }

    if (pathname === '/seed') {
      if (process.env.SEED_ENABLED === 'false') return json({ error: 'Seed disabled' }, 403)
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
            email: `trader${String(idx+1).padStart(2,'0')}@4profit.dev`,
            website: ''
          },
          metrics: { CAGR: cagr, max_drawdown: mdd, win_rate: win },
          is_verified: false,
          status: 'approved',
          views: 0,
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
      const filters = { $or: [ { status: 'approved' }, { status: { $exists: false } } ] }
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

      const now = new Date()
      const dbq = db.collection('trader_profiles').aggregate([
        { $match: filters },
        { $lookup: { from: 'listings', localField: 'id', foreignField: 'trader_id', as: 'listing' } },
        { $addFields: { listing: { $first: '$listing' } } },
        { $addFields: { boosted_effective: { $cond: [ { $gt: ['$listing.boosted_until', now] }, '$listing.boosted_until', null ] }, is_pro: '$listing.is_pro' } },
        { $sort: { boosted_effective: -1, is_pro: -1, is_verified: -1, created_at: -1 } },
        { $skip: skip },
        { $limit: limit }
      ])
      const items = await dbq.toArray()

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
        const favs = await db.collection('favorites').find({ investor_id: investorId }).toArray()
        const favSet = new Set(favs.map(f => f.trader_id))
        const cmp = await db.collection('user_compare').findOne({ user_id: investorId })
        const cmpSet = new Set((cmp?.trader_ids)||[])
        items.forEach(it => { it._favorite = favSet.has(it.id); it._in_compare = cmpSet.has(it.id) })
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
      if (!user || user.id !== prof.user_id) {
        await db.collection('trader_profiles').updateOne({ id: prof.id }, { $inc: { views: 1 } })
        prof.views = (prof.views || 0) + 1
      }
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

    if (pathname === '/admin/pending') {
      const me = await requireAuth(['admin','mod'])
      const items = await db.collection('trader_profiles').aggregate([
        { $match: { status: 'pending' } },
        { $lookup: { from: 'moderation_logs', let: { t_id: '$id' }, pipeline: [
          { $match: { $expr: { $eq: ['$trader_id', '$$t_id'] } } },
          { $sort: { at: -1 } },
          { $limit: 3 }
        ], as: 'logs' } },
        { $lookup: { from: 'listings', localField: 'id', foreignField: 'trader_id', as: 'listing' } },
        { $addFields: { listing: { $first: '$listing' } } },
        { $sort: { created_at: -1 } }
      ]).toArray()
      return json({ items })
    }

    if (pathname === '/admin/settings') {
      const me = await requireAuth(['admin'])
      const s = await db.collection('settings').findOne({ key: 'global' })
      return json({ settings: { monthly_free_credits: s?.monthly_free_credits ?? 3 } })
    }

    if (pathname === '/favorites') {
      const me = await requireAuth(['investor'])
      const favs = await db.collection('favorites').find({ investor_id: me.id }).toArray()
      const ids = favs.map(f => f.trader_id)
      const items = await db.collection('trader_profiles').find({ id: { $in: ids } }).toArray()
      return json({ items })
    }

    if (pathname === '/compare') {
      const me = await requireAuth()
      const doc = await db.collection('user_compare').findOne({ user_id: me.id })
      const ids = doc?.trader_ids || []
      const items = await db.collection('trader_profiles').find({ id: { $in: ids } }).toArray()
      return json({ items, ids })
    }

    if (pathname === '/my/requests') {
      const me = await requireAuth()
      if (me.role === 'investor') {
        const list = await db.collection('contact_requests').find({ investor_id: me.id }).sort({ created_at: -1 }).toArray()
        return json({ items: list })
      }
      if (me.role === 'trader' || me.role === 'admin') {
        const myProfiles = await db.collection('trader_profiles').find({ user_id: me.id }).toArray()
        const ids = myProfiles.map(p => p.id)
        const list = await db.collection('contact_requests').find({ trader_id: { $in: ids } }).sort({ created_at: -1 }).toArray()
        return json({ items: list })
      }
      return json({ items: [] })
    }

    if (pathname === '/me/profile') {
      const me = await requireAuth(['trader'])
      const prof = await db.collection('trader_profiles').findOne({ user_id: me.id })
      return json({ profile: prof || null })
    }

    if (pathname === '/dashboard/overview') {
      const me = await requireAuth(['trader'])
      const prof = await db.collection('trader_profiles').findOne({ user_id: me.id })
      if (!prof) return json({ profile: null, stats: { views: 0, pending:0, accepted:0, declined:0 }, recent: [] })
      const [pending, accepted, declined] = await Promise.all([
        db.collection('contact_requests').countDocuments({ trader_id: prof.id, status: 'pending' }),
        db.collection('contact_requests').countDocuments({ trader_id: prof.id, status: 'accepted' }),
        db.collection('contact_requests').countDocuments({ trader_id: prof.id, status: 'declined' })
      ])
      const recent = await db.collection('contact_requests').find({ trader_id: prof.id }).sort({ created_at: -1 }).limit(10).toArray()
      const investorIds = Array.from(new Set(recent.map(r => r.investor_id)))
      const investors = await db.collection('users').find({ id: { $in: investorIds } }).toArray()
      const map = new Map(investors.map(i => [i.id, i]))
      const recentView = recent.map(r => ({ id: r.id, status: r.status, created_at: r.created_at, investor: maskContact(map.get(r.investor_id)?.email || '') }))
      return json({ profile: { id: prof.id, slug: prof.slug, status: prof.status, views: prof.views||0 }, stats: { views: prof.views||0, pending, accepted, declined }, recent: recentView })
    }

    if (pathname === '/ops/reset-credits') {
      const me = await requireAuth(['admin'])
      const now = new Date()
      const cutoff = new Date(now.getTime() - 30 * 24 * 3600 * 1000)
      const updated = await db.collection('contact_credits').updateMany({ period_start: { $lte: cutoff } }, { $set: { credits_used: 0, period_start: now } })
      return json({ ok: true, updated: updated.modifiedCount })
    }

    return json({ ok: true })
  } catch (e) {
    console.error(e)
    const msg = String(e?.message || e)
    if (msg === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (msg === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return json({ error: msg }, 500)
  }
}

export async function POST(request) {
  try {
    const url = new URL(request.url)
    const pathname = url.pathname.replace('/api', '')
    const db = await getDb()

    if (pathname === '/contact/request') {
      const me = await requireAuth(['investor'])
      const { trader_id } = await request.json()
      if (!trader_id) return json({ error: 'trader_id required' }, 400)

      const oneHourAgo = new Date(Date.now() - 3600 * 1000)
      const recent = await db.collection('contact_requests').countDocuments({ investor_id: me.id, created_at: { $gt: oneHourAgo } })
      if (recent >= 5) return json({ error: 'Rate limit: max 5 per hour' }, 429)

      const credits = await ensureMonthlyCredits(db, me.id)
      if (credits.credits_used >= credits.credits_total) return json({ error: 'No credits left' }, 402)

      const existing = await db.collection('contact_requests').findOne({ investor_id: me.id, trader_id, status: { $in: ['pending','accepted'] } })
      if (existing) return json({ ok: true, existing: true, status: existing.status })

      const reqDoc = { id: uuidv4(), trader_id, investor_id: me.id, status: 'pending', opened_until: null, created_at: new Date() }
      await db.collection('contact_requests').insertOne(reqDoc)
      await db.collection('contact_credits').updateOne({ user_id: me.id }, { $inc: { credits_used: 1 } }, { upsert: true })

      // notify trader
      try {
        const traderProfile = await db.collection('trader_profiles').findOne({ id: trader_id })
        const traderUser = await db.collection('users').findOne({ id: traderProfile.user_id })
        const subj = '4Profit: New contact request'
        const html = `<div style="font-family:sans-serif"><h2>New contact request</h2><p>Investor: ${me.email}</p><p>Profile: ${traderProfile.name}</p></div>`
        await sendMail(traderUser.email, subj, html)
      } catch (err) { console.log('notify trader skipped', err?.message) }

      return json({ ok: true, request: reqDoc })
    }

    if (pathname === '/contact/decision') {
      const me = await requireAuth(['trader','admin'])
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

      // notify investor
      try {
        const investor = await db.collection('users').findOne({ id: reqDoc.investor_id })
        const subj = `4Profit: Your request was ${accept ? 'accepted' : 'declined'}`
        const html = `<div style="font-family:sans-serif"><h2>Request ${accept ? 'accepted' : 'declined'}</h2><p>Trader: ${prof.name}</p></div>`
        await sendMail(investor.email, subj, html)
      } catch (err) { console.log('notify investor skipped', err?.message) }

      return json({ ok: true })
    }

    if (pathname === '/submit') {
      const me = await requireAuth(['trader'])
      const body = await request.json()
      if (!body?.consent) return json({ error: 'Consent required' }, 400)

      const payload = {
        avatar: body.avatar || '',
        name: body.displayName || 'Trader',
        country: body.country || '',
        languages: Array.isArray(body.languages) ? body.languages : [],
        styles: Array.isArray(body.styles) ? body.styles : [],
        assets: Array.isArray(body.assets) ? body.assets : [],
        experience_years: Number(body.experienceYears || 0),
        risk_level: body.riskLevel || 'medium',
        about: body.about || '',
        links: {
          tradingview: body.links?.tradingview || '',
          telegram: body.links?.telegram || '',
          twitter: body.links?.x || '',
          youtube: body.links?.youtube || '',
          website: body.links?.website || '',
          email: body.links?.email || ''
        },
        metrics: {
          CAGR: Number(body.metrics?.cagr || 0),
          max_drawdown: Number(body.metrics?.maxDrawdown || 0),
          win_rate: Number(body.metrics?.winRate || 0)
        },
        case_studies: Array.isArray(body.caseStudies) ? body.caseStudies.slice(0,5) : [],
        is_verified: !!body.is_verified || false,
        status: 'pending',
      }

      const existing = await db.collection('trader_profiles').findOne({ user_id: me.id })
      if (existing) {
        await db.collection('trader_profiles').updateOne({ id: existing.id }, { $set: { ...payload } })
        return json({ ok: true, id: existing.id })
      }

      const id = uuidv4()
      const slugBase = (payload.name || 'trader').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')
      const slug = `${slugBase}-${id.slice(0,6)}`
      const doc = { id, user_id: me.id, slug, created_at: new Date(), views: 0, ...payload }
      await db.collection('trader_profiles').insertOne(doc)
      await db.collection('listings').updateOne({ trader_id: id }, { $setOnInsert: { trader_id: id, is_pro: false, boosted_until: null, updated_at: new Date() } }, { upsert: true })
      return json({ ok: true, id })
    }

    if (pathname === '/admin/action') {
      const me = await requireAuth(['admin','mod'])
      const { trader_id, action, rejectionReason, edits, is_verified } = await request.json()
      const prof = await db.collection('trader_profiles').findOne({ id: trader_id })
      if (!prof) return json({ error: 'Trader not found' }, 404)

      if (action === 'approve') {
        const setObj = { status: 'approved' }
        if (typeof is_verified !== 'undefined') setObj.is_verified = !!is_verified
        await db.collection('trader_profiles').updateOne({ id: trader_id }, { $set: setObj })
        await db.collection('moderation_logs').insertOne({ id: uuidv4(), trader_id, moderator_id: me.id, action: 'approve', set: setObj, at: new Date() })
        return json({ ok: true })
      }
      if (action === 'reject') {
        await db.collection('trader_profiles').updateOne({ id: trader_id }, { $set: { status: 'rejected', rejection_reason: rejectionReason || '' } })
        await db.collection('moderation_logs').insertOne({ id: uuidv4(), trader_id, moderator_id: me.id, action: 'reject', reason: rejectionReason || '', at: new Date() })
        return json({ ok: true })
      }
      if (action === 'edit') {
        const allowed = ['avatar','name','country','languages','styles','assets','experience_years','risk_level','about','links','metrics','case_studies','is_verified']
        const set = {}
        for (const k of allowed) if (edits && typeof edits[k] !== 'undefined') set[k] = edits[k]
        if (Object.keys(set).length) await db.collection('trader_profiles').updateOne({ id: trader_id }, { $set: set })
        await db.collection('moderation_logs').insertOne({ id: uuidv4(), trader_id, moderator_id: me.id, action: 'edit', edits: set, at: new Date() })
        return json({ ok: true })
      }
      return json({ error: 'Unknown action' }, 400)
    }

    if (pathname === '/admin/listing') {
      const me = await requireAuth(['admin'])
      const { trader_id, is_pro, boosted_until } = await request.json()
      const set = { updated_at: new Date() }
      if (typeof is_pro !== 'undefined') set.is_pro = !!is_pro
      if (typeof boosted_until !== 'undefined') set.boosted_until = boosted_until ? new Date(boosted_until) : null
      await db.collection('listings').updateOne({ trader_id }, { $set: set }, { upsert: true })
      await db.collection('moderation_logs').insertOne({ id: uuidv4(), trader_id, moderator_id: me.id, action: 'listing', edits: set, at: new Date() })
      return json({ ok: true })
    }

    if (pathname === '/admin/settings') {
      const me = await requireAuth(['admin'])
      const { monthly_free_credits } = await request.json()
      await db.collection('settings').updateOne({ key: 'global' }, { $set: { key: 'global', monthly_free_credits: Number(monthly_free_credits || 3) } }, { upsert: true })
      return json({ ok: true })
    }

    if (pathname === '/favorites/toggle') {
      const me = await requireAuth(['investor'])
      const { trader_id } = await request.json()
      if (!trader_id) return json({ error: 'trader_id required' }, 400)
      const existing = await db.collection('favorites').findOne({ investor_id: me.id, trader_id })
      if (existing) {
        await db.collection('favorites').deleteOne({ investor_id: me.id, trader_id })
        return json({ ok: true, favorited: false })
      }
      await db.collection('favorites').insertOne({ investor_id: me.id, trader_id, created_at: new Date() })
      return json({ ok: true, favorited: true })
    }

    if (pathname === '/compare/add') {
      const me = await requireAuth()
      const { trader_id } = await request.json()
      if (!trader_id) return json({ error: 'trader_id required' }, 400)
      const doc = await db.collection('user_compare').findOne({ user_id: me.id })
      const arr = doc?.trader_ids || []
      if (arr.includes(trader_id)) return json({ ok: true, ids: arr })
      if (arr.length >= 3) return json({ error: 'Max 3 traders in compare' }, 400)
      const next = [...arr, trader_id]
      await db.collection('user_compare').updateOne({ user_id: me.id }, { $set: { user_id: me.id, trader_ids: next, updated_at: new Date() } }, { upsert: true })
      return json({ ok: true, ids: next })
    }

    if (pathname === '/compare/remove') {
      const me = await requireAuth()
      const { trader_id } = await request.json()
      const doc = await db.collection('user_compare').findOne({ user_id: me.id })
      const arr = doc?.trader_ids || []
      const next = arr.filter(id => id !== trader_id)
      await db.collection('user_compare').updateOne({ user_id: me.id }, { $set: { user_id: me.id, trader_ids: next, updated_at: new Date() } }, { upsert: true })
      return json({ ok: true, ids: next })
    }

    return json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 })
  }
}
