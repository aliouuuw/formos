import { createFileRoute, redirect } from '@tanstack/react-router'

import { AdminLoginPage } from '#/components/admin-login-page'
import { getSession } from '#/server/session'

export const Route = createFileRoute('/admin/login')({
  beforeLoad: async () => {
    const session = await getSession()
    if (session?.user) {
      throw redirect({ to: '/admin' })
    }
  },
  component: AdminLoginPage,
})
