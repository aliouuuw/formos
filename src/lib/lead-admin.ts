import type { LeadInsights } from '#/lib/campaigns'
import type { LeadStatus } from '#/lib/form-types'

export const LEAD_LIST_SORTS = [
  'created_desc',
  'created_asc',
  'updated_desc',
  'updated_asc',
] as const

export type LeadListSort = (typeof LEAD_LIST_SORTS)[number]

/** Sentinel for "Non assigné" filter */
export const LEAD_UNASSIGNED = '__unassigned__' as const

export const NEW_LEAD_SLA_HOURS = 24
export const CONTACTED_LEAD_SLA_HOURS = 72

export type LeadDeadlines = {
  newLeadHours: number
  contactedLeadHours: number
}

export const DEFAULT_LEAD_DEADLINES: LeadDeadlines = {
  newLeadHours: NEW_LEAD_SLA_HOURS,
  contactedLeadHours: CONTACTED_LEAD_SLA_HOURS,
}

export function resolveLeadDeadlines(
  stored?: {
    newLeadDeadlineHours?: number | null
    contactedLeadDeadlineHours?: number | null
  } | null,
): LeadDeadlines {
  return {
    newLeadHours: stored?.newLeadDeadlineHours ?? NEW_LEAD_SLA_HOURS,
    contactedLeadHours: stored?.contactedLeadDeadlineHours ?? CONTACTED_LEAD_SLA_HOURS,
  }
}

export function leadAgingRules(deadlines: LeadDeadlines = DEFAULT_LEAD_DEADLINES) {
  return {
    new: {
      hours: deadlines.newLeadHours,
      label: 'Premier contact',
      description: `Lead « Nouveau » sans action depuis plus de ${deadlines.newLeadHours} h`,
    },
    contacted: {
      hours: deadlines.contactedLeadHours,
      label: 'Relance',
      description: `Lead « Contacté » sans mise à jour depuis plus de ${deadlines.contactedLeadHours} h`,
    },
  } as const
}

/** Human-readable rules for admin copy and tooltips (default deadlines). */
export const LEAD_AGING_RULES = leadAgingRules()

export function escapeCsvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

export function leadExtras(insights: LeadInsights | null | undefined) {
  return insights?.extras ?? {}
}

export function investorProfile(insights: LeadInsights | null | undefined): string | undefined {
  return leadExtras(insights).investor_profile
}

export function securitiesAccount(insights: LeadInsights | null | undefined): string | undefined {
  return leadExtras(insights).securities_account
}

export type LeadAgingKind = 'new_overdue' | 'contacted_overdue' | null

/** Overdue when callback / follow-up promises are breached (see leadAgingRules). */
export function getLeadAging(
  lead: { status: string; createdAt: Date | string; updatedAt: Date | string },
  deadlines: LeadDeadlines = DEFAULT_LEAD_DEADLINES,
  now: Date = new Date(),
): LeadAgingKind {
  const createdAt = new Date(lead.createdAt).getTime()
  const updatedAt = new Date(lead.updatedAt).getTime()
  const hoursSince = (from: number) => (now.getTime() - from) / 3_600_000

  if (lead.status === 'new' && hoursSince(createdAt) > deadlines.newLeadHours) {
    return 'new_overdue'
  }
  if (lead.status === 'contacted' && hoursSince(updatedAt) > deadlines.contactedLeadHours) {
    return 'contacted_overdue'
  }
  return null
}

export function agingLabel(
  kind: LeadAgingKind,
  deadlines: LeadDeadlines = DEFAULT_LEAD_DEADLINES,
): string | null {
  const rules = leadAgingRules(deadlines)
  if (kind === 'new_overdue') {
    return `${rules.new.label} · >${deadlines.newLeadHours} h`
  }
  if (kind === 'contacted_overdue') {
    return `${rules.contacted.label} · >${deadlines.contactedLeadHours} h`
  }
  return null
}

export function mergeLeadNotes(
  insights: LeadInsights | null | undefined,
  notes: string,
): LeadInsights {
  const next: LeadInsights = { ...(insights ?? {}) }
  const trimmed = notes.trim()
  if (trimmed) next.notes = trimmed
  else delete next.notes
  return next
}

export type CampaignDeadlineSource = {
  id: string
  newLeadDeadlineHours?: number
  contactedLeadDeadlineHours?: number
}

export function deadlinesForCampaignId(
  campaignId: string | null | undefined,
  campaigns?: CampaignDeadlineSource[],
): LeadDeadlines {
  if (!campaignId) return DEFAULT_LEAD_DEADLINES
  const campaign = campaigns?.find((c) => c.id === campaignId)
  if (!campaign) return DEFAULT_LEAD_DEADLINES
  return {
    newLeadHours: campaign.newLeadDeadlineHours ?? DEFAULT_LEAD_DEADLINES.newLeadHours,
    contactedLeadHours:
      campaign.contactedLeadDeadlineHours ?? DEFAULT_LEAD_DEADLINES.contactedLeadHours,
  }
}

export function deadlinesForLead(
  lead: {
    campaignId?: string | null
    form?: { campaignId?: string | null } | null
  },
  campaigns?: CampaignDeadlineSource[],
): LeadDeadlines {
  const campaignId = lead.campaignId ?? lead.form?.campaignId
  return deadlinesForCampaignId(campaignId, campaigns)
}

export function isTerminalStatus(status: LeadStatus): boolean {
  return status === 'won' || status === 'lost' || status === 'souscrit'
}
