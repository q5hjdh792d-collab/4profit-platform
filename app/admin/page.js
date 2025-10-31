'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

function Editor({ item, onChange }){
  const [local, setLocal] = useState(()=>({
    displayName: item.name || '',
    riskLevel: item.risk_level || 'medium',
    links: { tradingview:item.links?.tradingview||'', telegram:item.links?.telegram||'', x:item.links?.twitter||'', youtube:item.links?.youtube||'', website:item.links?.website||'', email:item.links?.email||'' },
    is_verified: !!item.is_verified
  }))
  useEffect(()=>{ onChange && onChange(local) },[local, onChange])
  return (
    <div className="grid md:grid-cols-2 gap-2">
      <div>
        <Input placeholder="Display name" value={local.displayName} onChange={e=>setLocal(s=>({...s, displayName:e.target.value}))} />
        <div className="text-[10px] text-muted-foreground">Required on approval</div>
      </div>
      <div>
        <Input placeholder="Risk level (low|medium|high)" value={local.riskLevel} onChange={e=>setLocal(s=>({...s, riskLevel:e.target.value}))} />
        <div className="text-[10px] text-muted-foreground">One of low/medium/high</div>
      </div>
      <div>
        <Input placeholder="https://tradingview.com/u/username" value={local.links.tradingview} onChange={e=>setLocal(s=>({...s, links:{...s.links, tradingview:e.target.value}}))} />
        <div className="text-[10px] text-muted-foreground">Must start with http</div>
      </div>
      <div>
        <Input placeholder="@handle" value={local.links.telegram} onChange={e=>setLocal(s=>({...s, links:{...s.links, telegram:e.target.value}}))} />
        <div className="text-[10px] text-muted-foreground">Format @handle</div>
      </div>
      <Input placeholder="https://x.com/username" value={local.links.x} onChange={e=>setLocal(s=>({...s, links:{...s.links, x:e.target.value}}))} />
      <Input placeholder="https://youtube.com/@channel" value={local.links.youtube} onChange={e=>setLocal(s=>({...s, links:{...s.links, youtube:e.target.value}}))} />
      <Input placeholder="https://your-site.com" value={local.links.website} onChange={e=>setLocal(s=>({...s, links:{...s.links, website:e.target.value}}))} />
      <Input placeholder="email@domain.com" value={local.links.email} onChange={e=>setLocal(s=>({...s, links:{...s.links, email:e.target.value}}))} />
      <label className="flex items-center gap-2 text-sm md:col-span-2"><input type="checkbox" checked={local.is_verified} onChange={e=>setLocal(s=>({...s, is_verified:e.target.checked}))}/> Verified</label>
    </div>
  )
}

