import type { FormDefinition } from '#/lib/form-types'

export const IPO_CAMPAIGN = {
  bankName: 'Bridge Bank Group Côte d\'Ivoire',
  bankShort: 'Bridge Bank',
  intermediary: 'Everest Finance',
  sharePriceFcfa: 6_750,
  subscriptionStart: '20 juillet 2026',
  subscriptionEnd: '6 août 2026',
  listingExpected: 'septembre 2026',
  utmCampaign: 'ipo-bridge-juillet-2026',
} as const

export const IPO_FORM_SLUGS = {
  subscribe: 'ipo-souscrire',
  infos: 'ipo-infos',
} as const

const IPO_FIELD_IDS = {
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
    'Merci pour votre intérêt. Un conseiller Everest Finance vous contacte sous 24 h ouvrées pour finaliser votre souscription à l\'IPO Bridge Bank.',
  )
}

export function createIpoInfosFormDefinition(): FormDefinition {
  return createIpoLeadFormDefinition(
    'Merci ! Consultez le guide « Comment souscrire en 5 étapes » sur la page de la campagne, ou attendez notre email avec la notice d\'information.',
  )
}

export function ipoFormSearchParams(intent: 'subscribe' | 'infos') {
  return {
    utm_source: intent === 'subscribe' ? 'landing-souscrire' : 'landing-infos',
    utm_medium: 'web',
    utm_campaign: IPO_CAMPAIGN.utmCampaign,
  }
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
    body: 'Pièce d\'identité, RIB et justificatif de domicile. Notre équipe vous confirme la liste exacte selon votre profil.',
  },
  {
    step: '03',
    title: 'Définissez votre montant',
    body: 'Actions proposées à 6 750 FCFA l\'unité. Indiquez la tranche envisagée pour que le conseiller prépare votre dossier.',
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
