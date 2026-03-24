'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { motion, AnimatePresence } from 'framer-motion'

const chips = [
  { key:'all', label:'All' },
  { key:'crypto', label:'Crypto' },
  { key:'stocks', label:'Stocks' },
  { key:'high', label:'High Yield' },
]

export default function TradersPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState('all')

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anon) { setLoading(false); return }
    const supabase = createClient(url, anon)
    const load = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('traders')
        .select('id,name,strategy_type,api_verified,pnl_percentage,bio,created_at')
        .order('created_at', { ascending: false })
      if (!error) setItems(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    if (active==='all') return items
    if (active==='crypto') return items.filter(t => (t.strategy_type||'').toLowerCase().includes('crypto'))
    if (active==='stocks') return items.filter(t => (t.strategy_type||'').toLowerCase().includes('stock'))
    if (active==='high') return items.filter(t => Number(t.pnl_percentage||0) >= 30)
    return items
  }, [items, active])

  const glassStyle = { boxShadow: 'inset 0 0 10px rgba(255,255,255,0.05)' }

  return (
    <div className="container mx-auto py-16 space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tighter">Traders</h1>
      </div>

      <div className="flex gap-3">
        {chips.map(c => (
          <button key={c.key} onClick={()=>setActive(c.key)} className={`px-3 py-1 rounded-full text-sm border ${active===c.key?'bg-slate-900 text-white border-slate-900':'bg-white/40 border-slate-300 text-slate-700'} backdrop-blur-xl`}>{c.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="grid md:grid-cols-3 gap-8 md:gap-10">
          {Array.from({length:6}).map((_,i)=> (
            <div key={i} className="rounded-2xl border border-slate-300/60 bg-black/30 p-6 md:p-8 backdrop-blur-xl animate-pulse" style={glassStyle}>
              <div className="h-5 bg-white/20 rounded w-2/3" />
              <div className="mt-3 h-3 bg-white/10 rounded w-1/2" />
              <div className="mt-5 h-3 bg-white/10 rounded w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-8 md:gap-10">
          <AnimatePresence mode="popLayout">
            {filtered.map(t => (
              <motion.div key={t.id} layout initial={{opacity:0, scale:0.98}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.98}} transition={{duration:0.2}}>
                <div className="rounded-2xl border border-slate-300/60 bg-black/30 p-6 md:p-8 backdrop-blur-xl" style={glassStyle}>
                  <div className="flex items-center justify-between">
                    <div className="font-semibold tracking-tight text-slate-900">{t.name}</div>
                    {t.api_verified && <span className="text-[10px] px-2 py-1 rounded border border-slate-400/60 bg-black/30 text-slate-200">Verified</span>}
                  </div>
                  <div className="mt-2 text-sm text-slate-700">{t.strategy_type || '—'}</div>
                  <div className="mt-4 text-xs text-slate-600 line-clamp-3">{t.bio || ''}</div>
                  <div className="mt-6 flex items-baseline gap-2">
                    <div className="text-slate-700 text-sm">PnL</div>
                    <div className="text-2xl font-bold text-slate-900">{typeof t.pnl_percentage==='number' ? `${t.pnl_percentage}%` : '—'}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
