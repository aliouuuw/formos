import {
  getFormBinding,
  listCampaigns,
  resolveCampaign,
  type CampaignConfig,
  type LeadInsights,
} from '#/lib/campaigns'
import { agentLabel as campaignAgentLabel, agentOptions } from '#/lib/campaigns/agents'
import type { FormDefinition } from '#/lib/form-types'

export type ExtractedLead = {
  email?: string
  name?: string
  phone?: string
  amountRange?: string
  preferredChannel?: string
  insights: LeadInsights
}

/**
 * Extract lead columns + insights from answers.
 * Prefer field.leadRole; fall back to field type / label heuristics.
 */
export function extractLeadFields(
  definition: FormDefinition,
  answers: Record<string, unknown>,
): ExtractedLead {
  const fields = definition.pages.flatMap((page) => page.fields)

  let email: string | undefined
  let name: string | undefined
  let phone: string | undefined
  let amountRange: string | undefined
  let preferredChannel: string | undefined
  let company: string | undefined
  let city: string | undefined
  let notes: string | undefined
  const extras: Record<string, string> = {}

  for (const field of fields) {
    const value = answers[field.id]
    if (typeof value !== 'string' || value.length === 0) continue

    const role = field.leadRole
    if (role === 'name') name = value
    else if (role === 'email') email = value
    else if (role === 'phone') phone = value
    else if (role === 'amount_range') amountRange = value
    else if (role === 'preferred_channel') preferredChannel = value
    else if (role === 'company') company = value
    else if (role === 'city') city = value
    else if (role === 'notes') notes = value
    else if (role) extras[role] = value
  }

  for (const field of fields) {
    const value = answers[field.id]
    if (typeof value !== 'string' || value.length === 0) continue
    if (field.leadRole) continue

    const label = field.label.toLowerCase()
    if (!email && field.type === 'email') email = value
    if (!phone && field.type === 'phone') phone = value
    if (
      !name &&
      (label.includes('name') ||
        label.includes('nom') ||
        (field.type === 'short_text' &&
          !label.includes('entreprise') &&
          !label.includes('société') &&
          !label.includes('ville')))
    ) {
      name = value
    }
    if (!amountRange && (label.includes('montant') || label.includes('amount') || label.includes('budget'))) {
      amountRange = value
    }
    if (
      !preferredChannel &&
      (label.includes('canal') || label.includes('channel') || label.includes('rappel'))
    ) {
      preferredChannel = value
    }
    if (!company && (label.includes('entreprise') || label.includes('société') || label.includes('company'))) {
      company = value
    }
    if (!city && (label.includes('ville') || label.includes('city'))) {
      city = value
    }
  }

  const insights: LeadInsights = {}
  if (company) insights.company = company
  if (city) insights.city = city
  if (notes) insights.notes = notes
  if (Object.keys(extras).length > 0) insights.extras = extras

  return { email, name, phone, amountRange, preferredChannel, insights }
}

/** Classify a submission into campaign + intent. */
export function classifySubmission(input: {
  formSlug: string
  formCampaignId?: string | null
}): {
  campaign: CampaignConfig | undefined
  campaignId: string | undefined
  intent: string | undefined
  intentLabel: string | undefined
} {
  const campaign = resolveCampaign({
    campaignId: input.formCampaignId,
    formSlug: input.formSlug,
  })
  const binding = getFormBinding(input.formSlug)

  return {
    campaign,
    campaignId: campaign?.id ?? input.formCampaignId ?? undefined,
    intent: binding?.intent,
    intentLabel: binding?.intentLabel,
  }
}

export function formatLeadSource(
  utmSource: string | null | undefined,
  campaign?: CampaignConfig | null,
): string {
  if (!utmSource) return 'Direct'
  if (campaign?.sourceLabels[utmSource]) return campaign.sourceLabels[utmSource]

  for (const c of listCampaigns()) {
    if (c.sourceLabels[utmSource]) return c.sourceLabels[utmSource]
  }

  return utmSource
}

/** @deprecated Prefer classifySubmission */
export function ipoIntentFromSlug(slug: string): string | undefined {
  return getFormBinding(slug)?.intent
}

export function getAgentsForLead(input: {
  campaignId?: string | null
  formSlug?: string | null
}) {
  return resolveCampaign(input)?.agents ?? []
}

export function adviserOptionsFor(input: {
  campaignId?: string | null
  formSlug?: string | null
}) {
  return agentOptions(getAgentsForLead(input))
}

export function adviserLabel(
  value: string | null | undefined,
  input?: { campaignId?: string | null; formSlug?: string | null },
): string {
  if (input) return campaignAgentLabel(getAgentsForLead(input), value)
  if (!value) return 'Non assigné'
  for (const campaign of listCampaigns()) {
    const match = campaign.agents.find((a) => a.id === value)
    if (match) return match.label
  }
  return value
}

export type { LeadInsights }
