import { env } from '#/env'

import { DEFAULT_SLUG_REDIRECT_TTL_DAYS } from '#/lib/slug-redirect-config.shared'

export { DEFAULT_SLUG_REDIRECT_TTL_DAYS } from '#/lib/slug-redirect-config.shared'

export function getSlugRedirectTtlDays(): number {
  return env.SLUG_REDIRECT_TTL_DAYS ?? DEFAULT_SLUG_REDIRECT_TTL_DAYS
}

export function slugRedirectExpiresAt(from = new Date()): Date | null {
  const days = getSlugRedirectTtlDays()
  if (days <= 0) return null
  const expires = new Date(from)
  expires.setUTCDate(expires.getUTCDate() + days)
  return expires
}

export function isSlugRedirectActive(expiresAt: Date | null | undefined): boolean {
  if (!expiresAt) return true
  return expiresAt.getTime() > Date.now()
}
