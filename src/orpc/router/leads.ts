import { ORPCError } from '@orpc/server'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '#/db/index'
import { forms, leads } from '#/db/schema'
import { leadStatusSchema } from '#/lib/form-types'
import { IPO_FORM_SLUGS } from '#/lib/ipo-campaign'
import { authedContext } from '#/orpc/context'

const IPO_SLUGS = [IPO_FORM_SLUGS.subscribe, IPO_FORM_SLUGS.infos] as const

async function userFormIds(userId: string) {
  const userForms = await db.query.forms.findMany({
    where: eq(forms.createdBy, userId),
    columns: { id: true, slug: true },
  })
  return userForms
}

export const listLeads = authedContext
  .input(
    z.object({
      formId: z.string().optional(),
      status: leadStatusSchema.optional(),
      campaignOnly: z.boolean().optional(),
    }),
  )
  .handler(async ({ context, input }) => {
    const userForms = await userFormIds(context.user.id)
    const formIds = userForms.map((form) => form.id)
    if (formIds.length === 0) return []

    if (input.formId && !formIds.includes(input.formId)) {
      return []
    }

    let scopedFormIds = formIds
    if (input.campaignOnly) {
      const ipoIds = userForms
        .filter((f) => (IPO_SLUGS as readonly string[]).includes(f.slug))
        .map((f) => f.id)
      if (ipoIds.length === 0) return []
      scopedFormIds = input.formId ? [input.formId] : ipoIds
    } else if (input.formId) {
      scopedFormIds = [input.formId]
    }

    const conditions = [
      inArray(leads.formId, scopedFormIds),
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

export const getLeadStats = authedContext
  .input(z.object({ campaignOnly: z.boolean().optional() }))
  .handler(async ({ context, input }) => {
    const userForms = await userFormIds(context.user.id)
    let formIds = userForms.map((f) => f.id)

    if (input.campaignOnly) {
      formIds = userForms
        .filter((f) => (IPO_SLUGS as readonly string[]).includes(f.slug))
        .map((f) => f.id)
    }

    if (formIds.length === 0) {
      return {
        total: 0,
        byStatus: {} as Record<string, number>,
        conversionRate: 0,
        subscribed: 0,
      }
    }

    const rows = await db
      .select({
        status: leads.status,
        count: sql<number>`count(*)::int`,
      })
      .from(leads)
      .where(inArray(leads.formId, formIds))
      .groupBy(leads.status)

    const byStatus: Record<string, number> = {}
    let total = 0
    for (const row of rows) {
      byStatus[row.status] = row.count
      total += row.count
    }

    const subscribed = (byStatus.souscrit ?? 0) + (byStatus.won ?? 0)
    const conversionRate = total > 0 ? Math.round((subscribed / total) * 1000) / 10 : 0

    return { total, byStatus, conversionRate, subscribed }
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

export const updateLeadAssignee = authedContext
  .input(
    z.object({
      id: z.string(),
      assignee: z.string().max(64),
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
        assignee: input.assignee || null,
        updatedAt: new Date(),
      })
      .where(eq(leads.id, input.id))
      .returning()

    return updated
  })
