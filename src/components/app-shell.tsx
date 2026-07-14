import { Link, useRouterState } from '@tanstack/react-router'

import BetterAuthHeader from '#/integrations/better-auth/header-user'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'

const adminLinks = [
  { to: '/admin' as const, label: 'Formulaires', match: '/admin' },
  { to: '/admin/leads' as const, label: 'Leads', match: '/admin/leads' },
  { to: '/admin/campaigns' as const, label: 'Campagnes', match: '/admin/campaigns' },
  { to: '/admin/parametres' as const, label: 'Paramètres', match: '/admin/parametres' },
]

function useNavActive(match: string) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  return match === '/admin'
    ? pathname === '/admin' || pathname.startsWith('/admin/forms')
    : pathname.startsWith(match)
}

function NavItem({
  to,
  label,
  match,
}: {
  to: string
  label: string
  match: string
}) {
  const active = useNavActive(match)

  return (
    <Link
      to={to}
      className={cn(
        'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-200',
        active
          ? 'bg-mauve-05 text-mauve font-medium'
          : 'text-night-60 hover:bg-mauve-05/60 hover:text-night-80',
      )}
      aria-current={active ? 'page' : undefined}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-200',
          active ? 'bg-mauve' : 'bg-transparent group-hover:bg-mauve/30',
        )}
        aria-hidden
      />
      {label}
    </Link>
  )
}

function MobileNavItem({
  to,
  label,
  match,
}: {
  to: string
  label: string
  match: string
}) {
  const active = useNavActive(match)

  return (
    <Link to={to} aria-current={active ? 'page' : undefined}>
      <Button variant={active ? 'mauve' : 'ghost'} size="sm">
        {label}
      </Button>
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
        <div className="mx-auto flex min-h-[100dvh] max-w-[1440px]">
          <aside className="hidden w-[17rem] shrink-0 flex-col border-r border-border-subtle bg-white px-5 py-7 lg:flex">
            <Link to="/admin" className="mb-10 flex items-center gap-3 px-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-mauve text-xs font-bold text-white">
                F
              </span>
              <span>
                <span className="block text-base font-semibold tracking-tight text-mauve">Formos</span>
                <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-everest-green">
                  Everest Finance
                </span>
              </span>
            </Link>
            <nav className="space-y-0.5">
              {adminLinks.map((link) => (
                <NavItem key={link.to} {...link} />
              ))}
            </nav>
            <div className="mt-auto border-t border-border-subtle pt-5">
              <BetterAuthHeader stacked />
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="flex items-center justify-between border-b border-border-subtle bg-white/90 px-4 py-3.5 backdrop-blur-sm lg:hidden">
              <Link to="/admin" className="flex items-center gap-2 text-base font-semibold text-mauve">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-mauve text-[10px] font-bold text-white">F</span>
                Formos
              </Link>
              <div className="flex items-center gap-2">
                {adminLinks.map((link) => (
                  <MobileNavItem key={link.to} {...link} />
                ))}
                <BetterAuthHeader />
              </div>
            </header>
            <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10">{children}</main>
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
              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-everest-green">
                Everest Finance
              </span>
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/admin/login">
              <Button variant="ghost" size="sm">
                Se connecter
              </Button>
            </Link>
            <Link to="/admin">
              <Button variant="mauve" size="sm" showArrow>
                Ouvrir Formos
              </Button>
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-border-subtle bg-white py-10">
        <div className="page-container flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-text-secondary">Capture interne de leads pour les équipes Everest Finance.</p>
          <Badge variant="mauve" className="w-fit normal-case tracking-[0.14em]">
            Formos · Everest Finance
          </Badge>
        </div>
      </footer>
    </div>
  )
}
