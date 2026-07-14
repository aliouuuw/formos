import type { LeadStatus } from '#/lib/form-types'

/** Semantic roles used to extract lead fields from any form definition. */
export const LEAD_ROLES = [
  'name',
  'email',
  'phone',
  'amount_range',
  'preferred_channel',
  'company',
  'city',
  'notes',
  'investor_profile',
  'securities_account',
] as const

export type LeadRole = (typeof LEAD_ROLES)[number]

export type CampaignAgent = {
  /** Stable slug used as leads.assignee value */
  id: string
  label: string
}

export type CampaignFormBinding = {
  slug: string
  /** Classification label stored on leads.intent */
  intent: string
  intentLabel: string
}

export type CampaignConfig = {
  id: string
  name: string
  /** Short label for admin filters */
  shortName: string
  description: string
  landingPath: string
  utmCampaign: string
  /** Form slugs belonging to this campaign */
  forms: CampaignFormBinding[]
  /** Named agents / advisers for assignment */
  agents: CampaignAgent[]
  /** Statuses that count as conversion in stats */
  conversionStatuses: LeadStatus[]
  /** Display labels for known utm_source values */
  sourceLabels: Record<string, string>
  /** Optional WhatsApp E.164 without + */
  whatsappNumber?: string
  /** Overdue threshold for « new » leads (hours since creation) */
  newLeadDeadlineHours: number
  /** Overdue threshold for « contacted » leads (hours since last update) */
  contactedLeadDeadlineHours: number
}

export type LeadInsights = {
  company?: string
  city?: string
  notes?: string
  /** Extra role → value pairs not promoted to columns */
  extras?: Record<string, string>
  /** Classification metadata */
  classifiedAt?: string
  campaignId?: string
}
