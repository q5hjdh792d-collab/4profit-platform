import Link from 'next/link'
import FounderCard from '@/app/components/FounderCard'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
'use client'

import React from 'react'

const chips = [
  { key:'all', label:'All' },
  { key:'crypto', label:'Crypto' },
  { key:'stocks', label:'Stocks' },
  { key:'high', label:'High Yield' },
]

export default function HomePage() {
  const [active, setActive] = React.useState('all')

  const items = React.useMemo(()=>[
    { id:'founder', type:'founder' },
    { id:'explore', type:'crypto' },
    { id:'plans', type:'stocks' },
    { id:'highlight', type:'high' },
  ],[])

  const filtered = items.filter(it => active==='all' || it.type===active || it.type==='founder')

  return (
    <div className="container mx-auto py-16 space-y-16">
      <section className="space-y-1 text-center">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tighter">4BASE</h1>
        <p className="text-slate-600">by ALVO13</p>
      </section>

      <div className="flex justify-center gap-3">
        {chips.map(c => (
          <button key={c.key} onClick={()=>setActive(c.key)} className={`px-3 py-1 rounded-full text-sm border ${active===c.key?'bg-slate-900 text-white border-slate-900':'bg-white/40 border-slate-300 text-slate-700'} backdrop-blur-xl`}>{c.label}</button>
        ))}
      </div>

      <section>
        <div className="grid md:grid-cols-3 gap-8 md:gap-10">
          <AnimatePresence mode="popLayout"> 
            {filtered.map((b) => (
              <motion.div key={b.id}
                layout
                initial={{ opacity:0, scale:0.98 }}
                animate={{ opacity:1, scale:1 }}
                exit={{ opacity:0, scale:0.98 }}
                transition={{ duration:0.2 }}
                className={b.id==='founder' ? 'md:col-span-1 order-1' : ''}
              >
                {b.id==='founder' && <FounderCard />}
                {b.id==='explore' && (
                  <div className="rounded-2xl border border-slate-300/60 bg-black/30 p-6 md:p-8 backdrop-blur-xl">
                    <div className="text-slate-900 font-semibold">Explore traders</div>
                    <div className="mt-6"><Button asChild variant="secondary"><Link href="/traders">Browse Traders</Link></Button></div>
                  </div>
                )}
                {b.id==='plans' && (
                  <div className="rounded-2xl border border-slate-300/60 bg-black/30 p-6 md:p-8 backdrop-blur-xl">
                    <div className="text-slate-900 font-semibold">Plans</div>
                    <div className="mt-6"><Button asChild variant="secondary"><Link href="/pricing">See Plans</Link></Button></div>
                  </div>
                )}
                {b.id==='highlight' && (
                  <div className="rounded-2xl border border-slate-300/60 bg-black/30 p-6 md:p-8 backdrop-blur-xl">
                    <div className="text-slate-900 font-semibold">High Yield</div>
                    <div className="mt-6"><Button asChild variant="secondary"><Link href="/traders?assets=crypto">Top crypto</Link></Button></div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>
    </div>
  )
}
