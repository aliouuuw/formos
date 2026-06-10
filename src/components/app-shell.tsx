import { Link, useRouterState } from '@tanstack/react-router'

import BetterAuthHeader from '#/integrations/better-auth/header-user'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'

const adminLinks = [
  { to: '/admin' as const, label: 'Forms', match: '/admin' },
  { to: '/admin/leads' as const, label: 'Leads', match: '/admin/leads' },
]

function NavItem({
  to,
  label,
  match,
}: {
  to: string
  label: string
  match: string
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const active =
    match === '/admin'
      ? pathname === '/admin' || pathname.startsWith('/admin/forms')
      : pathname.startsWith(match)

  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200',
        active
          ? 'bg-mauve text-white shadow-[0_8px_20px_rgba(70,29,76,0.18)]'
          : 'text-night-60 hover:bg-mauve-05 hover:text-mauve',
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          active ? 'bg-gold' : 'bg-mauve-20',
        )}
      />
      {label}
    </Link>
  )
}

export function AppShell({
  children,
  variant = 'marketing',
}: {
  children: React.ReactNode
  variant?: 'marketing' | 'admin'
}) {
  if (variant === 'admin') {
    return (
      <div className="min-h-[100dvh] bg-[var(--summit-ivory)] text-night">
        <div className="mx-auto flex min-h-[100dvh] max-w-[1400px]">
          <aside className="hidden w-64 shrink-0 flex-col border-r border-mauve-10 bg-white px-4 py-6 lg:flex">
            <Link to="/" className="mb-8 block px-2">
              <p className="text-lg font-semibold tracking-tight text-mauve">Formos</p>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-everest-green-60">
                Everest Finance
              </p>
            </Link>
            <nav className="space-y-1">
              {adminLinks.map((link) => (
                <NavItem key={link.to} {...link} />
              ))}
            </nav>
            <div className="mt-auto border-t border-mauve-10 pt-5">
              <BetterAuthHeader stacked />
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="flex items-center justify-between border-b border-mauve-10 bg-white/90 px-4 py-4 backdrop-blur-sm lg:hidden">
              <Link to="/" className="text-base font-semibold text-mauve">
                Formos
              </Link>
              <div className="flex items-center gap-2">
                <Link to="/admin">
                  <Button variant="ghost" size="sm">
                    Forms
                  </Button>
                </Link>
                <Link to="/admin/leads">
                  <Button variant="ghost" size="sm">
                    Leads
                  </Button>
                </Link>
                <BetterAuthHeader />
              </div>
            </header>
            <main className="flex-1 px-4 py-8 sm:px-8 lg:px-10">{children}</main>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] text-night">
      <header className="site-header sticky top-0 z-30">
        <div className="page-container flex h-[4.25rem] items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mauve text-xs font-bold text-white">
              F
            </span>
            <span>
              <span className="block text-base font-semibold tracking-tight text-mauve">Formos</span>
              <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-everest-green-60">
                Everest Finance
              </span>
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link to="/admin">
              <Button variant="mauve" size="sm" showArrow>
                Admin
              </Button>
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-mauve-10 bg-white py-10">
        <div className="page-container flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-night-60">Internal lead capture for Everest Finance teams.</p>
          <Badge variant="mauve" className="w-fit normal-case tracking-[0.14em]">
            Formos · Everest Finance
          </Badge>
        </div>
      </footer>
    </div>
  )
}
