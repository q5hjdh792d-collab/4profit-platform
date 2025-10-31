'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function TradersPage() {
  const [data, setData] = useState({ items: [], total: 0 })
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/traders')
    const json = await res.json()
    setData(json)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const requestContact = async (trader) => {
    const res = await fetch('/api/contact/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trader_id: trader.id }) })
    const j = await res.json()
    if (!res.ok) {
      toast.error(j.error || 'Failed')
    } else {
      toast.success('Request sent')
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Traders</h1>
        <Button onClick={load} variant="secondary">Refresh</Button>
      </div>

      {loading ? <p className="text-muted-foreground">Loading...</p> : (
        <div className="grid md:grid-cols-3 gap-4">
          {(data.items||[]).map((t) => (
            <Card key={t.id} className="hover:shadow-lg transition">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full object-cover" />
                  <div className="flex-1">
                    <Link href={`/traders/${t.slug}`} className="hover:underline">{t.name}</Link>
                    <div className="text-xs text-muted-foreground">{t.country} • {t.experience_years}y • {t.risk_level}</div>
                  </div>
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
          ))}
        </div>
      )}
    </div>
  )
}
