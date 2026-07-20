import { agentOptions } from '#/lib/campaigns/agents'
import { bridgeBankIpoCampaign } from '#/lib/campaigns/bridge-bank-ipo'
import type { FormDefinition } from '#/lib/form-types'

export const IPO_CAMPAIGN = {
  bankName: "Bridge Bank Group Côte d'Ivoire",
  bankShort: 'Bridge Bank',
  intermediary: 'Everest Finance',
  sharePriceFcfa: 6_750,
  /** ISO dates (UTC midnight) — single source for UI phases & copy */
  subscriptionStartIso: '2026-07-20',
  subscriptionEndIso: '2026-08-06',
  finalStretchStartIso: '2026-08-03',
  subscriptionStart: '20 juillet 2026',
  subscriptionEnd: '6 août 2026',
  listingExpected: 'septembre 2026',
  utmCampaign: 'ipo-bridge-juillet-2026',
} as const

export const IPO_FORM_SLUGS = {
  subscribe: 'ipo-souscrire',
  bulletin: 'ipo-bulletin',
} as const

export const IPO_GUIDE_PATH = '/ipo-bridge-bank/guide' as const
export const IPO_GUIDE_PDF_PATH = '/campaign/guide-souscription-ipo-bridge-bank.pdf' as const

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
  switch (phase) {
    case 'teasing':
      return {
        banner:
          "Bientôt · Ouverture le 20 juillet 2026",
        primaryCta: 'Démarrer ma souscription',
        secondaryCta: "Recevoir le guide d'infos",
        heroSupport: [
          'EVEREST Finance vous accompagne dans votre souscription.',
          'Laissez vos coordonnées : un conseiller vous recontacte pour finaliser votre dossier.',
        ],
        emphasizeInfos: true,
      }
    case 'launch':
      return {
        kicker: 'Ouvert · Souscription en cours',
        banner: `Souscription ouverte jusqu'au ${IPO_CAMPAIGN.subscriptionEnd}. Un conseiller Everest vous accompagne.`,
        primaryCta: 'Je veux souscrire',
        secondaryCta: "J'ai besoin d'infos",
        heroSupport: [
          "20 % du capital de Bridge Bank Group Côte d'Ivoire s'ouvre au public.",
          'EVEREST Finance accompagne votre souscription.',
        ],
        emphasizeInfos: false,
      }
    case 'mid':
      return {
        kicker: 'Mi-période · Relance',
        banner:
          'Fenêtre encore ouverte. Si vous avez déjà un dossier en cours, finalisez-le avec votre conseiller.',
        primaryCta: 'Finaliser ma souscription',
        secondaryCta: 'Relire le guide',
        heroSupport: [
          'La période avance. Everest Finance relance les dossiers incomplets',
          'et reste disponible pour une souscription jusqu’à la clôture.',
        ],
        emphasizeInfos: false,
      }
    case 'final':
      return {
        kicker: 'Dernière ligne droite · Clôture le 6 août',
        banner:
          'Clôture le 6 août 2026 (date réelle de l’offre). Après cette date, les nouvelles souscriptions ne seront plus possibles via cette campagne.',
        primaryCta: 'Souscrire avant clôture',
        secondaryCta: "J'ai besoin d'infos",
        heroSupport: [
          'Derniers jours pour souscrire via Everest Finance.',
          'Préparez bulletin et règlement sans attendre la dernière heure.',
        ],
        emphasizeInfos: false,
      }
    case 'closed':
      return {
        kicker: 'Fenêtre close',
        banner:
          'La période de souscription est terminée. Contactez Everest Finance pour toute question sur le suivi d’allocation.',
        primaryCta: 'Contacter un conseiller',
        secondaryCta: 'Lire le guide',
        heroSupport: [
          'La souscription publique est close.',
          'Notre équipe reste disponible pour le suivi post-clôture et la cotation prévue.',
        ],
        emphasizeInfos: true,
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
    utm_source: channel ?? 'landing-souscrire',
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
  const url = new URL('/ipo-bridge-bank', baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`)
  url.searchParams.set('utm_source', utm.utm_source)
  url.searchParams.set('utm_medium', utm.utm_medium)
  url.searchParams.set('utm_campaign', IPO_CAMPAIGN.utmCampaign)
  return url.toString()
}

export const IPO_SUBSCRIPTION_STEPS = [
  {
    step: '01',
    title: 'Choisissez votre intermédiaire',
    body: 'Souscrivez via Everest Finance, intermédiaire agréé pour accompagner les investisseurs particuliers et professionnels.',
  },
  {
    step: '02',
    title: 'Rassemblez vos pièces',
    body: "Pièce d'identité, RIB et justificatif de domicile. Notre équipe vous confirme la liste exacte selon votre profil.",
  },
  {
    step: '03',
    title: 'Définissez votre montant',
    body: "Actions proposées à 6 750 FCFA l'unité. Indiquez la tranche envisagée pour que le conseiller prépare votre dossier.",
  },
  {
    step: '04',
    title: 'Signez et réglez',
    body: 'Bulletin de souscription et règlement dans la fenêtre du 20 juillet au 6 août 2026. Everest vous guide à chaque étape.',
  },
  {
    step: '05',
    title: 'Suivez votre allocation',
    body: 'Après clôture, règlement-livraison prévu le 21 août. Cotation attendue en septembre 2026 sur la BRVM.',
  },
] as const
