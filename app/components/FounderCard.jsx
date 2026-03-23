'use client'

import React from 'react'

export default function FounderCard(){
  const [price, setPrice] = React.useState(null)
  const [conn, setConn] = React.useState('disconnected')

  React.useEffect(() => {
    let ws
    let timer
    const connect = () => {
      try {
        ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@ticker')
        ws.onopen = () => setConn('connected')
        ws.onmessage = (ev) => {
          try {
            const d = JSON.parse(ev.data)
            if (d?.c) setPrice(parseFloat(d.c))
          } catch {}
        }
        ws.onerror = () => setConn('error')
        ws.onclose = () => {
          setConn('disconnected')
          timer = setTimeout(connect, 1500)
        }
      } catch {
        timer = setTimeout(connect, 2000)
      }
    }
    connect()
    return () => { try { ws && ws.close() } catch {}; if (timer) clearTimeout(timer) }
  }, [])

  return (
    <div className="rounded-2xl border border-slate-400/50 bg-black/30 text-slate-100 p-6 md:p-8 backdrop-blur shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-300">Founder Card</div>
          <div className="text-2xl font-semibold mt-1">Platinum Black</div>
        </div>
        <div className="text-[10px] px-2 py-1 rounded border border-slate-500/50 bg-black/40 text-slate-200">Verified by ALVO13</div>
      </div>
      <div className="mt-6 flex items-baseline gap-3">
        <div className="text-sm text-slate-300">BTC/USDT</div>
        <div className="text-3xl font-bold">{price ? `$${price.toLocaleString('en-US',{maximumFractionDigits:2})}` : '—'}</div>
        <div className={`text-xs ${conn==='connected'?'text-green-400':'text-slate-400'}`}>● {conn}</div>
      </div>
      <div className="mt-6 text-xs text-slate-300">This card is pinned and showcases live BTC price from Binance.</div>
    </div>
  )
}
