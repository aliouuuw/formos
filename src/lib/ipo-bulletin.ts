import type { FormDefinition, FormField } from '#/lib/form-types'
import { IPO_CAMPAIGN } from '#/lib/ipo-campaign'

/** Public form slug for the full Bulletin de souscription flow. */
export const IPO_BULLETIN_SLUG = 'ipo-bulletin' as const

export const IPO_BULLETIN_PDF_PATH =
  '/campaign/bulletin-souscription-ipo-bridge-bank-template.pdf' as const

export const SHARE_PRICE_FCFA = IPO_CAMPAIGN.sharePriceFcfa

export const BULLETIN_FIELD_IDS = {
  subscriberType: 'bb-subscriber-type',
  lastName: 'bb-last-name',
  firstName: 'bb-first-name',
  birthDate: 'bb-birth-date',
  birthPlace: 'bb-birth-place',
  nationality: 'bb-nationality',
  residence: 'bb-residence',
  subscriptionPlace: 'bb-subscription-place',
  gender: 'bb-gender',
  idType: 'bb-id-type',
  idNumber: 'bb-id-number',
  idIssuedOn: 'bb-id-issued-on',
  idIssuedBy: 'bb-id-issued-by',
  address: 'bb-address',
  locality: 'bb-locality',
  phone: 'bb-phone',
  fax: 'bb-fax',
  email: 'bb-email',
  // Personne physique
  occupation: 'bb-occupation',
  occupationOther: 'bb-occupation-other',
  employerName: 'bb-employer-name',
  employerAddress: 'bb-employer-address',
  employerPhone: 'bb-employer-phone',
  employerFax: 'bb-employer-fax',
  employerEmail: 'bb-employer-email',
  // Personne morale
  orgType: 'bb-org-type',
  orgTypeOther: 'bb-org-type-other',
  actingAs: 'bb-acting-as',
  companyName: 'bb-company-name',
  legalForm: 'bb-legal-form',
  shareCapital: 'bb-share-capital',
  orgAddress: 'bb-org-address',
  orgLocality: 'bb-org-locality',
  orgPhone: 'bb-org-phone',
  orgFax: 'bb-org-fax',
  orgEmail: 'bb-org-email',
  // Souscription
  shareCount: 'bb-share-count',
  totalFcfa: 'bb-total-fcfa',
  totalLetters: 'bb-total-letters',
  sgiBtcc: 'bb-sgi-btcc',
  // Paiement
  paymentMethod: 'bb-payment-method',
  chequeNumber: 'bb-cheque-number',
  bankName: 'bb-bank-name',
  accountNumber: 'bb-account-number',
  // Confirmation
  place: 'bb-place',
  date: 'bb-date',
  signature: 'bb-signature',
  certify: 'bb-certify',
} as const

export type BulletinFieldId = (typeof BULLETIN_FIELD_IDS)[keyof typeof BULLETIN_FIELD_IDS]

export const SUBSCRIBER_TYPES = ['Personne physique', 'Personne morale'] as const
export type SubscriberType = (typeof SUBSCRIBER_TYPES)[number]

export const NATIONALITY_OPTIONS = [
  'Ivoirienne',
  'UEMOA',
  'Africaine Hors UEMOA',
  'Non Africaine',
] as const

export const RESIDENCE_OPTIONS = [
  "Côte d'Ivoire",
  'UEMOA',
  'Africaine Hors UEMOA',
  'Hors Afrique',
] as const

export const SUBSCRIPTION_PLACE_OPTIONS = ["Côte d'Ivoire", 'UEMOA'] as const

export const GENDER_OPTIONS = ['Masculin', 'Féminin'] as const

export const ID_TYPE_OPTIONS = [
  'CNI',
  "Attestation d'identité",
  'Passeport',
  'Permis de conduire',
  'Autres',
] as const

export const OCCUPATION_OPTIONS = [
  'Fonctionnaire / salarié du Secteur Public',
  'Salarié du Secteur privé',
  'Commerçant et entrepreneur individuel',
  'Profession libérale',
  'Planteur / Exploitant rural',
  'Agent des organismes internationaux',
  'Autre',
] as const

