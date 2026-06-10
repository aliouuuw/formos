import { Inngest } from 'inngest'

import { env } from '#/env'

export const inngest = new Inngest({
  id: 'formos',
  name: env.VITE_APP_NAME,
})
