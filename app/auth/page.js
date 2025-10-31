'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function AuthPage() {
  const [email, setEmail] = useState('investor1@4profit.dev')
  const [password, setPassword] = useState('Passw0rd!')
  const [sessionUser, setSessionUser] = useState(null)

  const loadSession = async () => {
    try {
      const r = await fetch('/api/session', { cache: 'no-store' })
      const j = await r.json()
      setSessionUser(j.user)
    } catch (e) {}
  }

  useEffect(() => { loadSession() }, [])

  const onLogin = async () => {
    try {
      const csrfRes = await fetch('/api/auth/csrf')
      const { csrfToken } = await csrfRes.json()
      const form = new URLSearchParams()
      form.set('csrfToken', csrfToken)
      form.set('callbackUrl', '/')
      form.set('email', email)
      form.set('password', password)
      const resp = await fetch('/api/auth/callback/credentials', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form.toString() })
      if (resp.ok) {
        toast.success('Logged in')
        setTimeout(() => { window.location.href = '/traders' }, 300)
      } else {
        toast.error('Login failed')
      }
    } catch (e) {
      toast.error('Login error')
    }
  }

  const onLogout = async () => {
    try {
      const csrfRes = await fetch('/api/auth/csrf')
      const { csrfToken } = await csrfRes.json()
      const form = new URLSearchParams()
      form.set('csrfToken', csrfToken)
      form.set('callbackUrl', '/')
      const resp = await fetch('/api/auth/signout', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form.toString() })
      if (resp.ok) {
        toast.success('Logged out')
        setTimeout(() => window.location.reload(), 300)
      }
    } catch (e) {}
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessionUser ? (
            <div className="space-y-2 text-sm">
              <div>You are logged in as <b>{sessionUser.email}</b> ({sessionUser.role})</div>
              <div className="flex gap-2">
                <Button onClick={onLogout} variant="secondary">Logout</Button>
                <a className="text-xs underline" href="/api/seed" target="_blank" rel="noreferrer">Run seed</a>
              </div>
            </div>
          ) : (
            <>
              <Input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
              <Input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
              <Button onClick={onLogin}>Login</Button>
              <div className="text-xs text-muted-foreground">Try investor1@4profit.dev / Passw0rd! (seeded)</div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
