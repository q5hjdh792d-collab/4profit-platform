'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

export default function TraderProfilePage() {
  const params = useParams()
  const slug = params?.slug
  const [data, setData] = useState(null)

  const load = async () => {
    const res = await fetch(`/api/trader/${slug}`)
    const j = await res.json()
    setData(j.profile)
  }

  useEffect(() => { if (slug) load() }, [slug])

  const requestContact = async () => {
    const res = await fetch('/api/contact/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trader_id: data.id }) })
    const j = await res.json()
    if (!res.ok) toast.error(j.error || 'Failed')
    else toast.success('Request sent')
  }

  if (!data) return <div className="container mx-auto py-8">Loading...</div>

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={data.avatar} alt={data.name} className="w-20 h-20 rounded-full object-cover" />
        <div>
          <h1 className="text-2xl font-semibold">{data.name}</h1>
          <div className="text-sm text-muted-foreground">{data.country} • {data.experience_years} years • {data.risk_level}</div>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 space-y-2 text-sm">
          <div><span className="text-muted-foreground">Assets:</span> {(data.assets||[]).join(', ')}</div>
          <div><span className="text-muted-foreground">Styles:</span> {(data.styles||[]).join(', ')}</div>
          <div><span className="text-muted-foreground">Languages:</span> {(data.languages||[]).join(', ')}</div>
          <div><span className="text-muted-foreground">Metrics:</span> CAGR {data.metrics?.CAGR}% • MDD {data.metrics?.max_drawdown}% • Win {data.metrics?.win_rate}%</div>
          <div><span className="text-muted-foreground">Telegram:</span> {data.links?.telegram || '—'}</div>
          <div><span className="text-muted-foreground">Email:</span> {data.links?.email || '—'}</div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={requestContact}>Request Contact</Button>
      </div>
    </div>
  )
}