export const ORG_TYPE_OPTIONS = [
  'Banques ou autres établissements financiers',
  "Compagnies d'assurance",
  'Organismes de retraite ou de prévoyance',
  'OPCVM',
  'Sociétés industrielles ou commerciales',
  'Autres',
] as const

export const PAYMENT_OPTIONS = [
  'Espèces',
  'Chèque',
  'Virement',
  'Prélèvement',
  'Mobile Money',
] as const

export type SignaturePoint = { x: number; y: number }
export type SignatureStroke = SignaturePoint[]

export const SIGNATURE_WIDTH = 1000
export const SIGNATURE_HEIGHT = 300
const MAX_SIGNATURE_POINTS = 500

export function serializeSignature(strokes: SignatureStroke[]): string {
  const encoded = strokes
    .filter((stroke) => stroke.length > 0)
    .map((stroke) =>
      stroke.map(({ x, y }) => `${Math.round(x)},${Math.round(y)}`).join(';'),
    )
    .join('|')
  return encoded ? `v1|${encoded}` : ''
}

export function parseSignature(value: string | undefined): SignatureStroke[] | null {
  if (!value?.startsWith('v1|')) return null
  const encoded = value.slice(3)
  if (!encoded || encoded.length > 9_000) return null

  let pointCount = 0
  const strokes: SignatureStroke[] = []
  for (const encodedStroke of encoded.split('|')) {
    if (!encodedStroke) return null
    const stroke: SignatureStroke = []
    for (const encodedPoint of encodedStroke.split(';')) {
      const match = /^(\d{1,4}),(\d{1,3})$/.exec(encodedPoint)
      if (!match) return null
      const x = Number(match[1])
      const y = Number(match[2])
      if (x < 0 || x > SIGNATURE_WIDTH || y < 0 || y > SIGNATURE_HEIGHT) return null
      stroke.push({ x, y })
      pointCount += 1
      if (pointCount > MAX_SIGNATURE_POINTS) return null
    }
    if (stroke.length > 0) strokes.push(stroke)
  }

  return strokes.some((stroke) => stroke.length >= 2) ? strokes : null
}

const UNITS = [
  '',
  'un',
  'deux',
  'trois',
  'quatre',
  'cinq',
  'six',
  'sept',
  'huit',
  'neuf',
  'dix',
  'onze',
  'douze',
  'treize',
  'quatorze',
  'quinze',
  'seize',
  'dix-sept',
  'dix-huit',
  'dix-neuf',
] as const

const TENS = [
  '',
  '',
  'vingt',
  'trente',
  'quarante',
  'cinquante',
  'soixante',
  'soixante',
  'quatre-vingt',
  'quatre-vingt',
] as const

function underHundred(n: number): string {
  if (n < 20) return UNITS[n] ?? ''
  const ten = Math.floor(n / 10)
  const unit = n % 10
  if (ten === 7 || ten === 9) {
    const base = ten === 7 ? 60 : 80
    const rest = n - base
    if (ten === 9 && rest === 0) return 'quatre-vingt'
    const restWords = underHundred(rest)
    if (ten === 7 && unit === 1) return 'soixante et onze'
    return `${TENS[ten]}-${restWords}`
  }
  if (unit === 0) return ten === 8 ? 'quatre-vingts' : TENS[ten]!
  if (unit === 1 && ten !== 8) return `${TENS[ten]} et un`
  return `${TENS[ten]}-${UNITS[unit]}`
}

function underThousand(n: number): string {
  if (n < 100) return underHundred(n)
  const hundreds = Math.floor(n / 100)
  const rest = n % 100
  const hundredWord =
    hundreds === 1 ? 'cent' : `${UNITS[hundreds]} cent${rest === 0 && hundreds > 1 ? 's' : ''}`
  if (rest === 0) return hundredWord
  return `${hundredWord} ${underHundred(rest)}`
}

