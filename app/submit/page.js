'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function SubmitPage(){
  const router = useRouter()
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    avatar: '',
    displayName: '',
    country: '',
    languages: '',
    styles: '',
    assets: '',
    experienceYears: '',
    riskLevel: 'medium',
    about: '',
    links: { tradingview:'', telegram:'', x:'', youtube:'', website:'', email:'' },
    metrics: { cagr:'', maxDrawdown:'', winRate:'' },
    caseStudies: '',
    consent: false
  })

  useEffect(() => {
    (async () => {
      const r = await fetch('/api/session', { cache: 'no-store' })
      const j = await r.json()
      setRole(j.user?.role || null)
      setLoading(false)
      if (!j.user) router.replace('/auth')
    })()
  }, [router])

  const onSubmit = async () => {
    if (role !== 'trader') { toast.error('Only traders can submit'); return }
    const payload = {
      ...form,
      languages: form.languages.split(',').map(s=>s.trim()).filter(Boolean),
      styles: form.styles.split(',').map(s=>s.trim()).filter(Boolean),
      assets: form.assets.split(',').map(s=>s.trim()).filter(Boolean),
      caseStudies: form.caseStudies.split('\n').map(s=>s.trim()).filter(Boolean).slice(0,5),
      metrics: { cagr: Number(form.metrics.cagr||0), maxDrawdown: Number(form.metrics.maxDrawdown||0), winRate: Number(form.metrics.winRate||0) },
      consent: !!form.consent
    }
    const r = await fetch('/api/submit', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload) })
    if (!r.ok) {
      const j = await r.json().catch(()=>({}))
      toast.error(j.error || 'Failed')
    } else {
      toast.success('Submitted')
      router.replace('/submit/success')
    }
  }

  if (loading) return <div className="container mx-auto py-8">Loading...</div>
  if (role !== 'trader') return <div className="container mx-auto py-8">Only traders can access this page.</div>

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-2xl font-semibold">Trader Onboarding</h1>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-3">
          <Input placeholder="Avatar URL" value={form.avatar} onChange={e=>setForm({...form, avatar:e.target.value})} />
          <Input placeholder="Display name" value={form.displayName} onChange={e=>setForm({...form, displayName:e.target.value})} />
          <Input placeholder="Country (e.g., US)" value={form.country} onChange={e=>setForm({...form, country:e.target.value})} />
          <Input placeholder="Languages (comma)" value={form.languages} onChange={e=>setForm({...form, languages:e.target.value})} />
          <Input placeholder="Styles (intraday,swing,position)" value={form.styles} onChange={e=>setForm({...form, styles:e.target.value})} />
          <Input placeholder="Assets (stocks,crypto,FX)" value={form.assets} onChange={e=>setForm({...form, assets:e.target.value})} />
          <Input placeholder="Experience years" value={form.experienceYears} onChange={e=>setForm({...form, experienceYears:e.target.value})} />
          <Input placeholder="Risk level (low|medium|high)" value={form.riskLevel} onChange={e=>setForm({...form, riskLevel:e.target.value})} />
          <Textarea placeholder="About" className="md:col-span-2" value={form.about} onChange={e=>setForm({...form, about:e.target.value})} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Links & Metrics</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-3">
          <Input placeholder="TradingView URL" value={form.links.tradingview} onChange={e=>setForm({...form, links:{...form.links, tradingview:e.target.value}})} />
          <Input placeholder="Telegram handle (e.g., @name)" value={form.links.telegram} onChange={e=>setForm({...form, links:{...form.links, telegram:e.target.value}})} />
          <Input placeholder="X/Twitter URL" value={form.links.x} onChange={e=>setForm({...form, links:{...form.links, x:e.target.value}})} />
          <Input placeholder="YouTube URL" value={form.links.youtube} onChange={e=>setForm({...form, links:{...form.links, youtube:e.target.value}})} />
          <Input placeholder="Website URL" value={form.links.website} onChange={e=>setForm({...form, links:{...form.links, website:e.target.value}})} />
          <Input placeholder="Contact Email" value={form.links.email} onChange={e=>setForm({...form, links:{...form.links, email:e.target.value}})} />
          <Input placeholder="CAGR %" value={form.metrics.cagr} onChange={e=>setForm({...form, metrics:{...form.metrics, cagr:e.target.value}})} />
          <Input placeholder="Max Drawdown %" value={form.metrics.maxDrawdown} onChange={e=>setForm({...form, metrics:{...form.metrics, maxDrawdown:e.target.value}})} />
          <Input placeholder="Win Rate %" value={form.metrics.winRate} onChange={e=>setForm({...form, metrics:{...form.metrics, winRate:e.target.value}})} />
          <Textarea placeholder="Case studies (one per line, up to 5)" className="md:col-span-2" value={form.caseStudies} onChange={e=>setForm({...form, caseStudies:e.target.value})} />
          <label className="flex items-center gap-2 md:col-span-2 text-sm"><input type="checkbox" checked={form.consent} onChange={e=>setForm({...form, consent:e.target.checked})}/> I confirm information is accurate and agree to be listed.</label>
          <div className="md:col-span-2"><Button onClick={onSubmit}>Submit for Review</Button></div>
        </CardContent>
      </Card>
    </div>
  )
}
