import { ORPCError } from '@orpc/server'
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  ne,
  or,
  sql,
  type SQL,
} from 'drizzle-orm'
import { z } from 'zod'

import { db } from '#/db/index'
import {
  formDefinitionSnapshots,
  formSubmissions,
  forms,
  leads,
  type LeadInsightsJson,
} from '#/db/schema'
import { getCampaignById, listCampaigns } from '#/lib/campaigns'
import { resolveCampaignConfig, resolveCampaignForLead } from '#/lib/campaigns/settings'
import { leadStatusSchema } from '#/lib/form-types'
import {
  CONTACTED_LEAD_SLA_HOURS,
  escapeCsvCell,
  investorProfile,
  LEAD_LIST_SORTS,
  LEAD_UNASSIGNED,
  mergeLeadNotes,
  NEW_LEAD_SLA_HOURS,
  securitiesAccount,
} from '#/lib/lead-admin'
import { LEAD_STATUS_LABELS } from '#/lib/lead-status'
import { adviserLabel, formatLeadSource } from '#/lib/leads'
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

const leadListFiltersSchema = z.object({
  formId: z.string().optional(),
  status: leadStatusSchema.optional(),
  /** Filter by registry campaign id */
  campaignId: z.string().optional(),
  /** @deprecated Prefer campaignId — kept for older clients */
  campaignOnly: z.boolean().optional(),
  /** Agent id, or `__unassigned__` */
  assignee: z.string().max(64).optional(),
  /** Free-text search on name / email / phone */
  q: z.string().max(120).optional(),
  sort: z.enum(LEAD_LIST_SORTS).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(50),
  /** Only leads breaching SLA (new >24h or contacted >72h) */
  agedOnly: z.boolean().optional(),
})

async function resolveScopedFormIds(
  userId: string,
  input: {
    formId?: string
    campaignId?: string
    campaignOnly?: boolean
  },
): Promise<string[]> {
  const owned = await userForms(userId)
  const formIds = owned.map((form) => form.id)
  if (formIds.length === 0) return []

  if (input.formId && !formIds.includes(input.formId)) {
    return []
  }

  let scopedFormIds = formIds
  const campaignId =
    input.campaignId ?? (input.campaignOnly ? listCampaigns()[0]?.id : undefined)

  if (campaignId) {
    const campaignFormIds = formIdsForCampaign(owned, campaignId)
    if (campaignFormIds.length === 0) return []
    scopedFormIds = input.formId ? [input.formId] : campaignFormIds
  } else if (input.formId) {
    scopedFormIds = [input.formId]
  }

  return scopedFormIds
}

/** Per-campaign deadlines via campaign_settings, with global defaults as fallback. */
function buildAgedOnlyCondition(): SQL {
  const aged = or(
    and(
      eq(leads.status, 'new'),
      sql`${leads.createdAt} < NOW() - (
        COALESCE(
          (SELECT new_lead_deadline_hours FROM campaign_settings WHERE campaign_id = ${leads.campaignId}),
          ${NEW_LEAD_SLA_HOURS}
        ) * INTERVAL '1 hour'
      )`,
    ),
    and(
      eq(leads.status, 'contacted'),
      sql`${leads.updatedAt} < NOW() - (
        COALESCE(
          (SELECT contacted_lead_deadline_hours FROM campaign_settings WHERE campaign_id = ${leads.campaignId}),
          ${CONTACTED_LEAD_SLA_HOURS}
        ) * INTERVAL '1 hour'
      )`,
    ),
  )
  return aged!
}

function buildLeadConditions(
  scopedFormIds: string[],
  input: z.infer<typeof leadListFiltersSchema>,
): SQL[] {
  const conditions: SQL[] = [inArray(leads.formId, scopedFormIds)]

  if (input.status) {
    conditions.push(eq(leads.status, input.status))
  } else {
    // Default list hides archived leads; filter by status=archived to see them.
    conditions.push(ne(leads.status, 'archived'))
  }

  if (input.assignee === LEAD_UNASSIGNED) {
    conditions.push(isNull(leads.assignee))
  } else if (input.assignee) {
    conditions.push(eq(leads.assignee, input.assignee))
  }

  const q = input.q?.trim()
  if (q) {
    const pattern = `%${q.replace(/[%_]/g, '')}%`
    const search = or(
      ilike(leads.name, pattern),
      ilike(leads.email, pattern),
      ilike(leads.phone, pattern),
    )
    if (search) conditions.push(search)
  }

  if (input.agedOnly) {
    conditions.push(buildAgedOnlyCondition())
  }

  return conditions
}

