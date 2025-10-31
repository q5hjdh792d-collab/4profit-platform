'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function DashboardPage() {
  const [items, setItems] = useState([])

  const load = async () => {
    const r = await fetch('/api/my/requests', { cache: 'no-store' })
    const j = await r.json()
    setItems(j.items || [])
  }
  useEffect(() => { load() }, [])

  const decide = async (id, accept) => {
    const r = await fetch('/api/contact/decision', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ request_id: id, accept }) })
    if (!r.ok) {
      const j = await r.json().catch(()=>({}))
      toast.error(j.error || 'Action failed')
    } else {
      toast.success(accept ? 'Accepted' : 'Declined')
      load()
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <Card>
        <CardHeader>
          <CardTitle>Contact Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(items||[]).length === 0 && <div className="text-sm text-muted-foreground">No requests yet.</div>}
          {(items||[]).map(r => (
            <div key={r.id} className="flex items-center justify-between border-b border-border pb-3">
              <div className="text-sm">Investor: {r.investor_id.slice(0,8)}.. • Status: {r.status}</div>
              <div className="flex gap-2">
                {r.status === 'pending' && <>
                  <Button size="sm" onClick={() => decide(r.id, true)}>Accept</Button>
                  <Button size="sm" variant="secondary" onClick={() => decide(r.id, false)}>Decline</Button>
                </>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
