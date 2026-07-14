import { Outlet, createFileRoute, useRouter, useRouterState } from '@tanstack/react-router'
import { useEffect } from 'react'

import { AppShell } from '#/components/app-shell'
import { authClient } from '#/lib/auth-client'
import { requireSessionFn } from '#/server/session'

export const Route = createFileRoute('/admin')({
  beforeLoad: async ({ location }) => {
    if (location.pathname === '/admin/login') {
      return {}
    }

    const session = await requireSessionFn()
    return { session }
  },
  component: AdminLayout,
})

function AdminLayout() {
  const router = useRouter()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isLogin = pathname === '/admin/login'
  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    if (isLogin) return
    if (!isPending && !session?.user) {
      void router.navigate({ to: '/admin/login' })
    }
  }, [isLogin, isPending, router, session?.user])

  if (isLogin) {
    return <Outlet />
  }

  return (
    <AppShell variant="admin">
      <Outlet />
    </AppShell>
  )
}
