import { parseAgentNames } from '#/lib/campaigns/agents'
import {
  DEFAULT_CAMPAIGN_AGENTS,
  DEFAULT_CONTACTED_LEAD_DEADLINE_HOURS,
  DEFAULT_NEW_LEAD_DEADLINE_HOURS,
} from '#/lib/campaigns/settings-types'
import type { CampaignConfig } from '#/lib/campaigns/types'

export const CORIS_BANK_IPO_CAMPAIGN_ID = 'coris-bank-ipo' as const

export const corisBankIpoCampaign: CampaignConfig = {
  id: CORIS_BANK_IPO_CAMPAIGN_ID,
  name: "IPO Coris Bank International Côte d'Ivoire",
  shortName: 'IPO Coris Bank',
  description: "Offre publique de vente via Everest Finance: ouverture de compte-titres et ordres d'achat.",
  landingPath: '/',
  utmCampaign: 'ipo-coris-decembre-2026',
  forms: [
    {
      slug: 'formulaire-d-ouverture-de-compte',
      intent: 'account',
      intentLabel: 'Ouverture de compte',
    },
  ],
  agents: parseAgentNames(undefined, DEFAULT_CAMPAIGN_AGENTS.map((a) => a.label)),
  conversionStatuses: ['souscrit', 'won'],
  sourceLabels: {
    'landing-compte': 'Landing · Ouverture de compte',
    linkedin: 'LinkedIn',
    whatsapp: 'WhatsApp',
    email: 'Email clients',
    'everest-site': 'Site Everest',
  },
  // Same Everest desk number as the Bridge Bank campaign; override in Paramètres.
  whatsappNumber: '221770993382',
  newLeadDeadlineHours: DEFAULT_NEW_LEAD_DEADLINE_HOURS,
  contactedLeadDeadlineHours: DEFAULT_CONTACTED_LEAD_DEADLINE_HOURS,
}
