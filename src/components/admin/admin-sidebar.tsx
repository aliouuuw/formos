'use client'

import { Link } from '@tanstack/react-router'
import { PanelLeft, PanelLeftClose } from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import BetterAuthHeader from '#/integrations/better-auth/header-user'
import { Button } from '#/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import { cn } from '#/lib/utils'

const STORAGE_KEY = 'formos-admin-sidebar-collapsed'
export const ADMIN_SIDEBAR_WIDTH = '17rem'

export const adminNavLinks = [
  { to: '/admin' as const, label: 'Formulaires', match: '/admin' },
  { to: '/admin/leads' as const, label: 'Leads', match: '/admin/leads' },
  { to: '/admin/campaigns' as const, label: 'Campagnes', match: '/admin/campaigns' },
  { to: '/admin/parametres' as const, label: 'Paramètres', match: '/admin/parametres' },
]

type AdminSidebarContextValue = {
  collapsed: boolean
  mobileOpen: boolean
  toggle: () => void
  closeMobile: () => void
}

const AdminSidebarContext = createContext<AdminSidebarContextValue | null>(null)

export function useAdminSidebarOptional() {
  return useContext(AdminSidebarContext)
}

export function useAdminSidebar() {
  const ctx = useContext(AdminSidebarContext)
  if (!ctx) {
    throw new Error('useAdminSidebar must be used within AdminSidebarProvider')
  }
  return ctx
}

function useNavActive(match: string, pathname: string) {
  return match === '/admin'
    ? pathname === '/admin' || pathname.startsWith('/admin/forms')
    : pathname.startsWith(match)
}

function AdminNavLink({
  to,
  label,
  match,
  pathname,
  onNavigate,
}: {
  to: string
  label: string
  match: string
  pathname: string
  onNavigate?: () => void
}) {
  const active = useNavActive(match, pathname)

  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={cn(
        'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-200',
        active
          ? 'bg-everest-green/10 font-medium text-everest-green'
          : 'text-night-60 hover:bg-everest-green/5 hover:text-everest-green',
      )}
      aria-current={active ? 'page' : undefined}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-200',
          active ? 'bg-gold-cta' : 'bg-transparent group-hover:bg-everest-green/30',
        )}
        aria-hidden
      />
      {label}
    </Link>
  )
}

function SidebarBrand() {
  return (
    <Link to="/admin" className="mb-10 flex items-center gap-3 px-2">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-everest-green text-xs font-bold text-white shadow-[0_0_0_1px_rgba(203,152,36,0.35),0_4px_12px_rgba(1,45,42,0.2)]">
        F
      </span>
      <span className="min-w-0">
        <span className="block text-base font-semibold tracking-tight text-everest-green">Formos</span>
        <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-everest-green/70">
          Everest Finance
        </span>
      </span>
    </Link>
  )
}

export function SidebarTrigger({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  const sidebar = useAdminSidebarOptional()
  if (!sidebar) return null

  const { collapsed, toggle } = sidebar
  const Icon = collapsed ? PanelLeft : PanelLeftClose

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn('h-9 w-9 shrink-0 p-0 text-everest-green/70 hover:bg-everest-green/5 hover:text-everest-green', className)}
      onClick={toggle}
      aria-label={collapsed ? 'Ouvrir le menu' : 'Réduire le menu'}
      aria-expanded={!collapsed}
      {...props}
    >
      <Icon className="size-4.5" aria-hidden />
    </Button>
  )
}

export function AdminSidebarProvider({
  pathname,
  children,
}: {
  pathname: string
  children: ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'true') setCollapsed(true)
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(STORAGE_KEY, String(collapsed))
  }, [collapsed, hydrated])

  const toggle = useCallback(() => {
    if (window.matchMedia('(min-width: 1024px)').matches) {
      setCollapsed((value) => !value)
      return
    }
    setMobileOpen((value) => !value)
  }, [])

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  const value = useMemo(
    () => ({ collapsed, mobileOpen, toggle, closeMobile }),
    [collapsed, mobileOpen, toggle, closeMobile],
  )

  const nav = (
    <nav className="space-y-0.5">
      {adminNavLinks.map((link) => (
        <AdminNavLink
          key={link.to}
          {...link}
          pathname={pathname}
          onNavigate={closeMobile}
        />
      ))}
    </nav>
  )

  return (
    <AdminSidebarContext.Provider value={value}>
      <div className="h-dvh overflow-hidden bg-[var(--summit-ivory)] text-night">
        <aside
          className={cn(
            'fixed top-0 left-0 z-40 hidden h-dvh w-[var(--admin-sidebar-width)] flex-col border-r border-everest-green/10 bg-white px-5 py-7 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] lg:flex',
            collapsed ? 'pointer-events-none -translate-x-full' : 'translate-x-0',
          )}
          style={{ '--admin-sidebar-width': ADMIN_SIDEBAR_WIDTH } as React.CSSProperties}
          aria-hidden={collapsed}
        >
          <SidebarBrand />
          {nav}
          <div className="mt-auto border-t border-everest-green/10 pt-5">
            <BetterAuthHeader stacked />
          </div>
        </aside>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-[min(100vw-2rem,17rem)] gap-0 border-everest-green/10 p-0">
            <SheetHeader className="border-b border-everest-green/10 px-5 py-5 text-left">
              <SheetTitle className="text-base font-semibold text-everest-green">Formos</SheetTitle>
              <SheetDescription className="text-[10px] font-semibold uppercase tracking-[0.18em] text-everest-green/70">
                Everest Finance
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-1 flex-col px-3 py-4">
              {nav}
              <div className="mt-auto border-t border-everest-green/10 pt-5">
                <BetterAuthHeader stacked />
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <div
          className={cn(
            'flex h-dvh min-w-0 flex-col transition-[padding] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
            !collapsed && 'lg:pl-[var(--admin-sidebar-width)]',
          )}
          style={{ '--admin-sidebar-width': ADMIN_SIDEBAR_WIDTH } as React.CSSProperties}
        >
          {children}
        </div>
      </div>
    </AdminSidebarContext.Provider>
  )
}
