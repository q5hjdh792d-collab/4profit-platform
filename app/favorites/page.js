'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function FavoritesPage(){
  const [items, setItems] = useState([])
  const load = async () => {
    const r = await fetch('/api/favorites', { cache: 'no-store' })
    const j = await r.json()
    setItems(j.items||[])
  }
  useEffect(()=>{ load() },[])
  return (
    <div className="container mx-auto py-8 space-y-4">
      <h1 className="text-2xl font-semibold">Favorites</h1>
      <div className="grid md:grid-cols-3 gap-4">
      {items.map(t => (
        <Card key={t.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
              <Link href={`/traders/${t.slug}`}>{t.name}</Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t.assets?.join(', ')} • {t.styles?.join(', ')}
          </CardContent>
        </Card>
      ))}
      </div>
      {items.length === 0 && <div className="text-muted-foreground text-sm">No favorites yet.</div>}
    </div>
  )
}
