import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

const isProduction = process.env.NODE_ENV === 'production'

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url().optional(),
    BETTER_AUTH_SECRET: isProduction
      ? z.string().min(32)
      : z.string().min(32).optional(),
    BETTER_AUTH_URL: z.string().url().optional(),
    ALLOWED_EMAIL_DOMAIN: z.string().optional(),
    INNGEST_EVENT_KEY: z.string().optional(),
    INNGEST_SIGNING_KEY: isProduction
      ? z.string().min(1)
      : z.string().optional(),
    /** Legacy slug redirect TTL in days. 0 = never expire. Default 90. */
    SLUG_REDIRECT_TTL_DAYS: z.coerce.number().int().min(0).max(3650).optional(),
  },
  clientPrefix: 'VITE_',
  client: {
    VITE_APP_NAME: z.string().default('Formos'),
    /** Mirror SLUG_REDIRECT_TTL_DAYS for editor UI copy. */
    VITE_SLUG_REDIRECT_TTL_DAYS: z.coerce.number().int().min(0).max(3650).optional(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    ALLOWED_EMAIL_DOMAIN: process.env.ALLOWED_EMAIL_DOMAIN,
    INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
    INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
    SLUG_REDIRECT_TTL_DAYS: process.env.SLUG_REDIRECT_TTL_DAYS,
    VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
    VITE_SLUG_REDIRECT_TTL_DAYS: import.meta.env.VITE_SLUG_REDIRECT_TTL_DAYS,
  },
  emptyStringAsUndefined: true,
})
