import { expect, test } from 'vitest'

import type { FormField } from '#/lib/form-types'
import { validateFieldValue } from '#/lib/validate-answers'

const phone = { id: 'p', type: 'phone', label: 'Téléphone' } as FormField

test('phone accepts real numbers with or without country code', () => {
  for (const ok of ['786833713', '+221 77 000 00 00', '0033769033921', '+86 195 8481 5254', '07-07-07-07-07']) {
    expect(validateFieldValue(phone, ok)).toBeNull()
  }
})

test('phone rejects text and wrong lengths', () => {
  for (const bad of ['abc', '1234567', '77 abc 00 00', '1234567890123456']) {
    expect(validateFieldValue(phone, bad)).toContain('numéro invalide')
  }
})
