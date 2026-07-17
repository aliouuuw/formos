import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'

import {
  BULLETIN_FIELD_IDS as ID,
  SIGNATURE_HEIGHT,
  SIGNATURE_WIDTH,
  parseSignature,
  type SubscriberType,
} from '#/lib/ipo-bulletin'
import { BULLETIN_TEMPLATE_BASE64 } from '#/lib/pdf/bulletin-template.base64'

type TextPlacement = {
  x: number
  y: number
  size?: number
  maxWidth?: number
}

type CheckPlacement = {
  x: number
  y: number
  size?: number
}

/**
 * PDF user-space coordinates (origin bottom-left, A4 ≈ 595×842).
 * Calibrated against the official Bridge Bank CI bulletin scan.
 */
export const BULLETIN_TEXT_PLACEMENTS: Record<string, TextPlacement> = {
  lastName: { x: 148, y: 681, size: 9, maxWidth: 170 },
  firstName: { x: 385, y: 681, size: 9, maxWidth: 175 },
  birth: { x: 165, y: 666, size: 9, maxWidth: 395 },
  idNumber: { x: 150, y: 570, size: 9, maxWidth: 405 },
  idIssuedOn: { x: 100, y: 555, size: 9, maxWidth: 165 },
  idIssuedBy: { x: 310, y: 555, size: 9, maxWidth: 250 },
  address: { x: 105, y: 544, size: 8, maxWidth: 260 },
  locality: { x: 425, y: 544, size: 8, maxWidth: 135 },
  phone: { x: 88, y: 533, size: 6.5, maxWidth: 130 },
  fax: { x: 230, y: 533, size: 8, maxWidth: 85 },
  email: { x: 350, y: 533, size: 8, maxWidth: 210 },
  // Physique
  occupationOther: { x: 477, y: 496, size: 7, maxWidth: 80 },
  employer: { x: 235, y: 441, size: 8, maxWidth: 325 },
  employerPhone: { x: 88, y: 430, size: 7, maxWidth: 130 },
  employerFax: { x: 230, y: 430, size: 7, maxWidth: 85 },
  employerEmail: { x: 350, y: 430, size: 7, maxWidth: 210 },
  // Morale
  actingAs: { x: 170, y: 356, size: 8, maxWidth: 390 },
  companyName: { x: 90, y: 332, size: 9, maxWidth: 470 },
  legalForm: { x: 95, y: 321, size: 8, maxWidth: 170 },
  shareCapital: { x: 330, y: 321, size: 8, maxWidth: 230 },
  orgAddress: { x: 105, y: 310, size: 8, maxWidth: 250 },
  orgLocality: { x: 370, y: 310, size: 8, maxWidth: 190 },
  orgPhone: { x: 88, y: 299, size: 7, maxWidth: 130 },
  orgFax: { x: 230, y: 299, size: 7, maxWidth: 85 },
  orgEmail: { x: 350, y: 299, size: 7, maxWidth: 210 },
  // Souscription (calibrated via debug overlay on template)
  shareCount: { x: 270, y: 255, size: 7, maxWidth: 75 },
  totalFcfa: { x: 218, y: 244, size: 8, maxWidth: 105 },
  totalLetters: { x: 336, y: 244, size: 7, maxWidth: 225 },
  sgiBtcc: { x: 245, y: 233, size: 8, maxWidth: 315 },
  // Paiement
  chequeNumber: { x: 145, y: 198, size: 8, maxWidth: 150 },
  bankName: { x: 319, y: 177, size: 8, maxWidth: 240 },
  accountNumber: { x: 160, y: 164, size: 8, maxWidth: 300 },
  // Signature block
  place: { x: 470, y: 128, size: 8, maxWidth: 55 },
  date: { x: 530, y: 128, size: 8, maxWidth: 45 },
  bonParts: { x: 430, y: 100, size: 8, maxWidth: 100 },
  bonFcfa: { x: 430, y: 90, size: 8, maxWidth: 105 },
}

const TEXT = BULLETIN_TEXT_PLACEMENTS

