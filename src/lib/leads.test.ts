import { describe, expect, it } from 'vitest'

import type { FormDefinition } from '#/lib/form-types'
import { extractLeadFields } from '#/lib/leads'

const nameFor = (labels: string[], values: string[]) =>
  extractLeadFields(
    {
      pages: [
        {
          id: 'p',
          fields: labels.map((label, i) => ({ id: `f${i}`, type: 'short_text', label })),
        },
      ],
    } as FormDefinition,
    Object.fromEntries(values.map((v, i) => [`f${i}`, v])),
  ).name

describe('extractLeadFields name', () => {
  it('joins separate first and last name fields in any order', () => {
    expect(nameFor(['Nom', 'Prénom'], ['Fall', 'Awa'])).toBe('Awa Fall')
    expect(nameFor(['Prénom(s)', 'Nom de famille'], ['Awa', 'Fall'])).toBe('Awa Fall')
  })
  it('keeps a single full name field', () => {
    expect(nameFor(['Prénom et nom'], ['Awa Fall'])).toBe('Awa Fall')
    expect(nameFor(['Nom complet', "Nom de l'entreprise"], ['Awa Fall', 'ACME'])).toBe('Awa Fall')
  })
})
