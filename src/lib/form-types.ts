import { z } from 'zod'

export const fieldTypeSchema = z.enum([
  'short_text',
  'long_text',
  'email',
  'phone',
  'number',
  'select',
  'checkbox',
  'date',
])

export const formFieldSchema = z.object({
  id: z.string().min(1),
  type: fieldTypeSchema,
  label: z.string().min(1),
  required: z.boolean().optional(),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(),
})

export const formPageSchema = z.object({
  id: z.string().min(1),
  title: z.string().optional(),
  fields: z.array(formFieldSchema),
})

export const formDefinitionSchema = z.object({
  pages: z.array(formPageSchema).min(1),
  theme: z
    .object({
      primaryColor: z.string().optional(),
      thankYouMessage: z.string().optional(),
    })
    .optional(),
})

export const formStatusSchema = z.enum(['draft', 'published', 'archived'])

export const analyticsEventTypeSchema = z.enum([
  'form_viewed',
  'form_started',
  'page_viewed',
  'field_viewed',
  'field_answered',
  'field_skipped',
  'form_completed',
  'form_abandoned',
])

export const leadStatusSchema = z.enum([
  'new',
  'contacted',
  'rdv',
  'souscrit',
  'qualified',
  'won',
  'lost',
])

export type FieldType = z.infer<typeof fieldTypeSchema>
export type FormField = z.infer<typeof formFieldSchema>
export type FormPage = z.infer<typeof formPageSchema>
export type FormDefinition = z.infer<typeof formDefinitionSchema>
export type FormStatus = z.infer<typeof formStatusSchema>
export type AnalyticsEventType = z.infer<typeof analyticsEventTypeSchema>
export type LeadStatus = z.infer<typeof leadStatusSchema>

export function createDefaultFormDefinition(title: string): FormDefinition {
  return {
    pages: [
      {
        id: crypto.randomUUID(),
        title,
        fields: [
          {
            id: crypto.randomUUID(),
            type: 'email',
            label: 'Email',
            required: true,
            placeholder: 'you@company.com',
          },
        ],
      },
    ],
    theme: {
      thankYouMessage: 'Thanks for your submission!',
    },
  }
}

export function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)

  if (slug.length > 0) return slug

  return `form-${crypto.randomUUID().slice(0, 8)}`
}
