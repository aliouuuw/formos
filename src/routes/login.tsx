import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { AppShell } from '#/components/app-shell'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Panel, PanelBody, PanelHeader } from '#/components/ui/panel'
import { authClient } from '#/lib/auth-client'

export const Route = createFileRoute('/login')({ component: LoginPage })

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await authClient.signIn.email({ email, password })
      if (result.error) throw new Error(result.error.message)
      await navigate({ to: '/admin' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell variant="marketing">
      <section className="page-container flex min-h-[calc(100dvh-12rem)] items-center py-16">
        <Panel className="mx-auto w-full max-w-md">
          <PanelHeader>
            <Badge variant="mauve" className="mb-3 normal-case tracking-[0.2em]">
              Admin access
            </Badge>
            <h1 className="text-2xl font-semibold text-night-80">Sign in to Formos</h1>
            <p className="mt-2 text-sm text-night-60">
              Everest Finance staff only. Public sign-up is disabled.
            </p>
          </PanelHeader>
          <PanelBody>
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="current-password"
                />
              </div>
              {error ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              ) : null}
              <Button type="submit" variant="mauve" className="w-full" disabled={loading} showArrow>
                {loading ? 'Signing in...' : 'Continue'}
              </Button>
            </form>
          </PanelBody>
        </Panel>
      </section>
    </AppShell>
  )
}
