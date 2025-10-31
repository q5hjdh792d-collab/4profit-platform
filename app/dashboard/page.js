'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const load = async () => {
    const r = await fetch('/api/dashboard/overview', { cache: 'no-store' })
    const j = await r.json()
    setData(j)
  }
  useEffect(() => { load() }, [])

  if (!data) return <div className="container mx-auto py-8">Loading...</div>

  if (!data.profile) return (
    <div className="container mx-auto py-8 space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-muted-foreground">No profile yet.</p>
      <Button asChild><Link href="/submit">Create profile</Link></Button>
    </div>
  )

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle>Profile Status</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{data.profile.status}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Views</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{data.stats.views}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Contact Requests</CardTitle></CardHeader>
          <CardContent className="text-sm">Pending: {data.stats.pending} • Accepted: {data.stats.accepted} • Declined: {data.stats.declined}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Requests</CardTitle></CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground mb-2">Last 10</div>
          <div className="space-y-2">
            {(data.recent||[]).map(r => (
              <div key={r.id} className="flex items-center justify-between border-b border-border pb-2">
                <div className="text-sm">{r.investor}</div>
                <div className="text-xs">{r.status}</div>
                <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
              </div>
            ))}
            {(!data.recent || data.recent.length===0) && <div className="text-sm text-muted-foreground">No requests yet.</div>}
          </div>
        </CardContent>
      </Card>

      <div>
        <Button asChild variant="secondary"><Link href="/submit">Edit Profile</Link></Button>
      </div>
    </div>
  )
}
