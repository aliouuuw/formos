import { ORPCError } from '@orpc/server'
import { and, desc, eq } from 'drizzle-orm'
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

    const rows = await db.query.leads.findMany({
      where: input.formId
        ? and(eq(leads.formId, input.formId))
        : undefined,
      orderBy: [desc(leads.createdAt)],
      limit: 200,
      with: {
        form: { columns: { id: true, title: true, slug: true } },
      },
    })

    return rows.filter((row) => {
      return (
        formIds.includes(row.formId) &&
        (!input.status || row.status === input.status)
      )
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
