/** Public form / lead hygiene helpers (honeypot, idempotent submit, duplicate leads). */

export const HONEYPOT_FIELD_ID = 'company_website'

export function isHoneypotTriggered(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

export function normalizeLeadEmail(email: string | null | undefined): string | null {
  if (!email) return null
  const normalized = email.trim().toLowerCase()
  if (!normalized.includes('@') || normalized.length < 5) return null
  return normalized
}

/** Digits only; keep last 15 for international numbers. */
export function normalizeLeadPhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 8) return null
  return digits.length > 15 ? digits.slice(-15) : digits
}

/** Last 9 digits — stable enough for FR/SN mobiles with/without country code. */
export function phoneMatchKey(phone: string | null | undefined): string | null {
  const digits = normalizeLeadPhone(phone)
  if (!digits) return null
  return digits.length >= 9 ? digits.slice(-9) : digits
}

export type DuplicateLeadMatch = {
  id: string
  match: 'email' | 'phone'
}
