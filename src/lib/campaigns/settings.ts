import { eq } from 'drizzle-orm'

import { db } from '#/db/index'
import { campaignSettings } from '#/db/schema'
import { getCampaignById, getCampaignByFormSlug, listCampaigns } from '#/lib/campaigns'
import { parseAgentNames, slugifyAgent } from '#/lib/campaigns/agents'
import { BRIDGE_BANK_IPO_CAMPAIGN_ID } from '#/lib/campaigns/bridge-bank-ipo'
import { DEFAULT_CAMPAIGN_AGENTS } from '#/lib/campaigns/settings-types'
import type { CampaignAgent, CampaignConfig } from '#/lib/campaigns/types'
import {
  resolveLeadDeadlines,
} from '#/lib/lead-admin'

function defaultAgentsFor(campaignId: string): CampaignAgent[] {
  const base = getCampaignById(campaignId)
  return base?.agents.length ? base.agents : DEFAULT_CAMPAIGN_AGENTS
}

function envWhatsappFor(campaignId: string): string | null {
  if (campaignId !== BRIDGE_BANK_IPO_CAMPAIGN_ID) return null
  const raw =
    process.env.CAMPAIGN_WHATSAPP_BRIDGE_BANK_IPO ?? process.env.VITE_IPO_WHATSAPP_NUMBER
  const digits = raw?.replace(/\D/g, '').trim()
  return digits || null
}

function defaultWhatsappFor(campaignId: string): string | null {
  return getCampaignById(campaignId)?.whatsappNumber ?? envWhatsappFor(campaignId)
}

export async function getStoredCampaignSettings(campaignId: string) {
  return db.query.campaignSettings.findFirst({
    where: eq(campaignSettings.campaignId, campaignId),
  })
}

export async function resolveCampaignConfig(campaignId: string): Promise<CampaignConfig | undefined> {
  const base = getCampaignById(campaignId)
  if (!base) return undefined

  const stored = await getStoredCampaignSettings(campaignId)
  const agents =
    stored && stored.agents.length > 0 ? stored.agents : defaultAgentsFor(campaignId)
  const whatsappNumber = stored?.whatsappNumber ?? defaultWhatsappFor(campaignId) ?? undefined
  const deadlines = resolveLeadDeadlines(stored)

  return {
    ...base,
    agents,
    whatsappNumber: whatsappNumber ?? undefined,
    newLeadDeadlineHours: deadlines.newLeadHours,
    contactedLeadDeadlineHours: deadlines.contactedLeadHours,
  }
}

export async function listResolvedCampaigns(): Promise<CampaignConfig[]> {
  const campaigns = listCampaigns()
  return Promise.all(
    campaigns.map(async (c) => (await resolveCampaignConfig(c.id)) ?? c),
  )
}

export async function resolveCampaignForLead(input: {
  campaignId?: string | null
  formSlug?: string | null
}) {
  if (input.campaignId) return resolveCampaignConfig(input.campaignId)
  if (input.formSlug) {
    const campaign = getCampaignByFormSlug(input.formSlug)
    if (campaign) return resolveCampaignConfig(campaign.id)
  }
  return undefined
}

export function normalizeAgentInput(names: string[]): CampaignAgent[] {
  return parseAgentNames(names.join(','), [])
}

export function normalizeAgentsFromLabels(labels: string[]): CampaignAgent[] {
  const cleaned = labels.map((l) => l.trim()).filter(Boolean)
  return cleaned.map((label) => ({
    id: slugifyAgent(label),
    label,
  }))
}

export async function saveCampaignSettings(input: {
  campaignId: string
  agents: CampaignAgent[]
  whatsappNumber: string | null
  newLeadDeadlineHours: number
  contactedLeadDeadlineHours: number
  updatedBy: string
}) {
  const base = getCampaignById(input.campaignId)
  if (!base) throw new Error('Campaign not found')

  const agents = input.agents.filter((a) => a.label.trim())
  const whatsapp = input.whatsappNumber?.trim() || null
  const newLeadDeadlineHours = input.newLeadDeadlineHours
  const contactedLeadDeadlineHours = input.contactedLeadDeadlineHours

  const existing = await getStoredCampaignSettings(input.campaignId)
  if (existing) {
    await db
      .update(campaignSettings)
      .set({
        agents,
        whatsappNumber: whatsapp,
        newLeadDeadlineHours,
        contactedLeadDeadlineHours,
        updatedAt: new Date(),
        updatedBy: input.updatedBy,
      })
      .where(eq(campaignSettings.campaignId, input.campaignId))
  } else {
    await db.insert(campaignSettings).values({
      campaignId: input.campaignId,
      agents,
      whatsappNumber: whatsapp,
      newLeadDeadlineHours,
      contactedLeadDeadlineHours,
      updatedBy: input.updatedBy,
    })
  }

  return resolveCampaignConfig(input.campaignId)
}

export function campaignWhatsAppUrl(number: string | undefined, prefill?: string) {
  if (!number) return null
  const text =
    prefill ??
    "Bonjour, je souhaite recevoir des informations sur l'IPO Bridge Bank via Everest Finance."
  return `https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`
}

/** Seed DB settings from env on first deploy (optional). */
export async function seedCampaignSettingsFromEnv() {
  const existing = await getStoredCampaignSettings(BRIDGE_BANK_IPO_CAMPAIGN_ID)

  const envAgents =
    process.env.CAMPAIGN_AGENTS_BRIDGE_BANK_IPO ??
    process.env.VITE_IPO_ADVISERS ??
    process.env.VITE_CAMPAIGN_AGENTS_bridge_bank_ipo
  const envWhatsapp =
    process.env.CAMPAIGN_WHATSAPP_BRIDGE_BANK_IPO ?? process.env.VITE_IPO_WHATSAPP_NUMBER
  const whatsappDigits = envWhatsapp?.replace(/\D/g, '').trim() || null

  if (!envAgents && !whatsappDigits) return

  if (existing) {
    const shouldFillWhatsapp = !existing.whatsappNumber && whatsappDigits
    const shouldFillAgents = existing.agents.length === 0 && Boolean(envAgents)
    if (!shouldFillWhatsapp && !shouldFillAgents) return

    await db
      .update(campaignSettings)
      .set({
        ...(shouldFillWhatsapp ? { whatsappNumber: whatsappDigits } : {}),
        ...(shouldFillAgents
          ? { agents: normalizeAgentsFromLabels(envAgents!.split(',')) }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(campaignSettings.campaignId, BRIDGE_BANK_IPO_CAMPAIGN_ID))
    return
  }

  await db.insert(campaignSettings).values({
    campaignId: BRIDGE_BANK_IPO_CAMPAIGN_ID,
    agents: envAgents
      ? normalizeAgentsFromLabels(envAgents.split(','))
      : defaultAgentsFor(BRIDGE_BANK_IPO_CAMPAIGN_ID),
    whatsappNumber: whatsappDigits,
  })
}
