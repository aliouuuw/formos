import { Outlet, createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'

import { AppShell } from '#/components/app-shell'
import { authClient } from '#/lib/auth-client'
import { requireSessionFn } from '#/server/session'

export const Route = createFileRoute('/admin')({
  beforeLoad: async () => {
    const session = await requireSessionFn()
    return { session }
  },
  component: AdminLayout,
})

function AdminLayout() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    if (!isPending && !session?.user) {
      void router.navigate({ to: '/' })
    }
  }, [isPending, router, session?.user])

  return (
    <AppShell variant="admin">
      <Outlet />
    </AppShell>
  )
}
