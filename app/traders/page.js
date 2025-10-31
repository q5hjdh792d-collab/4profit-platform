'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Heart, Scale, RefreshCw } from 'lucide-react'

export default function TradersPage() {
  const [data, setData] = useState({ items: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ assets: '', styles: '', languages: '', risk_level: '', experience_min: '', experience_max: '', has_youtube: false, has_telegram: false, has_tradingview: false })

  const qs = useMemo(() => {
    const q = new URLSearchParams()
    Object.entries(filters).forEach(([k,v]) => {
      if (v === true) q.set(k, '1')
      else if (v) q.set(k, String(v))
    })
    return q.toString()
  }, [filters])

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/traders' + (qs ? `?${qs}` : ''))
    const json = await res.json()
    setData(json)
    setLoading(false)
  }

  useEffect(() => { load() }, [qs])

  const requestContact = async (trader) => {
    const res = await fetch('/api/contact/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trader_id: trader.id }) })
    const j = await res.json()
    if (!res.ok) {
      toast.error(j.error || 'Failed')
    } else {
      toast.success('Request sent')
    }
  }

  const toggleFav = async (trader) => {
    const r = await fetch('/api/favorites/toggle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trader_id: trader.id }) })
    if (r.ok) { toast.success('Updated'); load() } else { toast.error('Failed') }
  }
  const addCompare = async (trader) => {
    const r = await fetch('/api/compare/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trader_id: trader.id }) })
    const j = await r.json()
    if (r.ok) { toast.success('Added to compare'); load() } else { toast.error(j.error || 'Failed') }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Traders</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={load}><RefreshCw className="w-4 h-4"/> Refresh</Button>
          <Link className="text-sm underline" href="/compare">Compare</Link>
          <Link className="text-sm underline" href="/favorites">Favorites</Link>
        </div>
      </div>

      <div className="grid md:grid-cols-6 gap-2 text-sm">
        <input placeholder="assets=stocks,crypto" className="px-3 py-2 rounded-md bg-secondary" value={filters.assets} onChange={e=>setFilters(s=>({...s, assets:e.target.value}))}/>
        <input placeholder="styles=intraday" className="px-3 py-2 rounded-md bg-secondary" value={filters.styles} onChange={e=>setFilters(s=>({...s, styles:e.target.value}))}/>
        <input placeholder="languages=en,ru" className="px-3 py-2 rounded-md bg-secondary" value={filters.languages} onChange={e=>setFilters(s=>({...s, languages:e.target.value}))}/>
        <input placeholder="risk=low|medium|high" className="px-3 py-2 rounded-md bg-secondary" value={filters.risk_level} onChange={e=>setFilters(s=>({...s, risk_level:e.target.value}))}/>
        <input placeholder="exp_min" className="px-3 py-2 rounded-md bg-secondary" value={filters.experience_min} onChange={e=>setFilters(s=>({...s, experience_min:e.target.value}))}/>
        <input placeholder="exp_max" className="px-3 py-2 rounded-md bg-secondary" value={filters.experience_max} onChange={e=>setFilters(s=>({...s, experience_max:e.target.value}))}/>
        <label className="flex items-center gap-2"><input type="checkbox" checked={filters.has_telegram} onChange={e=>setFilters(s=>({...s, has_telegram:e.target.checked}))}/> Telegram</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={filters.has_youtube} onChange={e=>setFilters(s=>({...s, has_youtube:e.target.checked}))}/> YouTube</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={filters.has_tradingview} onChange={e=>setFilters(s=>({...s, has_tradingview:e.target.checked}))}/> TradingView</label>
      </div>

      {loading ? <p className="text-muted-foreground">Loading...</p> : (
        <div className="grid md:grid-cols-3 gap-4">
          {(data.items||[]).map((t) => {
            const now = Date.now()
            const boosted = t.listing?.boosted_until && new Date(t.listing.boosted_until).getTime() > now
            const pro = !!t.listing?.is_pro
            const verified = !!t.is_verified
            return (
            <Card key={t.id} className="hover:shadow-lg transition">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full object-cover" />
                  <div className="flex-1">
                    <Link href={`/traders/${t.slug}`} className="hover:underline">{t.name}</Link>
                    <div className="text-xs text-muted-foreground">{t.country} • {t.experience_years}y • {t.risk_level}</div>
                    <div className="flex gap-2 mt-1">
                      {boosted && <Badge variant="default">BOOST</Badge>}
                      {pro && <Badge variant="secondary">PRO</Badge>}
                      {verified && <Badge>VERIFIED</Badge>}
                    </div>
                  </div>
                  <button title="Favorite" onClick={()=>toggleFav(t)} className={`p-2 rounded-md ${t._favorite ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'}`}>♥</button>
                  <button title="Add to compare" onClick={()=>addCompare(t)} className={`p-2 rounded-md ${t._in_compare ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>⇄</button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {(t.assets||[]).map(a => <Badge key={a} variant="secondary">{a}</Badge>)}
                  {(t.styles||[]).map(s => <Badge key={s}>{s}</Badge>)}
                </div>
                <div className="text-sm text-muted-foreground">CAGR {t.metrics?.CAGR}% • MDD {t.metrics?.max_drawdown}% • Win {t.metrics?.win_rate}%</div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Telegram:</span> {t.links?.telegram || '—'}<br/>
                  <span className="text-muted-foreground">Email:</span> {t.links?.email || '—'}
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => requestContact(t)}>Request Contact</Button>
                  <Button variant="secondary" asChild><Link href={`/traders/${t.slug}`}>View</Link></Button>
                </div>
              </CardContent>
            </Card>
          )})}
        </div>
      )}
    </div>
  )
}
