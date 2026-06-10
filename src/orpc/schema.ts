import { z } from 'zod'

import { formDefinitionSchema } from '#/lib/form-types'

export const FormSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  status: z.string(),
  definition: formDefinitionSchema,
  version: z.number(),
})
