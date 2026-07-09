import { createFileRoute } from '@tanstack/react-router'
import { serve } from 'inngest/edge'

import { requireInngestSigningKey } from '#/env'
import { inngest } from '#/inngest/client'
import { inngestFunctions } from '#/inngest/functions'

const handler = serve({
  client: inngest,
  functions: inngestFunctions,
})

async function handleInngest({ request }: { request: Request }) {
  try {
    requireInngestSigningKey()
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Inngest is not configured'

    return new Response(message, { status: 503 })
  }

  return handler(request)
}

export const Route = createFileRoute('/api/inngest')({
  server: {
    handlers: {
      GET: handleInngest,
      POST: handleInngest,
      PUT: handleInngest,
    },
  },
})
