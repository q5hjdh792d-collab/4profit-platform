import Link from 'next/link'
import FounderCard from '@/app/components/FounderCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function HomePage() {
  return (
    <div className="container mx-auto py-12 space-y-12">
      <section className="space-y-2 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">4BASE</h1>
        <p className="text-slate-600">by ALVO13</p>
      </section>

      <section>
        <div className="grid md:grid-cols-3 gap-4">
          {/* Pinned Founder Card (top-left) */}
          <div className="md:col-span-1 order-1">
            <FounderCard />
          </div>
          {/* Other bento cards */}
          <div className="order-2">
            <div className="rounded-2xl border border-slate-400/50 bg-black/20 p-5 backdrop-blur">
              <div className="text-sm text-slate-700">Explore traders</div>
              <div className="mt-3 text-slate-900">Filter by assets, style, languages, experience and more.</div>
              <div className="mt-4"><Button asChild variant="secondary"><Link href="/traders">Browse Traders</Link></Button></div>
            </div>
          </div>
          <div className="order-3">
            <div className="rounded-2xl border border-slate-400/50 bg-black/20 p-5 backdrop-blur">
              <div className="text-sm text-slate-700">Request contact</div>
              <div className="mt-3 text-slate-900">Investors have monthly credits. Traders accept or decline.</div>
              <div className="mt-4"><Button asChild variant="secondary"><Link href="/pricing">See Plans</Link></Button></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