export default function AdminPage(){
  const [role, setRole] = useState(null)
  const [items, setItems] = useState([])
  const [rejectReason, setRejectReason] = useState('')
  const [edits, setEdits] = useState({})
  const [settings, setSettings] = useState({ monthly_free_credits: 3 })

  const load = async () => {
    const s = await fetch('/api/session', { cache: 'no-store' }).then(r=>r.json())
    setRole(s.user?.role || null)
    if (s.user?.role === 'admin' || s.user?.role === 'mod') {
      const r = await fetch('/api/admin/pending', { cache: 'no-store' })
      const j = await r.json()
      setItems(j.items||[])
      if (s.user?.role === 'admin') {
        const sr = await fetch('/api/admin/settings').then(r=>r.json())
        setSettings(sr.settings)
      }
    }
  }
  useEffect(()=>{ load() },[])

  const saveEdits = async (trader_id) => {
    const e = edits[trader_id]
    if (!e) return
    const toSend = { edits: { name: e.displayName, risk_level: e.riskLevel, links: { tradingview:e.links.tradingview, telegram:e.links.telegram, twitter:e.links.x, youtube:e.links.youtube, website:e.links.website, email:e.links.email }, is_verified: !!e.is_verified } }
    const r = await fetch('/api/admin/action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trader_id, action:'edit', ...toSend }) })
    if (r.ok) { toast.success('Saved'); load() } else { const j = await r.json().catch(()=>({})); toast.error(j.error || 'Failed') }
  }

  const act = async (trader_id, action, e) => {
    const body = { trader_id, action }
    if (action==='reject') body.rejectionReason = rejectReason
    if (action==='approve' && e) body.is_verified = !!e.is_verified
    const r = await fetch('/api/admin/action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (r.ok) { toast.success('Done'); load() } else { const j = await r.json().catch(()=>({})); toast.error(j.error || 'Failed') }
  }

  const saveListing = async (trader_id, listing) => {
    const r = await fetch('/api/admin/listing', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ trader_id, ...listing }) })
    if (r.ok) { toast.success('Listing updated'); load() } else { toast.error('Failed') }
  }

  const saveSettings = async () => {
    const r = await fetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ monthly_free_credits: settings.monthly_free_credits }) })
    if (r.ok) toast.success('Settings saved'); else toast.error('Failed')
  }

  if (!role) return <div className="container mx-auto py-8">Loading...</div>
  if (!(role==='admin' || role==='mod')) return <div className="container mx-auto py-8">Access denied</div>

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-2xl font-semibold flex items-center gap-2">Moderation Queue <span className="text-xs bg-secondary px-2 py-1 rounded-md">Pending ({items.length})</span></h1>
      <div className="grid md:grid-cols-2 gap-4">
        {items.map(p => {
          const boosted = p.listing?.boosted_until && new Date(p.listing.boosted_until) > new Date()
          const orderingKey = `${boosted?'1':'0'}-${p.listing?.is_pro?'1':'0'}-${p.is_verified?'1':'0'}-${new Date(p.created_at).getTime()}`
          const [isPro, setIsPro] = useState(!!p.listing?.is_pro)
          const [boostUntil, setBoostUntil] = useState(p.listing?.boosted_until ? new Date(p.listing.boosted_until).toISOString().slice(0,16) : '')
          const quick7d = () => setBoostUntil(new Date(Date.now()+7*24*3600*1000).toISOString().slice(0,16))
          return (
          <Card key={p.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.avatar} alt={p.name} className="w-10 h-10 rounded-full object-cover" />
                <Link href={`/traders/${p.slug}`} target="_blank" className="hover:underline">{p.name}</Link>
                <span className="text-xs text-muted-foreground">({p.country})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>Assets: {p.assets?.join(', ')} • Styles: {p.styles?.join(', ')} • Exp: {p.experience_years}y • Risk: {p.risk_level}</div>
              <Editor item={p} onChange={(e)=>setEdits(s=>({ ...s, [p.id]: e }))} />
              <div className="border-t border-border pt-2 space-y-2">
                <div className="text-xs font-medium">Listing Controls</div>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isPro} onChange={e=>setIsPro(e.target.checked)} /> Pro</label>
                <div className="flex items-center gap-2">
                  <input type="datetime-local" className="px-2 py-1 rounded-md bg-secondary" value={boostUntil} onChange={e=>setBoostUntil(e.target.value)} />
                  <Button size="sm" variant="secondary" onClick={quick7d}>+7d</Button>
                  <Button size="sm" onClick={()=>saveListing(p.id, { is_pro: isPro, boosted_until: boostUntil ? new Date(boostUntil).toISOString() : null })}>Save Listing</Button>
                </div>
                <div className="text-[10px] text-muted-foreground">Ordering key: {orderingKey}</div>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button onClick={()=>saveEdits(p.id)}>Save edits</Button>
                <Button onClick={()=>act(p.id,'approve', edits[p.id])}>Approve</Button>
                <Button variant="secondary" onClick={()=>act(p.id,'reject')}>Reject</Button>
                <Input className="flex-1" placeholder="Rejection reason (optional)" value={rejectReason} onChange={e=>setRejectReason(e.target.value)} />
              </div>
              {(p.logs||[]).length>0 && (
                <div className="text-xs text-muted-foreground border-t border-border pt-2">
                  <div className="font-medium text-foreground mb-1">History</div>
                  <ul className="list-disc pl-5">
                    {p.logs.map((l,idx) => (
                      <li key={idx}>{new Date(l.at).toLocaleString()} — {l.action}{l.reason?`: ${l.reason}`:''}{l.set?` (set: ${Object.keys(l.set).join(', ')})`:''}{l.edits?` (edited: ${Object.keys(l.edits).join(', ')})`:''}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )})}
      </div>

      {role==='admin' && (
        <Card>
          <CardHeader><CardTitle>Settings</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <label className="text-sm">Monthly free contact credits</label>
            <input type="number" min={0} className="px-3 py-2 rounded-md bg-secondary" value={settings.monthly_free_credits} onChange={e=>setSettings(s=>({...s, monthly_free_credits: Number(e.target.value||0)}))} />
            <div className="flex gap-2 pt-2">
              <Button onClick={saveSettings}>Save Settings</Button>
              <Button variant="secondary" onClick={async ()=>{
                const r = await fetch('/api/ops/reset-credits')
                if (r.ok) toast.success('Reset triggered')
                else toast.error('Reset failed')
              }}>Run Monthly Reset</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
