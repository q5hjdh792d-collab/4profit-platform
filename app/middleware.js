import { NextResponse } from 'next/server'

export function middleware() {
  // No-op middleware; auth removed in Supabase-only public preview
  return NextResponse.next()
}

export const config = {
  matcher: []
}