/** Convert a non-negative integer to French words (for FCFA totals). */
export function amountToFrenchWords(amount: number): string {
  const n = Math.floor(Math.abs(amount))
  if (n === 0) return 'zéro'
  if (n < 1000) return underThousand(n)

  const billions = Math.floor(n / 1_000_000_000)
  const millions = Math.floor((n % 1_000_000_000) / 1_000_000)
  const thousands = Math.floor((n % 1_000_000) / 1000)
  const rest = n % 1000

  const parts: string[] = []
  if (billions > 0) {
    parts.push(
      billions === 1 ? 'un milliard' : `${underThousand(billions)} milliards`,
    )
  }
  if (millions > 0) {
    parts.push(millions === 1 ? 'un million' : `${underThousand(millions)} millions`)
  }
  if (thousands > 0) {
    parts.push(thousands === 1 ? 'mille' : `${underThousand(thousands)} mille`)
  }
  if (rest > 0) parts.push(underThousand(rest))
  const words = parts.join(' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

export function computeBulletinTotals(shareCount: number): {
  totalFcfa: number
  totalLetters: string
} {
  const totalFcfa = shareCount * SHARE_PRICE_FCFA
  return {
    totalFcfa,
    totalLetters: `${amountToFrenchWords(totalFcfa)} francs CFA`,
  }
}

function field(
  id: string,
  type: FormField['type'],
  label: string,
  opts: Partial<FormField> = {},
): FormField {
  return { id, type, label, ...opts }
}

/**
 * Form definition stored in DB for admin viewing / lead extraction.
 * Branch-specific fields are optional at schema level; the custom UI
 * enforces required rules per subscriber type before submit.
 */
export function createIpoBulletinFormDefinition(): FormDefinition {
  return {
    pages: [
      {
        id: 'bb-page-type',
        title: 'Type de souscripteur',
        fields: [
          field(BULLETIN_FIELD_IDS.subscriberType, 'select', 'Vous souscrivez en tant que', {
            required: true,
            options: [...SUBSCRIBER_TYPES],
            leadRole: 'investor_profile',
          }),
        ],
      },
      {
        id: 'bb-page-identity',
        title: 'Identité',
        fields: [
          field(BULLETIN_FIELD_IDS.lastName, 'short_text', 'Nom(s)', {
            required: true,
            leadRole: 'name',
          }),
          field(BULLETIN_FIELD_IDS.firstName, 'short_text', 'Prénom(s)', {
            required: true,
          }),
          field(BULLETIN_FIELD_IDS.birthDate, 'date', 'Date de naissance', {
            required: true,
          }),
          field(BULLETIN_FIELD_IDS.birthPlace, 'short_text', 'Lieu de naissance', {
            required: true,
          }),
          field(BULLETIN_FIELD_IDS.nationality, 'select', 'Nationalité', {
            required: true,
            options: [...NATIONALITY_OPTIONS],
          }),
          field(BULLETIN_FIELD_IDS.residence, 'select', 'Pays de résidence', {
            required: true,
            options: [...RESIDENCE_OPTIONS],
            leadRole: 'city',
          }),
          field(BULLETIN_FIELD_IDS.subscriptionPlace, 'select', 'Lieu de souscription', {
            required: true,
            options: [...SUBSCRIPTION_PLACE_OPTIONS],
          }),
          field(BULLETIN_FIELD_IDS.gender, 'select', 'Sexe', {
            required: true,
            options: [...GENDER_OPTIONS],
          }),
          field(BULLETIN_FIELD_IDS.idType, 'select', "Pièce d'identité", {
            required: true,
            options: [...ID_TYPE_OPTIONS],
          }),
          field(BULLETIN_FIELD_IDS.idNumber, 'short_text', "Numéro pièce d'identité", {
            required: true,
          }),
          field(BULLETIN_FIELD_IDS.idIssuedOn, 'date', 'Délivrée le', {}),
          field(BULLETIN_FIELD_IDS.idIssuedBy, 'short_text', 'Par', {}),
          field(BULLETIN_FIELD_IDS.address, 'long_text', 'Adresse postale', {
            required: true,
          }),
          field(BULLETIN_FIELD_IDS.locality, 'short_text', 'Localité', {
            required: true,
          }),
          field(BULLETIN_FIELD_IDS.phone, 'phone', 'Téléphone', {
            required: true,
            leadRole: 'phone',
          }),
          field(BULLETIN_FIELD_IDS.fax, 'short_text', 'Fax', {}),
          field(BULLETIN_FIELD_IDS.email, 'email', 'Email', {
            leadRole: 'email',
          }),
        ],
      },
      {
        id: 'bb-page-physique',
        title: 'Personne physique',
        fields: [
          field(BULLETIN_FIELD_IDS.occupation, 'select', 'Catégorie professionnelle', {
            options: [...OCCUPATION_OPTIONS],
          }),
          field(BULLETIN_FIELD_IDS.occupationOther, 'short_text', 'Précisez (Autre)', {}),
          field(BULLETIN_FIELD_IDS.employerName, 'short_text', "Désignation de l'employeur", {}),
          field(BULLETIN_FIELD_IDS.employerAddress, 'long_text', "Adresse de l'employeur", {}),
          field(BULLETIN_FIELD_IDS.employerPhone, 'phone', "Téléphone de l'employeur", {}),
          field(BULLETIN_FIELD_IDS.employerFax, 'short_text', "Fax de l'employeur", {}),
          field(BULLETIN_FIELD_IDS.employerEmail, 'email', "Email de l'employeur", {}),
        ],
      },
      {
        id: 'bb-page-morale',
        title: 'Personne morale',
        fields: [
          field(BULLETIN_FIELD_IDS.orgType, 'select', "Type d'organisation", {
            options: [...ORG_TYPE_OPTIONS],
          }),
          field(BULLETIN_FIELD_IDS.orgTypeOther, 'short_text', 'Précisez (Autres)', {}),
          field(BULLETIN_FIELD_IDS.actingAs, 'short_text', 'Agissant en qualité de', {}),
          field(BULLETIN_FIELD_IDS.companyName, 'short_text', 'Dénomination', {
            leadRole: 'company',
          }),
          field(BULLETIN_FIELD_IDS.legalForm, 'short_text', 'Forme juridique', {}),
          field(BULLETIN_FIELD_IDS.shareCapital, 'number', 'Capital social (FCFA)', {}),
          field(BULLETIN_FIELD_IDS.orgAddress, 'long_text', 'Adresse postale (morale)', {}),
          field(BULLETIN_FIELD_IDS.orgLocality, 'short_text', 'Localité (morale)', {}),
          field(BULLETIN_FIELD_IDS.orgPhone, 'phone', 'Téléphone (morale)', {}),
          field(BULLETIN_FIELD_IDS.orgFax, 'short_text', 'Fax (morale)', {}),
          field(BULLETIN_FIELD_IDS.orgEmail, 'email', 'Email (morale)', {}),
        ],
      },
      {
        id: 'bb-page-subscription',
        title: 'Souscription & paiement',
        fields: [
          field(BULLETIN_FIELD_IDS.shareCount, 'number', "Nombre d'actions", {
            required: true,
          }),
          field(BULLETIN_FIELD_IDS.totalFcfa, 'number', 'Total FCFA (chiffres)', {
            required: true,
            leadRole: 'amount_range',
          }),
          field(BULLETIN_FIELD_IDS.totalLetters, 'long_text', 'Total FCFA (lettres)', {
            required: true,
          }),
          field(BULLETIN_FIELD_IDS.sgiBtcc, 'short_text', 'SGI / BTCC de domiciliation', {
            leadRole: 'securities_account',
          }),
          field(BULLETIN_FIELD_IDS.paymentMethod, 'select', 'Moyen de paiement', {
            required: true,
            options: [...PAYMENT_OPTIONS],
          }),
          field(BULLETIN_FIELD_IDS.chequeNumber, 'short_text', 'Chèque n°', {}),
          field(BULLETIN_FIELD_IDS.bankName, 'short_text', 'Banque / établissement financier', {}),
          field(BULLETIN_FIELD_IDS.accountNumber, 'short_text', 'N° de compte', {}),
          field(BULLETIN_FIELD_IDS.place, 'short_text', 'Lieu', {
            required: true,
          }),
          field(BULLETIN_FIELD_IDS.date, 'date', 'Date', {
            required: true,
          }),
          field(BULLETIN_FIELD_IDS.signature, 'long_text', 'Signature du souscripteur', {
            required: true,
          }),
          field(BULLETIN_FIELD_IDS.certify, 'checkbox', 'Je certifie l’exactitude des informations', {
            required: true,
          }),
        ],
      },
    ],
    theme: {
      primaryColor: '#012d2a',
      thankYouMessage:
        'Votre bulletin signé a été enregistré. Un conseiller EVEREST Finance vous recontacte pour finaliser le règlement.',
    },
  }
}

export function isBulletinFormSlug(slug: string): boolean {
  return slug === IPO_BULLETIN_SLUG
}

/** Client-side required rules that depend on subscriber type / payment. */
export function validateBulletinStep(
  stepId: string,
  answers: Record<string, string>,
): string | null {
  const id = BULLETIN_FIELD_IDS
  const type = answers[id.subscriberType] as SubscriberType | undefined

  const require = (fieldId: string, label: string) => {
    const v = answers[fieldId]?.trim() ?? ''
    if (!v || (fieldId === id.certify && v !== 'true')) {
      return `${label} est requis`
    }
    return null
  }

  if (stepId === 'type') {
    return require(id.subscriberType, 'Le type de souscripteur')
  }

  if (stepId === 'identity') {
    for (const [fid, label] of [
      [id.lastName, 'Le nom'],
      [id.firstName, 'Le prénom'],
      [id.birthDate, 'La date de naissance'],
      [id.birthPlace, 'Le lieu de naissance'],
      [id.nationality, 'La nationalité'],
      [id.residence, 'Le pays de résidence'],
      [id.subscriptionPlace, 'Le lieu de souscription'],
      [id.gender, 'Le sexe'],
      [id.idType, "Le type de pièce d'identité"],
      [id.idNumber, "Le numéro de pièce d'identité"],
      [id.address, "L'adresse"],
      [id.locality, 'La localité'],
      [id.phone, 'Le téléphone'],
    ] as const) {
      const err = require(fid, label)
      if (err) return err
    }
    const email = answers[id.email]?.trim()
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "L'email n'est pas valide"
    }
    return null
  }

  if (stepId === 'physique') {
    if (type !== 'Personne physique') return null
    const err = require(id.occupation, 'La catégorie professionnelle')
    if (err) return err
    if (answers[id.occupation] === 'Autre') {
      return require(id.occupationOther, 'La précision de profession')
    }
    return null
  }

  if (stepId === 'morale') {
    if (type !== 'Personne morale') return null
    for (const [fid, label] of [
      [id.orgType, "Le type d'organisation"],
      [id.actingAs, 'La qualité'],
      [id.companyName, 'La dénomination'],
    ] as const) {
      const err = require(fid, label)
      if (err) return err
    }
    if (answers[id.orgType] === 'Autres') {
      return require(id.orgTypeOther, 'La précision')
    }
    return null
  }

  if (stepId === 'subscription') {
    const shares = Number(answers[id.shareCount])
    if (!Number.isInteger(shares) || shares <= 0) {
      return "Le nombre d'actions doit être un entier positif"
    }
    const errPay = require(id.paymentMethod, 'Le moyen de paiement')
    if (errPay) return errPay
    if (answers[id.paymentMethod] === 'Chèque') {
      const errCh = require(id.chequeNumber, 'Le numéro de chèque')
      if (errCh) return errCh
    }
    for (const [fid, label] of [
      [id.place, 'Le lieu'],
      [id.date, 'La date'],
    ] as const) {
      const err = require(fid, label)
      if (err) return err
    }
    if (!parseSignature(answers[id.signature])) {
      return 'La signature du souscripteur est requise'
    }
    const certificationError = require(id.certify, 'La certification')
    if (certificationError) return certificationError
    return null
  }

  return null
}

/** Enrich answers with computed totals before submit. */
export function enrichBulletinAnswers(
  answers: Record<string, string>,
): Record<string, string> {
  const shares = Number(answers[BULLETIN_FIELD_IDS.shareCount] ?? 0)
  if (!Number.isFinite(shares) || shares <= 0) return answers
  const { totalFcfa, totalLetters } = computeBulletinTotals(shares)
  return {
    ...answers,
    [BULLETIN_FIELD_IDS.totalFcfa]: String(totalFcfa),
    [BULLETIN_FIELD_IDS.totalLetters]: totalLetters,
  }
}

export function bulletinDisplayName(answers: Record<string, string>): string {
  const last = answers[BULLETIN_FIELD_IDS.lastName]?.trim() ?? ''
  const first = answers[BULLETIN_FIELD_IDS.firstName]?.trim() ?? ''
  return [last, first].filter(Boolean).join(' ')
}
