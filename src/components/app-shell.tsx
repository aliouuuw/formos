import { Link } from '@tanstack/react-router'

import BetterAuthHeader from '#/integrations/better-auth/header-user'
import { Button } from '#/components/ui/button'

export function AppShell({
  children,
  variant = 'marketing',
}: {
  children: React.ReactNode
  variant?: 'marketing' | 'admin'
}) {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--sea-ink)]">
      <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--header-bg)] backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="font-[Fraunces] text-xl font-bold tracking-tight">
            Formos
          </Link>
          <nav className="flex items-center gap-3">
            {variant === 'marketing' ? (
              <>
                <Link to="/login">
                  <Button variant="ghost">Sign in</Button>
                </Link>
                <Link to="/admin">
                  <Button>Open admin</Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/admin" className="text-sm font-medium hover:underline">
                  Forms
                </Link>
                <Link to="/admin/leads" className="text-sm font-medium hover:underline">
                  Leads
                </Link>
                <BetterAuthHeader />
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  )
}
