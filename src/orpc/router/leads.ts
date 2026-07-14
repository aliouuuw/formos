import { ORPCError } from '@orpc/server'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '#/db/index'
import { forms, leads } from '#/db/schema'
import { getCampaignById, listCampaigns } from '#/lib/campaigns'
import { resolveCampaignConfig, resolveCampaignForLead } from '#/lib/campaigns/settings'
import { leadStatusSchema } from '#/lib/form-types'
import { authedContext } from '#/orpc/context'

async function userForms(userId: string) {
  return db.query.forms.findMany({
    where: eq(forms.createdBy, userId),
    columns: { id: true, slug: true, campaignId: true },
  })
}

function formIdsForCampaign(
  userFormRows: Array<{ id: string; slug: string; campaignId: string | null }>,
  campaignId: string,
) {
  const campaign = getCampaignById(campaignId)
  const slugs = new Set(campaign?.forms.map((f) => f.slug) ?? [])
  return userFormRows
    .filter((f) => f.campaignId === campaignId || slugs.has(f.slug))
    .map((f) => f.id)
}

export const listLeads = authedContext
  .input(
    z.object({
      formId: z.string().optional(),
      status: leadStatusSchema.optional(),
      /** Filter by registry campaign id */
      campaignId: z.string().optional(),
      /** @deprecated Prefer campaignId — kept for older clients */
      campaignOnly: z.boolean().optional(),
    }),
  )
  .handler(async ({ context, input }) => {
    const owned = await userForms(context.user.id)
    const formIds = owned.map((form) => form.id)
    if (formIds.length === 0) return []

    if (input.formId && !formIds.includes(input.formId)) {
      return []
    }

    let scopedFormIds = formIds
    const campaignId =
      input.campaignId ??
      (input.campaignOnly ? listCampaigns()[0]?.id : undefined)

    if (campaignId) {
      const campaignFormIds = formIdsForCampaign(owned, campaignId)
      if (campaignFormIds.length === 0) return []
      scopedFormIds = input.formId ? [input.formId] : campaignFormIds
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
        form: { columns: { id: true, title: true, slug: true, campaignId: true } },
      },
    })
  })

export const getLeadStats = authedContext
  .input(
    z.object({
      campaignId: z.string().optional(),
      campaignOnly: z.boolean().optional(),
    }),
  )
  .handler(async ({ context, input }) => {
    const owned = await userForms(context.user.id)
    let formIds = owned.map((f) => f.id)

    const campaignId =
      input.campaignId ??
      (input.campaignOnly ? listCampaigns()[0]?.id : undefined)

    const campaign = campaignId ? await resolveCampaignConfig(campaignId) : undefined

    if (campaignId) {
      formIds = formIdsForCampaign(owned, campaignId)
    }

    if (formIds.length === 0) {
      return {
        total: 0,
        byStatus: {} as Record<string, number>,
        byIntent: {} as Record<string, number>,
        bySource: {} as Record<string, number>,
        conversionRate: 0,
        converted: 0,
        subscribed: 0,
      }
    }

    const rows = await db
      .select({
        status: leads.status,
        intent: leads.intent,
        utmSource: leads.utmSource,
        count: sql<number>`count(*)::int`,
      })
      .from(leads)
      .where(inArray(leads.formId, formIds))
      .groupBy(leads.status, leads.intent, leads.utmSource)

    const byStatus: Record<string, number> = {}
    const byIntent: Record<string, number> = {}
    const bySource: Record<string, number> = {}
    let total = 0

    for (const row of rows) {
      byStatus[row.status] = (byStatus[row.status] ?? 0) + row.count
      if (row.intent) byIntent[row.intent] = (byIntent[row.intent] ?? 0) + row.count
      const sourceKey = row.utmSource || 'direct'
      bySource[sourceKey] = (bySource[sourceKey] ?? 0) + row.count
      total += row.count
    }

    const conversionStatuses = campaign?.conversionStatuses ?? (['souscrit', 'won'] as const)
    let converted = 0
    for (const status of conversionStatuses) {
      converted += byStatus[status] ?? 0
    }
    const conversionRate = total > 0 ? Math.round((converted / total) * 1000) / 10 : 0

    return {
      total,
      byStatus,
      byIntent,
      bySource,
      conversionRate,
      converted,
      subscribed: converted,
    }
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

    const campaign = await resolveCampaignForLead({
      campaignId: lead.campaignId ?? lead.form.campaignId,
      formSlug: lead.form.slug,
    })

    if (input.assignee && campaign) {
      const allowed = new Set(campaign.agents.map((a) => a.id))
      if (!allowed.has(input.assignee)) {
        throw new ORPCError('BAD_REQUEST', {
          message: 'Assignee is not a configured agent for this campaign',
        })
      }
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

export const getLeadInsightsSummary = authedContext
  .input(z.object({ campaignId: z.string().optional() }))
  .handler(async ({ context, input }) => {
    const owned = await userForms(context.user.id)
    let formIds = owned.map((f) => f.id)
    if (input.campaignId) {
      formIds = formIdsForCampaign(owned, input.campaignId)
    }
    if (formIds.length === 0) {
      return { amountBuckets: {}, channels: {}, agents: {}, unassigned: 0 }
    }

    const rows = await db.query.leads.findMany({
      where: inArray(leads.formId, formIds),
      columns: {
        amountRange: true,
        preferredChannel: true,
        assignee: true,
      },
      limit: 2000,
    })

    const amountBuckets: Record<string, number> = {}
    const channels: Record<string, number> = {}
    const agents: Record<string, number> = {}
    let unassigned = 0

    for (const row of rows) {
      if (row.amountRange) {
        amountBuckets[row.amountRange] = (amountBuckets[row.amountRange] ?? 0) + 1
      }
      if (row.preferredChannel) {
        channels[row.preferredChannel] = (channels[row.preferredChannel] ?? 0) + 1
      }
      if (row.assignee) {
        agents[row.assignee] = (agents[row.assignee] ?? 0) + 1
      } else {
        unassigned += 1
      }
    }

    return { amountBuckets, channels, agents, unassigned }
  })