function leadOrderBy(sort: z.infer<typeof leadListFiltersSchema>['sort']) {
  switch (sort) {
    case 'created_asc':
      return [asc(leads.createdAt)]
    case 'updated_desc':
      return [desc(leads.updatedAt)]
    case 'updated_asc':
      return [asc(leads.updatedAt)]
    case 'created_desc':
    default:
      return [desc(leads.createdAt)]
  }
}

const leadWithForm = {
  form: { columns: { id: true, title: true, slug: true, campaignId: true } },
} as const

export const listLeads = authedContext
  .input(leadListFiltersSchema)
  .handler(async ({ context, input }) => {
    const scopedFormIds = await resolveScopedFormIds(context.user.id, input)
    if (scopedFormIds.length === 0) {
      return {
        items: [],
        total: 0,
        page: input.page,
        pageSize: input.pageSize,
        hasMore: false,
      }
    }

    const conditions = buildLeadConditions(scopedFormIds, input)
    const where = and(...conditions)
    const offset = (input.page - 1) * input.pageSize

    const [totalRow] = await db.select({ value: count() }).from(leads).where(where)
    const total = totalRow?.value ?? 0

    const items = await db.query.leads.findMany({
      where,
      orderBy: leadOrderBy(input.sort),
      limit: input.pageSize,
      offset,
      with: leadWithForm,
    })

    return {
      items,
      total,
      page: input.page,
      pageSize: input.pageSize,
      hasMore: offset + items.length < total,
    }
  })

