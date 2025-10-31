'use client'
import Providers from '@/app/providers'


import { useState } from 'react'
import { signIn, signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function AuthPage() {
  const { data: session } = useSession()
  const [email, setEmail] = useState('investor1@4profit.dev')
  const [password, setPassword] = useState('Passw0rd!')

  const onLogin = async () => {
    const res = await signIn('credentials', { email, password, redirect: false })
    if (res?.ok) toast.success('Logged in')
    else toast.error(res?.error || 'Login failed')
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {session?.user ? (
            <div className="space-y-2 text-sm">
              <div>You are logged in as <b>{session.user.email}</b> ({session.user.role})</div>
              <div className="flex gap-2">
                <Button onClick={() => signOut({ callbackUrl: '/' })} variant="secondary">Logout</Button>
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
