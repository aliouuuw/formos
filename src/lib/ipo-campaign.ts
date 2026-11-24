import { agentOptions } from '#/lib/campaigns/agents'
import { bridgeBankIpoCampaign } from '#/lib/campaigns/bridge-bank-ipo'
import type { FormDefinition } from '#/lib/form-types'

export const IPO_CAMPAIGN = {
  bankName: "Coris Bank International Côte d'Ivoire",
  bankShort: 'Coris Bank',
  intermediary: 'Everest Finance',
  sharePriceFcfa: 7_720,
  /** AMF-UMOA visa of the note d'information */
  visa: 'OA/26-05',
  /** ISO dates (UTC midnight) — single source for UI phases & copy */
  subscriptionStartIso: '2026-11-30',
  subscriptionEndIso: '2026-12-04',
  finalStretchStartIso: '2026-12-03',
  subscriptionStart: '30 novembre 2026',
  subscriptionEnd: '4 décembre 2026',
  settlementBy: '28/12/2026',
  listingExpected: '15/01/2027',
  utmCampaign: 'ipo-coris-decembre-2026',
} as const

export const IPO_FORM_SLUGS = {
  /** Bridge Bank forms (archived), kept for admin history */
  subscribe: 'ipo-souscrire',
  bulletin: 'ipo-bulletin',
  accountOpening: 'formulaire-d-ouverture-de-compte',
} as const

export const IPO_GUIDE_PDF_PATH = '/campaign/teaser-ipo-coris-bank-ci.pdf' as const

/** @deprecated Use campaigns.getPublicContact — settings are stored in DB */
export function ipoWhatsAppUrl(prefill?: string, number?: string) {
  const n = number?.replace(/\D/g, '')
  if (!n) return '#'
  const text =
    prefill ??
    "Bonjour, je souhaite recevoir des informations sur l'IPO Bridge Bank via Everest Finance."
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`
}

/**
 * @deprecated Agents are loaded from Paramètres (DB). Use campaigns.list in admin.
 */
export const IPO_ADVISER_OPTIONS: ReadonlyArray<{ value: string; label: string }> = agentOptions(
  bridgeBankIpoCampaign.agents,
)

export function adviserLabel(value: string | null | undefined): string {
  if (!value) return 'Non assigné'
  return IPO_ADVISER_OPTIONS.find((o) => o.value === value)?.label ?? value
}

export type IpoCampaignPhase = 'teasing' | 'launch' | 'mid' | 'final' | 'closed'

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y!, m! - 1, d!))
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

/** Calendar phase for urgency copy — uses real subscription window dates. */
export function getIpoCampaignPhase(now: Date = new Date()): IpoCampaignPhase {
  const today = startOfUtcDay(now)
  const start = parseIsoDate(IPO_CAMPAIGN.subscriptionStartIso)
  const end = parseIsoDate(IPO_CAMPAIGN.subscriptionEndIso)
  const finalStretch = parseIsoDate(IPO_CAMPAIGN.finalStretchStartIso)

  if (today < start) return 'teasing'
  if (today > end) return 'closed'
  if (today >= finalStretch) return 'final'

  const midPoint = new Date(start)
  midPoint.setUTCDate(start.getUTCDate() + Math.floor((end.getTime() - start.getTime()) / (2 * 86_400_000)))
  if (today >= midPoint) return 'mid'
  return 'launch'
}

export function getIpoPhaseCopy(phase: IpoCampaignPhase = getIpoCampaignPhase()) {
  const heroSupport = [
    "20 % du capital de Coris Bank International Côte d'Ivoire s'ouvre au public.",
    'EVEREST Finance, membre du syndicat de placement, accompagne votre souscription.',
  ] as const
  switch (phase) {
    case 'teasing':
      return {
        banner: `Ouverture le ${IPO_CAMPAIGN.subscriptionStart} · Ouvrez votre compte-titres dès maintenant`,
        primaryCta: 'Ouvrir mon compte-titres',
        secondaryCta: 'Télécharger le teaser',
        heroSupport,
      }
    case 'launch':
    case 'mid':
      return {
        banner: `Souscription ouverte jusqu'au ${IPO_CAMPAIGN.subscriptionEnd}.`,
        primaryCta: 'Ouvrir mon compte-titres',
        secondaryCta: 'Télécharger le teaser',
        heroSupport,
      }
    case 'final':
      return {
        banner: `Clôture le ${IPO_CAMPAIGN.subscriptionEnd}. Transmettez votre ordre d'achat sans attendre.`,
        primaryCta: 'Ouvrir mon compte-titres',
        secondaryCta: 'Télécharger le teaser',
        heroSupport,
      }
    case 'closed':
      return {
        banner:
          'La période de souscription est terminée. Contactez Everest Finance pour le suivi de votre allocation.',
        primaryCta: 'Contacter un conseiller',
        secondaryCta: 'Télécharger le teaser',
        heroSupport: [
          'La souscription publique est close.',
          `Première cotation prévue le ${IPO_CAMPAIGN.listingExpected}.`,
        ] as const,
      }
  }
}

