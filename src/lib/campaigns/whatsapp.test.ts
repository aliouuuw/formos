import { expect, test } from 'vitest'

import { campaignWhatsAppUrl, whatsAppDigits } from '#/lib/campaigns/whatsapp'

test('local Senegal mobile gets the 221 prefix', () => {
  expect(whatsAppDigits('770993382')).toBe('221770993382')
  expect(whatsAppDigits('77 099 33 82')).toBe('221770993382')
  expect(whatsAppDigits('+221 77 099 33 82')).toBe('221770993382')
  expect(whatsAppDigits('2250707070707')).toBe('2250707070707')
})

test('prefill names the campaign', () => {
  expect(campaignWhatsAppUrl('770993382', 'IPO Coris Bank')).toContain('IPO%20Coris%20Bank')
  expect(campaignWhatsAppUrl(undefined)).toBeNull()
})

test('international 00 prefix is dropped', () => {
  expect(whatsAppDigits('0033769033921')).toBe('33769033921')
})
