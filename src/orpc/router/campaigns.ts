import { ORPCError } from '@orpc/server'
import { z } from 'zod'

import {
  agentOptions,
  getCampaignById,
  listCampaigns,
} from '#/lib/campaigns'
import {
  campaignWhatsAppUrl,
  getStoredCampaignSettings,
  listResolvedCampaigns,
  normalizeAgentsFromLabels,
  resolveCampaignConfig,
  saveCampaignSettings,
} from '#/lib/campaigns/settings'
import { resolveLeadDeadlines } from '#/lib/lead-admin'
import { authedContext, publicContext } from '#/orpc/context'

const agentSchema = z.object({
  id: z.string().max(64),
  label: z.string().min(1).max(120),
})

const deadlineHoursSchema = z.number().int().min(1).max(720)

const settingsInputSchema = z.object({
  campaignId: z.string().min(1),
  agents: z.array(agentSchema).max(50),
  whatsappNumber: z
    .string()
    .max(20)
    .regex(/^\d*$/, 'Numéro WhatsApp : chiffres uniquement (E.164 sans +)')
    .nullable()
    .optional(),
  newLeadDeadlineHours: deadlineHoursSchema.optional(),
  contactedLeadDeadlineHours: deadlineHoursSchema.optional(),
})

function toApiCampaign(campaign: NonNullable<Awaited<ReturnType<typeof resolveCampaignConfig>>>) {
  return {
    id: campaign.id,
    name: campaign.name,
    shortName: campaign.shortName,
    description: campaign.description,
    landingPath: campaign.landingPath,
    utmCampaign: campaign.utmCampaign,
    forms: campaign.forms,
    agents: campaign.agents,
    agentOptions: agentOptions(campaign.agents),
    conversionStatuses: campaign.conversionStatuses,
    sourceLabels: campaign.sourceLabels,
    whatsappNumber: campaign.whatsappNumber ?? null,
    whatsappConfigured: Boolean(campaign.whatsappNumber),
    whatsappUrl: campaignWhatsAppUrl(campaign.whatsappNumber),
    newLeadDeadlineHours: campaign.newLeadDeadlineHours,
    contactedLeadDeadlineHours: campaign.contactedLeadDeadlineHours,
  }
}

export const listCampaignConfigs = authedContext.handler(async () => {
  const campaigns = await listResolvedCampaigns()
  return campaigns.map(toApiCampaign)
})

export const getCampaignConfig = authedContext
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    const campaign = await resolveCampaignConfig(input.id)
    if (!campaign) {
      throw new ORPCError('NOT_FOUND', { message: 'Campaign not found' })
    }
    return toApiCampaign(campaign)
  })

export const getCampaignSettings = authedContext
  .input(z.object({ campaignId: z.string() }))
  .handler(async ({ input }) => {
    const base = getCampaignById(input.campaignId)
    if (!base) throw new ORPCError('NOT_FOUND', { message: 'Campaign not found' })

    const resolved = await resolveCampaignConfig(input.campaignId)
    const stored = await getStoredCampaignSettings(input.campaignId)
    const deadlines = resolveLeadDeadlines(stored)

    return {
      campaignId: input.campaignId,
      campaignName: base.name,
      agents: resolved?.agents ?? [],
      whatsappNumber: resolved?.whatsappNumber ?? '',
      newLeadDeadlineHours: deadlines.newLeadHours,
      contactedLeadDeadlineHours: deadlines.contactedLeadHours,
      updatedAt: stored?.updatedAt ?? null,
      hasCustomSettings: Boolean(stored),
    }
  })

export const updateCampaignSettings = authedContext
  .input(settingsInputSchema)
  .handler(async ({ context, input }) => {
    const base = getCampaignById(input.campaignId)
    if (!base) throw new ORPCError('NOT_FOUND', { message: 'Campaign not found' })

    const agents =
      input.agents.length > 0
        ? input.agents.map((a) => ({
            id: a.id.trim() || normalizeAgentsFromLabels([a.label])[0]!.id,
            label: a.label.trim(),
          }))
        : normalizeAgentsFromLabels([])

    const stored = await getStoredCampaignSettings(input.campaignId)
    const currentDeadlines = resolveLeadDeadlines(stored)

    const campaign = await saveCampaignSettings({
      campaignId: input.campaignId,
      agents,
      whatsappNumber: input.whatsappNumber ?? null,
      newLeadDeadlineHours: input.newLeadDeadlineHours ?? currentDeadlines.newLeadHours,
      contactedLeadDeadlineHours:
        input.contactedLeadDeadlineHours ?? currentDeadlines.contactedLeadHours,
      updatedBy: context.user.id,
    })

    if (!campaign) throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Save failed' })
    return toApiCampaign(campaign)
  })

/** Public contact info for landing pages & forms (no auth). */
export const getPublicContact = publicContext
  .input(z.object({ campaignId: z.string() }))
  .handler(async ({ input }) => {
    const campaign = await resolveCampaignConfig(input.campaignId)
    if (!campaign) {
      throw new ORPCError('NOT_FOUND', { message: 'Campaign not found' })
    }

    return {
      campaignId: campaign.id,
      whatsappNumber: campaign.whatsappNumber ?? null,
      whatsappUrl: campaignWhatsAppUrl(campaign.whatsappNumber),
    }
  })

export const listCampaignIds = authedContext.handler(async () => {
  return listCampaigns().map((c) => ({
    id: c.id,
    name: c.name,
    shortName: c.shortName,
  }))
})
