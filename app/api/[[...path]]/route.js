import { NextResponse } from 'next/server'

function json(data, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function GET(request) {
  try {
    const url = new URL(request.url)
    const pathname = url.pathname.replace('/api', '')

    if (pathname === '/health') {
      return json({ ok: true, ts: new Date().toISOString() })
    }

    return json({ error: 'Not found' }, 404)
  } catch (e) {
    return json({ error: 'Server error' }, 500)
  }
}

export async function POST() {
  return json({ error: 'Not found' }, 404)
}
