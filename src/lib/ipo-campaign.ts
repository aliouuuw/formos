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
  infos: 'ipo-infos',
} as const

export const IPO_GUIDE_PATH = '/ipo-bridge-bank/guide' as const
export const IPO_GUIDE_PDF_PATH = '/campaign/guide-souscription-ipo-bridge-bank.pdf' as const

/** WhatsApp Business — override via VITE_IPO_WHATSAPP_NUMBER (E.164 without +) */
export const IPO_WHATSAPP_NUMBER = import.meta.env.VITE_IPO_WHATSAPP_NUMBER ?? '22500000000'

export function ipoWhatsAppUrl(prefill?: string) {
  const text =
    prefill ??
    "Bonjour, je souhaite recevoir des informations sur l'IPO Bridge Bank via Everest Finance."
  return `https://wa.me/${IPO_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
}

/**
 * Named advisers for lead assignment.
 * Override with VITE_IPO_ADVISERS="Aminata Diallo,Jean Kouassi,Fatou Ndiaye"
 */
function slugifyAdviser(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const DEFAULT_ADVISERS = ['Aminata Diallo', 'Jean Kouassi', 'Fatou Ndiaye'] as const

function parseAdviserNames(): string[] {
  const raw = import.meta.env.VITE_IPO_ADVISERS as string | undefined
  if (!raw?.trim()) return [...DEFAULT_ADVISERS]
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export const IPO_ADVISER_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: '', label: 'Non assigné' },
  ...parseAdviserNames().map((name) => ({
    value: slugifyAdviser(name),
    label: name,
  })),
]

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
        kicker: 'Bientôt · Ouverture le 20 juillet',
        banner:
          "L'IPO arrive. Demandez le guide dès maintenant et préparez votre dossier avant l'ouverture.",
        primaryCta: 'Je veux être rappelé',
        secondaryCta: "Recevoir le guide d'infos",
        heroSupport:
          "La fenêtre de souscription ouvre le 20 juillet 2026. Everest Finance vous aide à anticiper pièces, montant et dépôt.",
        emphasizeInfos: true,
      }
    case 'launch':
      return {
        kicker: 'Ouvert · Souscription en cours',
        banner: `Souscription ouverte jusqu'au ${IPO_CAMPAIGN.subscriptionEnd}. Un conseiller Everest vous accompagne.`,
        primaryCta: 'Je veux souscrire',
        secondaryCta: "J'ai besoin d'infos",
        heroSupport:
          "20 % du capital de Bridge Bank Group Côte d'Ivoire s'ouvre au public. Everest Finance accompagne votre souscription, du premier échange au dépôt.",
        emphasizeInfos: false,
      }
    case 'mid':
      return {
        kicker: 'Mi-période · Relance',
        banner:
          'Fenêtre encore ouverte. Si vous avez déjà un dossier en cours, finalisez-le avec votre conseiller.',
        primaryCta: 'Finaliser ma souscription',
        secondaryCta: 'Relire le guide',
        heroSupport:
          'La période avance. Everest Finance relance les dossiers incomplets et reste disponible pour une souscription jusqu’à la clôture.',
        emphasizeInfos: false,
      }
    case 'final':
      return {
        kicker: 'Dernière ligne droite · Clôture le 6 août',
        banner:
          'Clôture le 6 août 2026 (date réelle de l’offre). Après cette date, les nouvelles souscriptions ne seront plus possibles via cette campagne.',
        primaryCta: 'Souscrire avant clôture',
        secondaryCta: "J'ai besoin d'infos",
        heroSupport:
          'Derniers jours pour souscrire via Everest Finance. Préparez bulletin et règlement sans attendre la dernière heure.',
        emphasizeInfos: false,
      }
    case 'closed':
      return {
        kicker: 'Fenêtre close',
        banner:
          'La période de souscription est terminée. Contactez Everest Finance pour toute question sur le suivi d’allocation.',
        primaryCta: 'Contacter un conseiller',
        secondaryCta: 'Lire le guide',
        heroSupport:
          'La souscription publique est close. Notre équipe reste disponible pour le suivi post-clôture et la cotation prévue.',
        emphasizeInfos: true,
      }
  }
}

export const IPO_FIELD_IDS = {
  name: 'ipo-field-name',
  phone: 'ipo-field-phone',
  email: 'ipo-field-email',
  amount: 'ipo-field-amount',
  channel: 'ipo-field-channel',
} as const

const AMOUNT_OPTIONS = [
  'Moins de 100 000 FCFA',
  '100 000 – 500 000 FCFA',
  '500 000 – 1 000 000 FCFA',
  'Plus de 1 000 000 FCFA',
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
          },
          {
            id: IPO_FIELD_IDS.phone,
            type: 'phone',
            label: 'Téléphone',
            required: true,
            placeholder: '+225 07 00 00 00 00',
          },
          {
            id: IPO_FIELD_IDS.email,
            type: 'email',
            label: 'Email',
            required: true,
            placeholder: 'vous@exemple.com',
          },
          {
            id: IPO_FIELD_IDS.amount,
            type: 'select',
            label: 'Montant envisagé',
            required: true,
            options: [...AMOUNT_OPTIONS],
          },
          {
            id: IPO_FIELD_IDS.channel,
            type: 'select',
            label: 'Canal de rappel préféré',
            required: true,
            options: ['WhatsApp', 'Téléphone'],
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
    'Votre demande est enregistrée. Un conseiller Everest Finance vous contacte sous 24 h ouvrées pour planifier la suite de votre souscription.',
  )
}

export function createIpoInfosFormDefinition(): FormDefinition {
  return createIpoLeadFormDefinition(
    'Votre demande est enregistrée. Téléchargez le guide ci-dessous ; nous vous enverrons aussi la notice par email.',
  )
}

export function ipoFormSearchParams(intent: 'subscribe' | 'infos', channel?: string) {
  return {
    utm_source: channel ?? (intent === 'subscribe' ? 'landing-souscrire' : 'landing-infos'),
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