export const IPO_FIELD_IDS = {
  name: 'ipo-field-name',
  phone: 'ipo-field-phone',
  email: 'ipo-field-email',
  city: 'ipo-field-city',
  profile: 'ipo-field-profile',
  amount: 'ipo-field-amount',
  account: 'ipo-field-account',
  channel: 'ipo-field-channel',
} as const

const AMOUNT_OPTIONS = [
  'Moins de 500 000 FCFA',
  '500 000 – 2 000 000 FCFA',
  '2 000 000 – 10 000 000 FCFA',
  'Plus de 10 000 000 FCFA',
] as const

function createIpoLeadFormDefinition(thankYouMessage: string): FormDefinition {
  return {
    pages: [
      {
        id: 'ipo-page-contact',
        title: 'Vos coordonnées',
        fields: [
          {
            id: IPO_FIELD_IDS.name,
            type: 'short_text',
            label: 'Nom complet',
            required: true,
            placeholder: 'Prénom et nom',
            leadRole: 'name',
          },
          {
            id: IPO_FIELD_IDS.phone,
            type: 'phone',
            label: 'Téléphone / WhatsApp',
            required: true,
            placeholder: '+221 77 000 00 00',
            leadRole: 'phone',
          },
          {
            id: IPO_FIELD_IDS.email,
            type: 'email',
            label: 'Email',
            required: false,
            placeholder: 'vous@exemple.com',
            leadRole: 'email',
          },
          {
            id: IPO_FIELD_IDS.city,
            type: 'short_text',
            label: 'Ville / Pays de résidence',
            required: true,
            placeholder: 'Dakar, Sénégal',
            leadRole: 'city',
          },
        ],
      },
      {
        id: 'ipo-page-subscription',
        title: 'Votre souscription',
        fields: [
          {
            id: IPO_FIELD_IDS.profile,
            type: 'select',
            label: 'Vous êtes',
            required: true,
            placeholder: 'Sélectionner…',
            options: ['Particulier', 'Institutionnel', 'Diaspora'],
            leadRole: 'investor_profile',
          },
          {
            id: IPO_FIELD_IDS.amount,
            type: 'select',
            label: 'Montant envisagé',
            required: true,
            placeholder: 'Choisir une tranche',
            options: [...AMOUNT_OPTIONS],
            leadRole: 'amount_range',
          },
          {
            id: IPO_FIELD_IDS.account,
            type: 'select',
            label: 'Compte titres EVEREST Finance existant ?',
            required: true,
            placeholder: 'Sélectionner…',
            options: ['Oui', 'Non', 'Je ne sais pas'],
            leadRole: 'securities_account',
          },
          {
            id: IPO_FIELD_IDS.channel,
            type: 'select',
            label: 'Canal de rappel préféré',
            required: true,
            placeholder: 'Sélectionner…',
            options: ['WhatsApp', 'Appel', 'Email'],
            leadRole: 'preferred_channel',
          },
        ],
      },
    ],
    theme: {
      primaryColor: '#012d2a',
      thankYouMessage,
    },
  }
}

export function createIpoSubscribeFormDefinition(): FormDefinition {
  return createIpoLeadFormDefinition(
    "Un conseiller EVEREST Finance vous recontacte sous 24 h ouvrées pour finaliser votre souscription à l'IPO Bridge Bank Group CI.",
  )
}

export function ipoFormSearchParams(channel?: string) {
  return {
    utm_source: channel ?? 'landing-compte',
    utm_medium: 'web',
    utm_campaign: IPO_CAMPAIGN.utmCampaign,
  }
}

/** Channel UTMs for marketing links — see docs/ipo-channel-utm.md */
export const IPO_CHANNEL_UTM = {
  linkedin: { utm_source: 'linkedin', utm_medium: 'social' },
  whatsapp: { utm_source: 'whatsapp', utm_medium: 'social' },
  email: { utm_source: 'email', utm_medium: 'email' },
  everestSite: { utm_source: 'everest-site', utm_medium: 'referral' },
} as const

export function ipoLandingUrl(baseUrl: string, channel: keyof typeof IPO_CHANNEL_UTM) {
  const utm = IPO_CHANNEL_UTM[channel]
  const url = new URL('/', baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`)
  url.searchParams.set('utm_source', utm.utm_source)
  url.searchParams.set('utm_medium', utm.utm_medium)
  url.searchParams.set('utm_campaign', IPO_CAMPAIGN.utmCampaign)
  return url.toString()
}

/** « Comment souscrire ? » from the EVEREST Finance teaser (note d'information visa OA/26-05). */
export const IPO_SUBSCRIPTION_STEPS = [
  'Ouvrir ou utiliser un compte-titres auprès de EVEREST Finance, membre du syndicat de placement.',
  "Transmettre à EVEREST Finance un seul ordre d'achat par investisseur pendant la période.",
  "Provisionner l'ordre ; les fonds restent bloqués jusqu'à l'allocation définitive.",
  `Règlement-livraison au plus tard le ${IPO_CAMPAIGN.settlementBy} ; première cotation prévue le ${IPO_CAMPAIGN.listingExpected}.`,
] as const
