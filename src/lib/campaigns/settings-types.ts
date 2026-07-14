import type { CampaignAgent } from '#/lib/campaigns/types'
import {
  CONTACTED_LEAD_SLA_HOURS,
  NEW_LEAD_SLA_HOURS,
} from '#/lib/lead-admin'

export type CampaignSettingsRow = {
  agents: CampaignAgent[]
  whatsappNumber: string | null
  newLeadDeadlineHours: number
  contactedLeadDeadlineHours: number
}

export const DEFAULT_NEW_LEAD_DEADLINE_HOURS = NEW_LEAD_SLA_HOURS
export const DEFAULT_CONTACTED_LEAD_DEADLINE_HOURS = CONTACTED_LEAD_SLA_HOURS

export const DEFAULT_CAMPAIGN_AGENTS: CampaignAgent[] = [
  { id: 'aminata-diallo', label: 'Aminata Diallo' },
  { id: 'jean-kouassi', label: 'Jean Kouassi' },
  { id: 'fatou-ndiaye', label: 'Fatou Ndiaye' },
]
