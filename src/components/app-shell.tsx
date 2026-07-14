import { Link, useRouterState } from '@tanstack/react-router'

import { AdminSidebarProvider } from '#/components/admin/admin-sidebar'
import BetterAuthHeader from '#/integrations/better-auth/header-user'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'

export function AppShell({
  children,
  variant = 'marketing',
}: {
  children: React.ReactNode
  variant?: 'marketing' | 'admin'
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  if (variant === 'admin') {
    return (
      <AdminSidebarProvider pathname={pathname}>
        <div className="flex min-h-0 flex-1 flex-col">
          <header className="flex shrink-0 items-center justify-between border-b border-everest-green/10 bg-white/90 px-4 py-3 backdrop-blur-sm lg:hidden">
            <Link to="/admin" className="flex items-center gap-2 text-base font-semibold text-everest-green">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-everest-green text-[10px] font-bold text-white shadow-[0_0_0_1px_rgba(203,152,36,0.3)]">
                F
              </span>
              Formos
            </Link>
            <BetterAuthHeader />
          </header>
          <main className="min-h-0 flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-10">{children}</main>
        </div>
      </AdminSidebarProvider>
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
