import type { CampaignAgent } from '#/lib/campaigns/types'

export type CampaignSettingsRow = {
  agents: CampaignAgent[]
  whatsappNumber: string | null
}

export const DEFAULT_CAMPAIGN_AGENTS: CampaignAgent[] = [
  { id: 'aminata-diallo', label: 'Aminata Diallo' },
  { id: 'jean-kouassi', label: 'Jean Kouassi' },
  { id: 'fatou-ndiaye', label: 'Fatou Ndiaye' },
]
