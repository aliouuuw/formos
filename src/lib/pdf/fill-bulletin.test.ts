import { describe, expect, it } from 'vitest'

import { parseSignature, serializeSignature } from '#/lib/ipo-bulletin'
import {
  BULLETIN_CHECK_PLACEMENTS,
  BULLETIN_SIGNATURE_PLACEMENT,
  BULLETIN_TEXT_PLACEMENTS,
  fillBulletinPdf,
} from '#/lib/pdf/fill-bulletin'

describe('Bridge Bank bulletin PDF alignment', () => {
  it('keeps measured text anchors on their template rows', () => {
    expect({
      identityNumber: BULLETIN_TEXT_PLACEMENTS.idNumber,
      employer: BULLETIN_TEXT_PLACEMENTS.employer,
      companyName: BULLETIN_TEXT_PLACEMENTS.companyName,
      shares: BULLETIN_TEXT_PLACEMENTS.shareCount,
      total: BULLETIN_TEXT_PLACEMENTS.totalFcfa,
      bank: BULLETIN_TEXT_PLACEMENTS.bankName,
      place: BULLETIN_TEXT_PLACEMENTS.place,
      finalShares: BULLETIN_TEXT_PLACEMENTS.bonParts,
      finalAmount: BULLETIN_TEXT_PLACEMENTS.bonFcfa,
    }).toMatchInlineSnapshot(`
      {
        "bank": {
          "maxWidth": 240,
          "size": 8,
          "x": 319,
          "y": 177,
        },
        "companyName": {
          "maxWidth": 470,
          "size": 9,
          "x": 90,
          "y": 332,
        },
        "employer": {
          "maxWidth": 325,
          "size": 8,
          "x": 235,
          "y": 441,
        },
        "finalAmount": {
          "maxWidth": 105,
          "size": 8,
          "x": 430,
          "y": 90,
        },
        "finalShares": {
          "maxWidth": 100,
          "size": 8,
          "x": 430,
          "y": 100,
        },
        "identityNumber": {
          "maxWidth": 405,
          "size": 9,
          "x": 150,
          "y": 570,
        },
        "place": {
          "maxWidth": 55,
          "size": 8,
          "x": 470,
          "y": 128,
        },
        "shares": {
          "maxWidth": 75,
          "size": 7,
          "x": 270,
          "y": 255,
        },
        "total": {
          "maxWidth": 105,
          "size": 8,
          "x": 218,
          "y": 244,
        },
      }
    `)
  })

  it('keeps checkbox marks centered on measured boxes', () => {
    expect({
      nationality: BULLETIN_CHECK_PLACEMENTS.nationality.Ivoirienne,
      residence: BULLETIN_CHECK_PLACEMENTS.residence["Côte d'Ivoire"],
      gender: BULLETIN_CHECK_PLACEMENTS.gender.Masculin,
      idType: BULLETIN_CHECK_PLACEMENTS.idType.CNI,
      occupation: BULLETIN_CHECK_PLACEMENTS.occupation['Salarié du Secteur privé'],
      organization:
        BULLETIN_CHECK_PLACEMENTS.orgType['Sociétés industrielles ou commerciales'],
      payment: BULLETIN_CHECK_PLACEMENTS.payment.Virement,
    }).toMatchInlineSnapshot(`
      {
        "gender": {
          "x": 125.1,
          "y": 596.7,
        },
        "idType": {
          "x": 125.1,
          "y": 580.1,
        },
        "nationality": {
          "x": 125.1,
          "y": 648.8,
        },
        "occupation": {
          "x": 26.6,
          "y": 477.2,
        },
        "organization": {
          "x": 275.8,
          "y": 380.8,
        },
        "payment": {
          "x": 312.8,
          "y": 194,
        },
        "residence": {
          "x": 125.1,
          "y": 631.1,
        },
      }
    `)
  })

  it('keeps the signature inside the official subscriber box', () => {
    expect(BULLETIN_SIGNATURE_PLACEMENT).toEqual({
      x: 241,
      y: 89,
      width: 138,
      height: 34,
    })
  })

  it('round-trips compact vector signature strokes', () => {
    const signature = serializeSignature([
      [
        { x: 80, y: 220 },
        { x: 300, y: 80 },
        { x: 520, y: 210 },
      ],
      [
        { x: 420, y: 230 },
        { x: 850, y: 180 },
      ],
    ])

    expect(signature).toBe('v1|80,220;300,80;520,210|420,230;850,180')
    expect(parseSignature(signature)).toHaveLength(2)
    expect(parseSignature('not-a-signature')).toBeNull()
  })

  it('renders a filled PDF from the official template', async () => {
    const pdf = await fillBulletinPdf({
      'bb-subscriber-type': 'Personne physique',
      'bb-last-name': 'KOUASSI',
      'bb-first-name': 'Jean',
      'bb-nationality': 'Ivoirienne',
      'bb-residence': "Côte d'Ivoire",
      'bb-subscription-place': "Côte d'Ivoire",
      'bb-gender': 'Masculin',
      'bb-id-type': 'CNI',
      'bb-occupation': 'Salarié du Secteur privé',
      'bb-share-count': '100',
      'bb-total-fcfa': '675000',
      'bb-total-letters': 'Six cent soixante-quinze mille francs CFA',
      'bb-payment-method': 'Virement',
      'bb-place': 'Abidjan',
      'bb-date': '2026-07-17',
      'bb-signature': 'v1|80,220;300,80;520,210|420,230;850,180',
    })

    expect(pdf.byteLength).toBeGreaterThan(400_000)
    expect(new TextDecoder().decode(pdf.slice(0, 5))).toBe('%PDF-')
  })
})
