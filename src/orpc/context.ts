import { ORPCError, os } from '@orpc/server'

import { auth } from '#/server/auth'
import { env } from '#/env'

export const publicContext = os.$context<{ headers: Headers }>()

export const authedContext = publicContext.use(async ({ context, next }) => {
  const session = await auth.api.getSession({ headers: context.headers })

  if (!session?.user) {
    throw new ORPCError('UNAUTHORIZED', { message: 'Sign in required' })
  }

  if (env.ALLOWED_EMAIL_DOMAIN) {
    const domain = session.user.email.split('@')[1]?.toLowerCase()
    if (domain !== env.ALLOWED_EMAIL_DOMAIN.toLowerCase()) {
      throw new ORPCError('FORBIDDEN', {
        message: `Only @${env.ALLOWED_EMAIL_DOMAIN} accounts are allowed`,
      })
    }
  }

  return next({
    context: {
      ...context,
      session,
      user: session.user,
    },
  })
})
