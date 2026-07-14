import type { FormDefinition } from '#/lib/form-types'
import { IPO_FIELD_IDS, IPO_FORM_SLUGS } from '#/lib/ipo-campaign'

export type LeadIntent = 'subscribe' | 'infos'

export function ipoIntentFromSlug(slug: string): LeadIntent | undefined {
  if (slug === IPO_FORM_SLUGS.subscribe) return 'subscribe'
  if (slug === IPO_FORM_SLUGS.infos) return 'infos'
  return undefined
}

export function extractLeadFields(
  definition: FormDefinition,
  answers: Record<string, unknown>,
) {
  const fields = definition.pages.flatMap((page) => page.fields)

  let email: string | undefined
  let name: string | undefined
  let phone: string | undefined
  let amountRange: string | undefined
  let preferredChannel: string | undefined

  for (const field of fields) {
    const value = answers[field.id]
    if (typeof value !== 'string' || value.length === 0) continue

    if (field.id === IPO_FIELD_IDS.amount) amountRange = value
    if (field.id === IPO_FIELD_IDS.channel) preferredChannel = value
    if (field.type === 'email' && !email) email = value
    if (field.type === 'phone' && !phone) phone = value
    if (
      !name &&
      (field.id === IPO_FIELD_IDS.name ||
        field.label.toLowerCase().includes('name') ||
        field.label.toLowerCase().includes('nom') ||
        field.type === 'short_text')
    ) {
      name = value
    }
  }

  return { email, name, phone, amountRange, preferredChannel }
}

export { IPO_ADVISER_OPTIONS, adviserLabel } from '#/lib/ipo-campaign'

export function formatLeadSource(utmSource: string | null | undefined): string {
  if (!utmSource) return 'Direct'
  const map: Record<string, string> = {
    'landing-souscrire': 'Landing · Souscrire',
    'landing-infos': 'Landing · Infos',
    linkedin: 'LinkedIn',
    whatsapp: 'WhatsApp',
    email: 'Email clients',
    'everest-site': 'Site Everest',
  }
  return map[utmSource] ?? utmSource
}
