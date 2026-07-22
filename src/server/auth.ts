import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import type { BaseURLConfig } from 'better-auth'

import { db } from '#/db/index'
import * as schema from '#/db/schema'
import { env } from '#/env'

const AUTH_TRUSTED_ORIGINS = [
  'https://*.everestfin.sn',
  'https://everestfin.sn',
  ...(process.env.NODE_ENV !== 'production'
    ? ['http://localhost:*', 'http://127.0.0.1:*']
    : []),
] as const

function resolveAuthBaseURL(): BaseURLConfig {
  return {
    allowedHosts: [
      '*.everestfin.sn',
      'everestfin.sn',
      '*.vercel.app',
      'localhost:*',
      '127.0.0.1:*',
    ],
    ...(env.BETTER_AUTH_URL ? { fallback: env.BETTER_AUTH_URL } : {}),
    protocol: 'auto',
  }
}

export const auth = betterAuth({
  appName: env.VITE_APP_NAME,
  baseURL: resolveAuthBaseURL(),
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [...AUTH_TRUSTED_ORIGINS],
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    disableSignUp: true,
  },
  plugins: [tanstackStartCookies()],
})

export type Session = typeof auth.$Infer.Session
