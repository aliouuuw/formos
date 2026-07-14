import { bridgeBankIpoCampaign } from '#/lib/campaigns/bridge-bank-ipo'
import type { CampaignConfig, CampaignFormBinding } from '#/lib/campaigns/types'

const CAMPAIGNS: CampaignConfig[] = [bridgeBankIpoCampaign]

const byId = new Map(CAMPAIGNS.map((c) => [c.id, c]))
const byFormSlug = new Map<string, { campaign: CampaignConfig; form: CampaignFormBinding }>()

for (const campaign of CAMPAIGNS) {
  for (const form of campaign.forms) {
    byFormSlug.set(form.slug, { campaign, form })
  }
}

export function listCampaigns(): CampaignConfig[] {
  return CAMPAIGNS
}

export function getCampaignById(id: string): CampaignConfig | undefined {
  return byId.get(id)
}

export function getCampaignByFormSlug(slug: string): CampaignConfig | undefined {
  return byFormSlug.get(slug)?.campaign
}

export function getFormBinding(slug: string): CampaignFormBinding | undefined {
  return byFormSlug.get(slug)?.form
}

/** Resolve campaign from form.campaignId or form slug fallback. */
export function resolveCampaign(input: {
  campaignId?: string | null
  formSlug?: string | null
}): CampaignConfig | undefined {
  if (input.campaignId) {
    const byCampaignId = getCampaignById(input.campaignId)
    if (byCampaignId) return byCampaignId
  }
  if (input.formSlug) return getCampaignByFormSlug(input.formSlug)
  return undefined
}

export function isCampaignFormSlug(slug: string): boolean {
  return byFormSlug.has(slug)
}

export type { CampaignConfig, CampaignFormBinding, CampaignAgent, LeadInsights, LeadRole } from '#/lib/campaigns/types'
export { LEAD_ROLES } from '#/lib/campaigns/types'
export { agentLabel, agentOptions, parseAgentNames, slugifyAgent } from '#/lib/campaigns/agents'
export { BRIDGE_BANK_IPO_CAMPAIGN_ID, bridgeBankIpoCampaign } from '#/lib/campaigns/bridge-bank-ipo'
