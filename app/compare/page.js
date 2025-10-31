'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ComparePage(){
  const [items, setItems] = useState([])
  const [ids, setIds] = useState([])
  const load = async () => {
    const r = await fetch('/api/compare', { cache: 'no-store' })
    const j = await r.json()
    setItems(j.items||[])
    setIds(j.ids||[])
  }
  useEffect(()=>{ load() },[])

  const remove = async (trader_id) => {
    const r = await fetch('/api/compare/remove', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trader_id }) })
    if (r.ok) load()
  }

  return (
    <div className="container mx-auto py-8 space-y-4">
      <h1 className="text-2xl font-semibold">Compare ({ids.length}/3)</h1>
      <div className="grid md:grid-cols-3 gap-4">
        {items.map(t => (
          <Card key={t.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                {t.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>Assets: {t.assets?.join(', ')}</div>
              <div>Styles: {t.styles?.join(', ')}</div>
              <div>Languages: {t.languages?.join(', ')}</div>
              <div>Metrics: CAGR {t.metrics?.CAGR}% • MDD {t.metrics?.max_drawdown}% • Win {t.metrics?.win_rate}%</div>
              <Button size="sm" variant="secondary" onClick={()=>remove(t.id)}>Remove</Button>
            </CardContent>
          </Card>
        ))}
      </div>
      {items.length === 0 && <div className="text-muted-foreground text-sm">Add up to 3 traders from the directory.</div>}
    </div>
  )
}
