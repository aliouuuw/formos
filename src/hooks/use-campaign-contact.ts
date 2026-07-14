import { useQuery } from '@tanstack/react-query'

import { BRIDGE_BANK_IPO_CAMPAIGN_ID } from '#/lib/campaigns'
import { orpc } from '#/orpc/client'

export function useCampaignContact(campaignId: string = BRIDGE_BANK_IPO_CAMPAIGN_ID) {
  const enabled = Boolean(campaignId)
  return useQuery({
    ...orpc.campaigns.getPublicContact.queryOptions({
      input: { campaignId: campaignId || BRIDGE_BANK_IPO_CAMPAIGN_ID },
    }),
    enabled,
    staleTime: 60_000,
  })
}
