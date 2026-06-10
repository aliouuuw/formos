import type { FormDefinition, FormField } from '#/lib/form-types'
import { MAX_ANSWER_KEYS, MAX_ANSWER_VALUE_LENGTH } from '#/lib/limits'

export type ValidatedAnswers = Record<string, string>

type ValidationResult =
  | { ok: true; answers: ValidatedAnswers }
  | { ok: false; message: string }

function validateFieldValue(field: FormField, value: string): string | null {
  if (value.length > MAX_ANSWER_VALUE_LENGTH) {
    return `${field.label} is too long`
  }

  switch (field.type) {
    case 'email':
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return `${field.label} must be a valid email`
      }
      break
    case 'number':
      if (Number.isNaN(Number(value))) {
        return `${field.label} must be a number`
      }
      break
    case 'date':
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return `${field.label} must be a valid date`
      }
      break
    case 'select':
      if (field.options && !field.options.includes(value)) {
        return `${field.label} has an invalid option`
      }
      break
    case 'checkbox':
      if (value !== 'true' && value !== 'false') {
        return `${field.label} must be checked or unchecked`
      }
      break
    default:
      break
  }

  return null
}

export function validateSubmissionAnswers(
  definition: FormDefinition,
  rawAnswers: Record<string, unknown>,
): ValidationResult {
  const fields = definition.pages.flatMap((page) => page.fields)
  const fieldById = new Map(fields.map((field) => [field.id, field]))
  const answerKeys = Object.keys(rawAnswers)

  if (answerKeys.length > MAX_ANSWER_KEYS) {
    return { ok: false, message: 'Too many answers submitted' }
  }

  for (const key of answerKeys) {
    if (!fieldById.has(key)) {
      return { ok: false, message: 'Unknown field in submission' }
    }
  }

  const answers: ValidatedAnswers = {}

  for (const field of fields) {
    const raw = rawAnswers[field.id]

    if (raw === undefined || raw === null || raw === '') {
      if (field.required) {
        return { ok: false, message: `${field.label} is required` }
      }
      continue
    }

    if (typeof raw !== 'string') {
      return { ok: false, message: `${field.label} must be text` }
    }

    const value = raw.trim()
    if (field.required && value.length === 0) {
      return { ok: false, message: `${field.label} is required` }
    }

    if (value.length === 0) continue

    const fieldError = validateFieldValue(field, value)
    if (fieldError) {
      return { ok: false, message: fieldError }
    }

    answers[field.id] = value
  }

  return { ok: true, answers }
}

export function assertJsonPayloadSize(
  value: unknown,
  maxBytes: number,
  label: string,
): void {
  const size = JSON.stringify(value ?? {}).length
  if (size > maxBytes) {
    throw new Error(`${label} exceeds maximum size`)
  }
}