export const BULLETIN_CHECK_PLACEMENTS = {
  nationality: {
    Ivoirienne: { x: 125.1, y: 648.8 },
    UEMOA: { x: 194.9, y: 648.8 },
    'Africaine Hors UEMOA': { x: 290.4, y: 648.8 },
    'Non Africaine': { x: 399.9, y: 648.8 },
  },
  residence: {
    "Côte d'Ivoire": { x: 125.1, y: 631.1 },
    UEMOA: { x: 194.9, y: 631.1 },
    'Africaine Hors UEMOA': { x: 290.4, y: 631.6 },
    'Hors Afrique': { x: 399.9, y: 631.6 },
  },
  subscriptionPlace: {
    "Côte d'Ivoire": { x: 125.1, y: 614.0 },
    UEMOA: { x: 194.9, y: 614.0 },
  },
  gender: {
    Masculin: { x: 125.1, y: 596.7 },
    Féminin: { x: 194.9, y: 596.7 },
  },
  idType: {
    CNI: { x: 125.1, y: 580.1 },
    "Attestation d'identité": { x: 194.9, y: 580.1 },
    Passeport: { x: 290.4, y: 580.1 },
    'Permis de conduire': { x: 400.1, y: 580.1 },
    Autres: { x: 507.0, y: 580.1 },
  },
  occupation: {
    'Fonctionnaire / salarié du Secteur Public': { x: 26.6, y: 491.7 },
    'Salarié du Secteur privé': { x: 26.6, y: 477.2 },
    'Commerçant et entrepreneur individuel': { x: 25.9, y: 463.2 },
    'Profession libérale': { x: 240.3, y: 492.2 },
    'Planteur / Exploitant rural': { x: 240.3, y: 479.1 },
    'Agent des organismes internationaux': { x: 240.3, y: 463.4 },
    Autre: { x: 435.7, y: 492.2 },
  },
  orgType: {
    'Banques ou autres établissements financiers': { x: 25.9, y: 394.4 },
    "Compagnies d'assurance": { x: 25.9, y: 380.1 },
    'Organismes de retraite ou de prévoyance': { x: 25.9, y: 366.1 },
    OPCVM: { x: 276.1, y: 394.6 },
    'Sociétés industrielles ou commerciales': { x: 275.8, y: 380.8 },
    Autres: { x: 275.8, y: 366.3 },
  },
  payment: {
    Espèces: { x: 25.0, y: 194.0 },
    Chèque: { x: 85.8, y: 194.0 },
    Virement: { x: 312.8, y: 194.0 },
    Prélèvement: { x: 389.6, y: 194.0 },
    'Mobile Money': { x: 478.5, y: 194.7 },
  },
} as const

const CHECKS = BULLETIN_CHECK_PLACEMENTS

export const BULLETIN_SIGNATURE_PLACEMENT = {
  x: 241,
  y: 89,
  width: 138,
  height: 34,
} as const

function formatDateFr(iso: string | undefined): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso ?? ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function formatNumberFr(n: number | string): string {
  const num = typeof n === 'string' ? Number(n) : n
  if (!Number.isFinite(num)) return String(n)
  // Helvetica (WinAnsi) cannot encode narrow no-break spaces from fr-FR.
  return new Intl.NumberFormat('fr-FR').format(num).replace(/[\u202f\u00a0]/g, ' ')
}

/** Strip characters that StandardFonts.Helvetica cannot encode. */
function toWinAnsi(text: string): string {
  return text
    .normalize('NFC')
    .replace(/[\u202f\u00a0]/g, ' ')
    .replace(/[^\x00-\xFF]/g, '?')
}

function drawText(
  page: PDFPage,
  font: PDFFont,
  value: string | undefined,
  placement: TextPlacement,
) {
  const text = value?.trim()
  if (!text) return
  const size = placement.size ?? 9
  let drawn = toWinAnsi(text)
  if (placement.maxWidth) {
    while (drawn.length > 1 && font.widthOfTextAtSize(drawn, size) > placement.maxWidth) {
      drawn = drawn.slice(0, -1)
    }
    if (drawn !== toWinAnsi(text)) drawn = `${drawn.slice(0, -1)}…`
  }
  page.drawText(drawn, {
    x: placement.x,
    y: placement.y,
    size,
    font,
    color: rgb(0.05, 0.05, 0.1),
  })
}

