/** Default TTL when env is unset. Set SLUG_REDIRECT_TTL_DAYS=0 for permanent redirects. */
export const DEFAULT_SLUG_REDIRECT_TTL_DAYS = 90

/** Client-side TTL for editor copy (mirror SLUG_REDIRECT_TTL_DAYS on the server). */
export function getClientSlugRedirectTtlDays(): number {
  const raw = import.meta.env.VITE_SLUG_REDIRECT_TTL_DAYS
  if (raw === undefined || raw === '') return DEFAULT_SLUG_REDIRECT_TTL_DAYS
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : DEFAULT_SLUG_REDIRECT_TTL_DAYS
}

export function describeSlugRedirectTtl(days: number): string {
  if (days <= 0) return 'indefinitely'
  if (days === 1) return 'for 1 day'
  return `for ${days} days`
}
