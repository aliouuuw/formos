import { Outlet, createFileRoute } from '@tanstack/react-router'

import { AppShell } from '#/components/app-shell'
import { requireSessionFn } from '#/server/session'

export const Route = createFileRoute('/admin')({
  beforeLoad: async () => {
    const session = await requireSessionFn()
    return { session }
  },
  component: AdminLayout,
})

function AdminLayout() {
  return (
    <AppShell variant="admin">
      <Outlet />
    </AppShell>
  )
}