function drawCheck(page: PDFPage, font: PDFFont, placement: CheckPlacement | undefined) {
  if (!placement) return
  const size = placement.size ?? 10
  page.drawText('X', {
    x: placement.x,
    y: placement.y,
    size,
    font,
    color: rgb(0.05, 0.05, 0.1),
  })
}

function drawSignature(page: PDFPage, value: string | undefined) {
  const strokes = parseSignature(value)
  if (!strokes) return

  const placement = BULLETIN_SIGNATURE_PLACEMENT
  for (const stroke of strokes) {
    for (let index = 1; index < stroke.length; index += 1) {
      const previous = stroke[index - 1]
      const current = stroke[index]
      if (!previous || !current) continue
      page.drawLine({
        start: {
          x: placement.x + (previous.x / SIGNATURE_WIDTH) * placement.width,
          y:
            placement.y +
            placement.height -
            (previous.y / SIGNATURE_HEIGHT) * placement.height,
        },
        end: {
          x: placement.x + (current.x / SIGNATURE_WIDTH) * placement.width,
          y:
            placement.y +
            placement.height -
            (current.y / SIGNATURE_HEIGHT) * placement.height,
        },
        thickness: 1.15,
        color: rgb(0.03, 0.08, 0.08),
      })
    }
  }
}

function a(answers: Record<string, string>, key: string): string | undefined {
  const v = answers[key]
  return typeof v === 'string' && v.trim() ? v.trim() : undefined
}

/**
 * Fill the official Bulletin de souscription template with submission answers.
 * The subscriber signature is drawn into its official box; the stamp remains
 * unchanged from the source template.
 */