export const getLead = authedContext
  .input(z.object({ id: z.string() }))
  .handler(async ({ context, input }) => {
    const lead = await db.query.leads.findFirst({
      where: eq(leads.id, input.id),
      with: {
        form: {
          columns: {
            id: true,
            title: true,
            slug: true,
            campaignId: true,
            createdBy: true,
            definition: true,
            version: true,
          },
        },
        submission: {
          columns: {
            id: true,
            answers: true,
            formVersion: true,
            createdAt: true,
            metadata: true,
          },
        },
      },
    })

    if (!lead || lead.form.createdBy !== context.user.id) {
      throw new ORPCError('NOT_FOUND', { message: 'Lead not found' })
    }

    const snapshot = await db.query.formDefinitionSnapshots.findFirst({
      where: and(
        eq(formDefinitionSnapshots.formId, lead.formId),
        eq(formDefinitionSnapshots.version, lead.submission.formVersion),
      ),
    })

    const definition = snapshot?.definition ?? lead.form.definition
    const fields = definition.pages.flatMap((page) =>
      page.fields.map((field) => ({
        id: field.id,
        label: field.label,
        type: field.type,
        leadRole: field.leadRole,
        pageTitle: page.title,
      })),
    )

    const { createdBy: _createdBy, definition: _definition, ...formPublic } = lead.form

    return {
      ...lead,
      form: formPublic,
      fields,
      answers: lead.submission.answers as Record<string, string>,
    }
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
      input.campaignId ?? (input.campaignOnly ? listCampaigns()[0]?.id : undefined)

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
        unassigned: 0,
        aged: 0,
        archived: 0,
      }
    }

    const activeScope = and(inArray(leads.formId, formIds), ne(leads.status, 'archived'))

    const rows = await db
      .select({
        status: leads.status,
        intent: leads.intent,
        utmSource: leads.utmSource,
        count: sql<number>`count(*)::int`,
      })
      .from(leads)
      .where(activeScope)
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

    const [unassignedRow] = await db
      .select({ value: count() })
      .from(leads)
      .where(and(activeScope, isNull(leads.assignee)))

    const agedWhere = and(activeScope, buildAgedOnlyCondition())
    const [agedRow] = await db.select({ value: count() }).from(leads).where(agedWhere)
    const [archivedRow] = await db
      .select({ value: count() })
      .from(leads)
      .where(and(inArray(leads.formId, formIds), eq(leads.status, 'archived')))

    return {
      total,
      byStatus,
      byIntent,
      bySource,
      conversionRate,
      converted,
      subscribed: converted,
      unassigned: unassignedRow?.value ?? 0,
      aged: agedRow?.value ?? 0,
      archived: archivedRow?.value ?? 0,
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

export const deleteLead = authedContext
  .input(z.object({ id: z.string() }))
  .handler(async ({ context, input }) => {
    const lead = await db.query.leads.findFirst({
      where: eq(leads.id, input.id),
      with: { form: true },
    })

    if (!lead || lead.form.createdBy !== context.user.id) {
      throw new ORPCError('NOT_FOUND', { message: 'Lead not found' })
    }

    // Deleting the submission cascades to the lead (FK onDelete cascade).
    await db.delete(formSubmissions).where(eq(formSubmissions.id, lead.submissionId))

    return { ok: true as const, id: input.id }
  })

export const updateLeadNotes = authedContext
  .input(
    z.object({
      id: z.string(),
      notes: z.string().max(4000),
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

    const insights = mergeLeadNotes(
      lead.insights as LeadInsightsJson | null,
      input.notes,
    ) as LeadInsightsJson

    const [updated] = await db
      .update(leads)
      .set({
        insights,
        updatedAt: new Date(),
      })
      .where(eq(leads.id, input.id))
      .returning()

    return updated
  })

const bulkLeadIdsSchema = z
  .array(z.string().min(1).max(64))
  .min(1)
  .max(100)

async function ownedLeadsByIds(userId: string, ids: string[]) {
  const unique = [...new Set(ids)]
  const rows = await db.query.leads.findMany({
    where: inArray(leads.id, unique),
    with: {
      form: {
        columns: {
          id: true,
          createdBy: true,
          slug: true,
          campaignId: true,
          title: true,
        },
      },
    },
  })
  return rows.filter((row) => row.form.createdBy === userId)
}

export const bulkUpdateLeadStatus = authedContext
  .input(
    z.object({
      ids: bulkLeadIdsSchema,
      status: leadStatusSchema,
    }),
  )
  .handler(async ({ context, input }) => {
    const owned = await ownedLeadsByIds(context.user.id, input.ids)
    if (owned.length === 0) {
      return { updated: 0, skipped: input.ids.length }
    }

    const ownedIds = owned.map((row) => row.id)
    await db
      .update(leads)
      .set({
        status: input.status,
        updatedAt: new Date(),
      })
      .where(inArray(leads.id, ownedIds))

    return {
      updated: ownedIds.length,
      skipped: Math.max(0, new Set(input.ids).size - ownedIds.length),
    }
  })

export const bulkDeleteLeads = authedContext
  .input(z.object({ ids: bulkLeadIdsSchema }))
  .handler(async ({ context, input }) => {
    const owned = await ownedLeadsByIds(context.user.id, input.ids)
    if (owned.length === 0) {
      return { deleted: 0, skipped: input.ids.length }
    }

    const submissionIds = owned.map((row) => row.submissionId)
    // Deleting submissions cascades to their leads.
    await db.delete(formSubmissions).where(inArray(formSubmissions.id, submissionIds))

    return {
      deleted: submissionIds.length,
      skipped: Math.max(0, new Set(input.ids).size - submissionIds.length),
    }
  })

export const bulkUpdateLeadAssignee = authedContext
  .input(
    z.object({
      ids: bulkLeadIdsSchema,
      /** Empty string clears assignee */
      assignee: z.string().max(64),
    }),
  )
  .handler(async ({ context, input }) => {
    const owned = await ownedLeadsByIds(context.user.id, input.ids)
    if (owned.length === 0) {
      return { updated: 0, skipped: input.ids.length }
    }

    const eligibleIds: string[] = []
    let skipped = Math.max(0, new Set(input.ids).size - owned.length)

    if (!input.assignee) {
      eligibleIds.push(...owned.map((row) => row.id))
    } else {
      const allowedByKey = new Map<string, Set<string>>()
      for (const lead of owned) {
        const campaignId = lead.campaignId ?? lead.form.campaignId ?? ''
        const formSlug = lead.form.slug
        const cacheKey = `${campaignId}::${formSlug}`
        let allowed = allowedByKey.get(cacheKey)
        if (!allowed) {
          const campaign = await resolveCampaignForLead({
            campaignId: campaignId || null,
            formSlug,
          })
          allowed = new Set(campaign?.agents.map((a) => a.id) ?? [])
          allowedByKey.set(cacheKey, allowed)
        }
        if (allowed.has(input.assignee)) {
          eligibleIds.push(lead.id)
        } else {
          skipped += 1
        }
      }
    }

    if (eligibleIds.length > 0) {
      await db
        .update(leads)
        .set({
          assignee: input.assignee || null,
          updatedAt: new Date(),
        })
        .where(inArray(leads.id, eligibleIds))
    }

    return { updated: eligibleIds.length, skipped }
  })

const CSV_HEADER = [
  'lead_id',
  'created_at',
  'updated_at',
  'status',
  'name',
  'email',
  'phone',
  'amount_range',
  'preferred_channel',
  'investor_profile',
  'securities_account',
  'city',
  'company',
  'assignee',
  'intent',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'form_title',
  'form_slug',
  'campaign_id',
  'notes',
] as const

function leadToCsvLine(row: {
  id: string
  createdAt: Date
  updatedAt: Date
  status: string
  name: string | null
  email: string | null
  phone: string | null
  amountRange: string | null
  preferredChannel: string | null
  assignee: string | null
  intent: string | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  campaignId: string | null
  insights: LeadInsightsJson | null
  form?: {
    title?: string | null
    slug?: string | null
    campaignId?: string | null
  } | null
}) {
  const insights = row.insights
  const campaign = getCampaignById(row.campaignId ?? row.form?.campaignId ?? '')
  return [
    escapeCsvCell(row.id),
    escapeCsvCell(row.createdAt.toISOString()),
    escapeCsvCell(row.updatedAt.toISOString()),
    escapeCsvCell(LEAD_STATUS_LABELS[row.status as keyof typeof LEAD_STATUS_LABELS] ?? row.status),
    escapeCsvCell(row.name ?? ''),
    escapeCsvCell(row.email ?? ''),
    escapeCsvCell(row.phone ?? ''),
    escapeCsvCell(row.amountRange ?? ''),
    escapeCsvCell(row.preferredChannel ?? ''),
    escapeCsvCell(investorProfile(insights) ?? ''),
    escapeCsvCell(securitiesAccount(insights) ?? ''),
    escapeCsvCell(insights?.city ?? ''),
    escapeCsvCell(insights?.company ?? ''),
    escapeCsvCell(
      adviserLabel(row.assignee, {
        campaignId: row.campaignId ?? row.form?.campaignId,
        formSlug: row.form?.slug ?? undefined,
      }),
    ),
    escapeCsvCell(row.intent ?? ''),
    escapeCsvCell(formatLeadSource(row.utmSource, campaign)),
    escapeCsvCell(row.utmMedium ?? ''),
    escapeCsvCell(row.utmCampaign ?? ''),
    escapeCsvCell(row.form?.title ?? ''),
    escapeCsvCell(row.form?.slug ?? ''),
    escapeCsvCell(row.campaignId ?? row.form?.campaignId ?? ''),
    escapeCsvCell(insights?.notes ?? ''),
  ].join(',')
}

export const exportLeadsCsv = authedContext
  .input(
    leadListFiltersSchema.omit({ page: true, pageSize: true }).extend({
      /** Soft cap to avoid huge payloads */
      limit: z.number().int().min(1).max(5000).default(2000),
      /** When set, export only these owned leads (ignores list filters) */
      ids: z.array(z.string().min(1).max(64)).min(1).max(100).optional(),
    }),
  )
  .handler(async ({ context, input }) => {
    let rows: Array<{
      id: string
      createdAt: Date
      updatedAt: Date
      status: string
      name: string | null
      email: string | null
      phone: string | null
      amountRange: string | null
      preferredChannel: string | null
      assignee: string | null
      intent: string | null
      utmSource: string | null
      utmMedium: string | null
      utmCampaign: string | null
      campaignId: string | null
      insights: LeadInsightsJson | null
      form?: {
        title?: string | null
        slug?: string | null
        campaignId?: string | null
      } | null
    }>

    if (input.ids?.length) {
      const owned = await ownedLeadsByIds(context.user.id, input.ids)
      rows = owned.map((row) => ({
        ...row,
        insights: row.insights as LeadInsightsJson | null,
      }))
    } else {
      const scopedFormIds = await resolveScopedFormIds(context.user.id, input)
      if (scopedFormIds.length === 0) {
        return { csv: '', count: 0 }
      }

      const conditions = buildLeadConditions(scopedFormIds, {
        ...input,
        page: 1,
        pageSize: input.limit,
      })

      rows = await db.query.leads.findMany({
        where: and(...conditions),
        orderBy: leadOrderBy(input.sort),
        limit: input.limit,
        with: leadWithForm,
      })
    }

    const lines = rows.map((row) =>
      leadToCsvLine({
        ...row,
        insights: row.insights as LeadInsightsJson | null,
      }),
    )

    return {
      csv: [CSV_HEADER.map(escapeCsvCell).join(','), ...lines].join('\n'),
      count: rows.length,
    }
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
      return { amountBuckets: {}, channels: {}, agents: {}, unassigned: 0, profiles: {}, accounts: {} }
    }

    const rows = await db.query.leads.findMany({
      where: and(inArray(leads.formId, formIds), ne(leads.status, 'archived')),
      columns: {
        amountRange: true,
        preferredChannel: true,
        assignee: true,
        insights: true,
      },
      limit: 2000,
    })

    const amountBuckets: Record<string, number> = {}
    const channels: Record<string, number> = {}
    const agents: Record<string, number> = {}
    const profiles: Record<string, number> = {}
    const accounts: Record<string, number> = {}
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
      const insights = row.insights as LeadInsightsJson | null
      const profile = investorProfile(insights)
      const account = securitiesAccount(insights)
      if (profile) profiles[profile] = (profiles[profile] ?? 0) + 1
      if (account) accounts[account] = (accounts[account] ?? 0) + 1
    }

    return { amountBuckets, channels, agents, unassigned, profiles, accounts }
  })
