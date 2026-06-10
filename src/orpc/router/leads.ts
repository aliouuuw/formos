import { ORPCError } from '@orpc/server'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '#/db/index'
import { forms, leads } from '#/db/schema'
import { leadStatusSchema } from '#/lib/form-types'
import { authedContext } from '#/orpc/context'

export const listLeads = authedContext
  .input(
    z.object({
      formId: z.string().optional(),
      status: leadStatusSchema.optional(),
    }),
  )
  .handler(async ({ context, input }) => {
    const userForms = await db.query.forms.findMany({
      where: eq(forms.createdBy, context.user.id),
      columns: { id: true },
    })

    const formIds = userForms.map((form) => form.id)
    if (formIds.length === 0) return []

    if (input.formId && !formIds.includes(input.formId)) {
      return []
    }

    const conditions = [
      inArray(leads.formId, formIds),
      ...(input.formId ? [eq(leads.formId, input.formId)] : []),
      ...(input.status ? [eq(leads.status, input.status)] : []),
    ]

    return db.query.leads.findMany({
      where: and(...conditions),
      orderBy: [desc(leads.createdAt)],
      limit: 200,
      with: {
        form: { columns: { id: true, title: true, slug: true } },
      },
    })
  })

export const updateLeadStatus = authedContext
  .input(
    z.object({
      id: z.string(),
      status: leadStatusSchema,
    }),
  )
  .handler(async ({ context, input }) => {
    const lead = await db.query.leads.findFirst({
      where: eq(leads.id, input.id),
      with: { form: true },
    })

    if (!lead || lead.form.createdBy !== context.user.id) {
      throw new ORPCError('NOT_FOUND', { message: 'Lead not found' })
    }

    const [updated] = await db
      .update(leads)
      .set({
        status: input.status,
        updatedAt: new Date(),
      })
      .where(eq(leads.id, input.id))
      .returning()

    return updated
  })