export async function fillBulletinPdf(
  answers: Record<string, string>,
): Promise<Uint8Array> {
  const bytes = Uint8Array.from(atob(BULLETIN_TEMPLATE_BASE64), (c) => c.charCodeAt(0))
  const doc = await PDFDocument.load(bytes)
  const page = doc.getPages()[0]
  if (!page) throw new Error('Bulletin template has no pages')

  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  const lastName = a(answers, ID.lastName)
  const firstName = a(answers, ID.firstName)
  drawText(page, font, lastName, TEXT.lastName)
  drawText(page, font, firstName, TEXT.firstName)

  const birthDate = formatDateFr(a(answers, ID.birthDate))
  const birthPlace = a(answers, ID.birthPlace)
  const birth = [birthDate, birthPlace].filter(Boolean).join(' à ')
  drawText(page, font, birth, TEXT.birth)

  const nationality = a(answers, ID.nationality)
  if (nationality && nationality in CHECKS.nationality) {
    drawCheck(page, bold, CHECKS.nationality[nationality as keyof typeof CHECKS.nationality])
  }

  const residence = a(answers, ID.residence)
  if (residence && residence in CHECKS.residence) {
    drawCheck(page, bold, CHECKS.residence[residence as keyof typeof CHECKS.residence])
  }

  const subPlace = a(answers, ID.subscriptionPlace)
  if (subPlace && subPlace in CHECKS.subscriptionPlace) {
    drawCheck(
      page,
      bold,
      CHECKS.subscriptionPlace[subPlace as keyof typeof CHECKS.subscriptionPlace],
    )
  }

  const gender = a(answers, ID.gender)
  if (gender && gender in CHECKS.gender) {
    drawCheck(page, bold, CHECKS.gender[gender as keyof typeof CHECKS.gender])
  }

  const idType = a(answers, ID.idType)
  if (idType && idType in CHECKS.idType) {
    drawCheck(page, bold, CHECKS.idType[idType as keyof typeof CHECKS.idType])
  }

  drawText(page, font, a(answers, ID.idNumber), TEXT.idNumber)
  drawText(page, font, formatDateFr(a(answers, ID.idIssuedOn)), TEXT.idIssuedOn)
  drawText(page, font, a(answers, ID.idIssuedBy), TEXT.idIssuedBy)
  drawText(page, font, a(answers, ID.address), TEXT.address)
  drawText(page, font, a(answers, ID.locality), TEXT.locality)
  drawText(page, font, a(answers, ID.phone), TEXT.phone)
  drawText(page, font, a(answers, ID.fax), TEXT.fax)
  drawText(page, font, a(answers, ID.email), TEXT.email)

  const subscriberType = a(answers, ID.subscriberType) as SubscriberType | undefined

  if (subscriberType === 'Personne physique') {
    const occupation = a(answers, ID.occupation)
    if (occupation && occupation in CHECKS.occupation) {
      drawCheck(page, bold, CHECKS.occupation[occupation as keyof typeof CHECKS.occupation])
    }
    if (occupation === 'Autre') {
      drawText(page, font, a(answers, ID.occupationOther), TEXT.occupationOther)
    }
    const employer = [a(answers, ID.employerName), a(answers, ID.employerAddress)]
      .filter(Boolean)
      .join(', ')
    drawText(page, font, employer, TEXT.employer)
    drawText(page, font, a(answers, ID.employerPhone), TEXT.employerPhone)
    drawText(page, font, a(answers, ID.employerFax), TEXT.employerFax)
    drawText(page, font, a(answers, ID.employerEmail), TEXT.employerEmail)
  }

  if (subscriberType === 'Personne morale') {
    const orgType = a(answers, ID.orgType)
    if (orgType && orgType in CHECKS.orgType) {
      drawCheck(page, bold, CHECKS.orgType[orgType as keyof typeof CHECKS.orgType])
    }
    drawText(page, font, a(answers, ID.actingAs), TEXT.actingAs)
    const company =
      orgType === 'Autres'
        ? [a(answers, ID.companyName), a(answers, ID.orgTypeOther)].filter(Boolean).join(', ')
        : a(answers, ID.companyName)
    drawText(page, font, company, TEXT.companyName)
    drawText(page, font, a(answers, ID.legalForm), TEXT.legalForm)
    const capital = a(answers, ID.shareCapital)
    drawText(
      page,
      font,
      capital ? `${formatNumberFr(capital)} FCFA` : undefined,
      TEXT.shareCapital,
    )
    drawText(page, font, a(answers, ID.orgAddress), TEXT.orgAddress)
    drawText(page, font, a(answers, ID.orgLocality), TEXT.orgLocality)
    drawText(page, font, a(answers, ID.orgPhone), TEXT.orgPhone)
    drawText(page, font, a(answers, ID.orgFax), TEXT.orgFax)
    drawText(page, font, a(answers, ID.orgEmail), TEXT.orgEmail)
  }

  const shares = a(answers, ID.shareCount)
  drawText(page, bold, shares ? formatNumberFr(shares) : undefined, TEXT.shareCount)
  const total = a(answers, ID.totalFcfa)
  drawText(page, bold, total ? formatNumberFr(total) : undefined, TEXT.totalFcfa)
  drawText(page, font, a(answers, ID.totalLetters), TEXT.totalLetters)
  drawText(page, font, a(answers, ID.sgiBtcc), TEXT.sgiBtcc)

  const payment = a(answers, ID.paymentMethod)
  if (payment && payment in CHECKS.payment) {
    drawCheck(page, bold, CHECKS.payment[payment as keyof typeof CHECKS.payment])
  }
  if (payment === 'Chèque') {
    drawText(page, font, a(answers, ID.chequeNumber), TEXT.chequeNumber)
  }
  drawText(page, font, a(answers, ID.bankName), TEXT.bankName)
  drawText(page, font, a(answers, ID.accountNumber), TEXT.accountNumber)

  drawText(page, font, a(answers, ID.place), TEXT.place)
  drawText(page, font, formatDateFr(a(answers, ID.date)), TEXT.date)
  drawText(page, bold, shares ? formatNumberFr(shares) : undefined, TEXT.bonParts)
  drawText(page, bold, total ? formatNumberFr(total) : undefined, TEXT.bonFcfa)
  drawSignature(page, a(answers, ID.signature))

  return doc.save()
}

export function bulletinPdfFilename(answers: Record<string, string>): string {
  const last = a(answers, ID.lastName)?.replace(/[^\w\-]+/g, '_') ?? 'souscripteur'
  const first = a(answers, ID.firstName)?.replace(/[^\w\-]+/g, '_') ?? ''
  const name = [last, first].filter(Boolean).join('_')
  return `bulletin-souscription-ipo-bridge-bank-${name}.pdf`
}
