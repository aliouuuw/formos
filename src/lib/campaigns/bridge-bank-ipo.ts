import { parseAgentNames } from '#/lib/campaigns/agents'
import {
  DEFAULT_CAMPAIGN_AGENTS,
  DEFAULT_CONTACTED_LEAD_DEADLINE_HOURS,
  DEFAULT_NEW_LEAD_DEADLINE_HOURS,
} from '#/lib/campaigns/settings-types'
import type { CampaignConfig } from '#/lib/campaigns/types'

export const BRIDGE_BANK_IPO_CAMPAIGN_ID = 'bridge-bank-ipo' as const

export const bridgeBankIpoCampaign: CampaignConfig = {
  id: BRIDGE_BANK_IPO_CAMPAIGN_ID,
  name: "IPO Bridge Bank Group Côte d'Ivoire",
  shortName: 'IPO Bridge Bank',
  description:
    "Offre publique via Everest Finance — souscription et demandes d'information.",
  landingPath: '/ipo-bridge-bank',
  utmCampaign: 'ipo-bridge-juillet-2026',
  forms: [
    {
      slug: 'ipo-souscrire',
      intent: 'subscribe',
      intentLabel: 'Souscription',
    },
    {
      slug: 'ipo-bulletin',
      intent: 'bulletin',
      intentLabel: 'Bulletin de souscription',
    },
  ],
  agents: parseAgentNames(undefined, DEFAULT_CAMPAIGN_AGENTS.map((a) => a.label)),
  conversionStatuses: ['souscrit', 'won'],
  sourceLabels: {
    'landing-souscrire': 'Landing · Souscrire',
    'landing-bulletin': 'Landing · Bulletin',
    bulletin: 'Bulletin de souscription',
    linkedin: 'LinkedIn',
    whatsapp: 'WhatsApp',
    email: 'Email clients',
    'everest-site': 'Site Everest',
  },
  newLeadDeadlineHours: DEFAULT_NEW_LEAD_DEADLINE_HOURS,
  contactedLeadDeadlineHours: DEFAULT_CONTACTED_LEAD_DEADLINE_HOURS,
}
