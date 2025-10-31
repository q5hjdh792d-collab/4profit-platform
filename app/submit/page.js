'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { CheckCircle, XCircle } from 'lucide-react'

function Field({ label, required, valid, children }){
  return (
    <div className="space-y-1">
      <div className="text-sm flex items-center gap-2">
        <span>{label}{required && ' *'}</span>
        {typeof valid==='boolean' && (valid ? <CheckCircle className="w-4 h-4 text-green-500"/> : <XCircle className="w-4 h-4 text-muted-foreground"/>) }
      </div>
      {children}
    </div>
  )
}

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
    consent: false,
    is_verified: false
  })

  useEffect(() => {
    (async () => {
      const s = await fetch('/api/session', { cache: 'no-store' }).then(r=>r.json())
      setRole(s.user?.role || null)
      if (!s.user) { setLoading(false); router.replace('/auth'); return }
      if (s.user?.role === 'trader') {
        const p = await fetch('/api/me/profile', { cache: 'no-store' }).then(r=>r.json())
        if (p?.profile) {
          const prof = p.profile
          setForm(f => ({
            ...f,
            avatar: prof.avatar || '',
            displayName: prof.name || '',
            country: prof.country || '',
            languages: (prof.languages||[]).join(','),
            styles: (prof.styles||[]).join(','),
            assets: (prof.assets||[]).join(','),
            experienceYears: String(prof.experience_years || ''),
            riskLevel: prof.risk_level || 'medium',
            about: prof.about || '',
            links: { tradingview: prof.links?.tradingview||'', telegram: prof.links?.telegram||'', x: prof.links?.twitter||'', youtube: prof.links?.youtube||'', website: prof.links?.website||'', email: prof.links?.email||'' },
            metrics: { cagr: String(prof.metrics?.CAGR||''), maxDrawdown: String(prof.metrics?.max_drawdown||''), winRate: String(prof.metrics?.win_rate||'') },
            caseStudies: (prof.case_studies||[]).join('\n'),
            is_verified: !!prof.is_verified
          }))
        }
      }
      setLoading(false)
    })()
  }, [router])

  const langs = useMemo(()=>form.languages.split(',').map(s=>s.trim()).filter(Boolean),[form.languages])
  const styles = useMemo(()=>form.styles.split(',').map(s=>s.trim()).filter(Boolean),[form.styles])
  const assets = useMemo(()=>form.assets.split(',').map(s=>s.trim()).filter(Boolean),[form.assets])
  const cagr = Number(form.metrics.cagr||0)
  const dd = Number(form.metrics.maxDrawdown||0)
  const wr = Number(form.metrics.winRate||0)

  function validate() {
    const errs = []
    if (!form.displayName.trim()) errs.push('Display name is required')
    if (langs.length < 1) errs.push('At least one language is required')
    if (styles.length < 1) errs.push('At least one style is required')
    if (assets.length < 1) errs.push('At least one asset is required')
    if (isNaN(cagr) || cagr < -100 || cagr > 300) errs.push('CAGR must be between -100 and 300')
    if (isNaN(dd) || dd < -100 || dd > 0) errs.push('Max Drawdown must be between -100 and 0')
    if (isNaN(wr) || wr < 0 || wr > 100) errs.push('Win Rate must be between 0 and 100')
    if (!form.consent) errs.push('Consent is required')
    return errs
  }

  const onSubmit = async () => {
    if (role !== 'trader') { toast.error('Only traders can submit'); return }
    const errors = validate()
    if (errors.length) { errors.forEach(e => toast.error(e)); return }
    const payload = {
      ...form,
      languages: langs,
      styles: styles,
      assets: assets,
      caseStudies: form.caseStudies.split('\n').map(s=>s.trim()).filter(Boolean).slice(0,5),
      metrics: { cagr: cagr, maxDrawdown: dd, winRate: wr },
      consent: !!form.consent,
      is_verified: !!form.is_verified
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
          <Field label="Avatar URL" required={false}>{<Input placeholder="Avatar URL" value={form.avatar} onChange={e=>setForm({...form, avatar:e.target.value})} />}</Field>
          <Field label="Display name" required valid={!!form.displayName.trim()}>{<Input placeholder="Display name" value={form.displayName} onChange={e=>setForm({...form, displayName:e.target.value})} />}</Field>
          <Field label="Country" required={false}>{<Input placeholder="Country (e.g., US)" value={form.country} onChange={e=>setForm({...form, country:e.target.value})} />}</Field>
          <Field label="Languages" required valid={langs.length>0}>{<Input placeholder="Languages (comma)" value={form.languages} onChange={e=>setForm({...form, languages:e.target.value})} />}</Field>
          <Field label="Styles" required valid={styles.length>0}>{<Input placeholder="Styles (intraday,swing,position)" value={form.styles} onChange={e=>setForm({...form, styles:e.target.value})} />}</Field>
          <Field label="Assets" required valid={assets.length>0}>{<Input placeholder="Assets (stocks,crypto,FX)" value={form.assets} onChange={e=>setForm({...form, assets:e.target.value})} />}</Field>
          <Field label="Experience years" required={false}>{<Input placeholder="Experience years" value={form.experienceYears} onChange={e=>setForm({...form, experienceYears:e.target.value})} />}</Field>
          <Field label="Risk level" required={false}>{<Input placeholder="Risk level (low|medium|high)" value={form.riskLevel} onChange={e=>setForm({...form, riskLevel:e.target.value})} />}</Field>
          <div className="md:col-span-2"><Textarea placeholder="About" value={form.about} onChange={e=>setForm({...form, about:e.target.value})} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Links & Metrics</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-3">
          <Field label="TradingView" required={false}>{<Input placeholder="https://tradingview.com/u/username" value={form.links.tradingview} onChange={e=>setForm({...form, links:{...form.links, tradingview:e.target.value}})} />}</Field>
          <Field label="Telegram" required={false}>{<Input placeholder="@handle" value={form.links.telegram} onChange={e=>setForm({...form, links:{...form.links, telegram:e.target.value}})} />}</Field>
          <Field label="X/Twitter" required={false}>{<Input placeholder="https://x.com/username" value={form.links.x} onChange={e=>setForm({...form, links:{...form.links, x:e.target.value}})} />}</Field>
          <Field label="YouTube" required={false}>{<Input placeholder="https://youtube.com/@channel" value={form.links.youtube} onChange={e=>setForm({...form, links:{...form.links, youtube:e.target.value}})} />}</Field>
          <Field label="Website" required={false}>{<Input placeholder="https://your-site.com" value={form.links.website} onChange={e=>setForm({...form, links:{...form.links, website:e.target.value}})} />}</Field>
          <Field label="Contact Email" required={false}>{<Input placeholder="email@domain.com" value={form.links.email} onChange={e=>setForm({...form, links:{...form.links, email:e.target.value}})} />}</Field>
          <Field label="CAGR %" required valid={!isNaN(cagr) && cagr>=-100 && cagr<=300}>{<Input placeholder="CAGR %" value={form.metrics.cagr} onChange={e=>setForm({...form, metrics:{...form.metrics, cagr:e.target.value}})} />}</Field>
          <Field label="Max Drawdown %" required valid={!isNaN(dd) && dd>=-100 && dd<=0}>{<Input placeholder="Max Drawdown %" value={form.metrics.maxDrawdown} onChange={e=>setForm({...form, metrics:{...form.metrics, maxDrawdown:e.target.value}})} />}</Field>
          <Field label="Win Rate %" required valid={!isNaN(wr) && wr>=0 && wr<=100}>{<Input placeholder="Win Rate %" value={form.metrics.winRate} onChange={e=>setForm({...form, metrics:{...form.metrics, winRate:e.target.value}})} />}</Field>
          <div className="md:col-span-2"><Textarea placeholder="Case studies (one per line, up to 5)" value={form.caseStudies} onChange={e=>setForm({...form, caseStudies:e.target.value})} /></div>
          <label className="flex items-center gap-2 md:col-span-2 text-sm"><input type="checkbox" checked={form.consent} onChange={e=>setForm({...form, consent:e.target.checked})}/> I confirm information is accurate and agree to be listed. *</label>
          <label className="flex items-center gap-2 text-sm md:col-span-2"><input type="checkbox" checked={form.is_verified} onChange={e=>setForm({...form, is_verified:e.target.checked})}/> Request Verified badge (admin may change)</label>
          <div className="md:col-span-2"><Button onClick={onSubmit}>Submit for Review</Button></div>
        </CardContent>
      </Card>
    </div>
  )
}
