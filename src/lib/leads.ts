import type { FormDefinition } from '#/lib/form-types'

export function extractLeadFields(
  definition: FormDefinition,
  answers: Record<string, unknown>,
) {
  const fields = definition.pages.flatMap((page) => page.fields)

  let email: string | undefined
  let name: string | undefined
  let phone: string | undefined

  for (const field of fields) {
    const value = answers[field.id]
    if (typeof value !== 'string' || value.length === 0) continue

    if (field.type === 'email' && !email) email = value
    if (field.type === 'phone' && !phone) phone = value
    if (
      !name &&
      (field.label.toLowerCase().includes('name') || field.type === 'short_text')
    ) {
      name = value
    }
  }

  return { email, name, phone }
}
