'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

const chips = [
  { key:'all', label:'All' },
  { key:'crypto', label:'Crypto' },
  { key:'stocks', label:'Stocks' },
  { key:'high', label:'High Yield' },
]

export default function TradersPage() {
  const [data, setData] = useState({ items: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState('all')

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/traders')
    const json = await res.json()
    setData(json)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const items = data.items || []
    if (active === 'all') return items
    if (active === 'crypto') return items.filter(t => (t.assets||[]).map(a=>String(a).toLowerCase()).includes('crypto'))
    if (active === 'stocks') return items.filter(t => (t.assets||[]).map(a=>String(a).toLowerCase()).includes('stocks'))
    if (active === 'high') return items.filter(t => (t.risk_level==='high') || (Number(t.metrics?.CAGR||0) >= 30))
    return items
  }, [data.items, active])

  const requestContact = async (trader) => {
    const res = await fetch('/api/contact/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trader_id: trader.id }) })
    const j = await res.json()
    if (!res.ok) {
      toast.error(j.error || 'Failed')
    } else {
      toast.success('Request sent')
    }
  }

  const glassStyle = { boxShadow: 'inset 0 0 10px rgba(255,255,255,0.05)' }

  return (
    <div className="container mx-auto py-12 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tighter">Traders</h1>
        <div className="flex gap-2">
          <Button onClick={load} variant="secondary">Refresh</Button>
        </div>
      </div>

      <div className="flex gap-3">
        {chips.map(c => (
          <button key={c.key} onClick={()=>setActive(c.key)} className={`px-3 py-1 rounded-full text-sm border ${active===c.key?'bg-slate-900 text-white border-slate-900':'bg-white/40 border-slate-300 text-slate-700'} backdrop-blur-xl`}>{c.label}</button>
        ))}
      </div>

      {loading ? <p className="text-muted-foreground">Loading...</p> : (
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          <AnimatePresence mode="popLayout">
            {(filtered||[]).map((t) => (
              <motion.div key={t.id} layout initial={{opacity:0, scale:0.98}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.98}} transition={{duration:0.2}}>
                <Card className="hover:shadow-lg transition border-slate-300/60 bg-black/30 backdrop-blur-xl" style={glassStyle}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full object-cover" />
                      <div className="flex-1">
                        <Link href={`/traders/${t.slug}`} className="hover:underline font-semibold tracking-tight">{t.name}</Link>
                        <div className="text-xs text-muted-foreground">{t.country} • {t.experience_years}y • {t.risk_level}</div>
                        <div className="flex gap-2 mt-1">
                          {t.listing?.boosted_until && new Date(t.listing.boosted_until) > new Date() && <Badge variant="default">BOOST</Badge>}
                          {t.listing?.is_pro && <Badge variant="secondary">PRO</Badge>}
                          {t.is_verified && <Badge>VERIFIED</Badge>}
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {(t.assets||[]).map(a => <Badge key={a} variant="secondary">{a}</Badge>)}
                      {(t.styles||[]).map(s => <Badge key={s}>{s}</Badge>)}
                    </div>
                    <div className="text-sm text-muted-foreground">CAGR {t.metrics?.CAGR}% • MDD {t.metrics?.max_drawdown}% • Win {t.metrics?.win_rate}%</div>
                    <div className="flex gap-2">
                      <Button onClick={() => requestContact(t)}>Request Contact</Button>
                      <Button variant="secondary" asChild><Link href={`/traders/${t.slug}`}>View</Link></Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
