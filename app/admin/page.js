'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function AdminPage(){
  const [role, setRole] = useState(null)
  const [items, setItems] = useState([])
  const [rejectReason, setRejectReason] = useState('')

  const load = async () => {
    const s = await fetch('/api/session', { cache: 'no-store' }).then(r=>r.json())
    setRole(s.user?.role || null)
    if (s.user?.role === 'admin' || s.user?.role === 'mod') {
      const r = await fetch('/api/admin/pending', { cache: 'no-store' })
      const j = await r.json()
      setItems(j.items||[])
    }
  }
  useEffect(()=>{ load() },[])

  const act = async (trader_id, action) => {
    const body = { trader_id, action }
    if (action==='reject') body.rejectionReason = rejectReason
    const r = await fetch('/api/admin/action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (r.ok) { toast.success('Done'); load() } else { const j = await r.json().catch(()=>({})); toast.error(j.error || 'Failed') }
  }

  if (!role) return <div className="container mx-auto py-8">Loading...</div>
  if (!(role==='admin' || role==='mod')) return <div className="container mx-auto py-8">Access denied</div>

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-2xl font-semibold">Moderation Queue</h1>
      <div className="grid md:grid-cols-2 gap-4">
        {items.map(p => (
          <Card key={p.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.avatar} alt={p.name} className="w-10 h-10 rounded-full object-cover" />
                {p.name} <span className="text-xs text-muted-foreground">({p.country})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>Assets: {p.assets?.join(', ')}</div>
              <div>Styles: {p.styles?.join(', ')}</div>
              <div>Experience: {p.experience_years} years • Risk: {p.risk_level}</div>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button onClick={()=>act(p.id,'approve')}>Approve</Button>
                  <Button variant="secondary" onClick={()=>act(p.id,'reject')}>Reject</Button>
                </div>
                <Input placeholder="Rejection reason (optional)" value={rejectReason} onChange={e=>setRejectReason(e.target.value)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
