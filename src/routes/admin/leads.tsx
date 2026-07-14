import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { EmptyState } from '#/components/empty-state'
import { PageHeader } from '#/components/page-header'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Panel, PanelBody } from '#/components/ui/panel'
import type { LeadStatus } from '#/lib/form-types'
import { getCampaignById, listCampaigns } from '#/lib/campaigns'
import { adviserLabel, formatLeadSource } from '#/lib/leads'
import {
  LEAD_PIPELINE_STATUSES,
  LEAD_STATUS_LABELS,
  LEAD_STATUS_VARIANT,
} from '#/lib/lead-status'
import { cn } from '#/lib/utils'
import { orpc } from '#/orpc/client'

export const Route = createFileRoute('/admin/leads')({ component: LeadsPage })

function leadStatusLabel(status: string): string {
  return LEAD_STATUS_LABELS[status as LeadStatus] ?? status
}

function leadStatusVariant(status: string) {
  return LEAD_STATUS_VARIANT[status as LeadStatus] ?? 'outline'
}

function LeadsPage() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<LeadStatus | 'all'>('all')
  const defaultCampaignId = listCampaigns()[0]?.id
  const [campaignId, setCampaignId] = useState<string | 'all'>(defaultCampaignId ?? 'all')

  const campaignsQuery = useQuery(orpc.campaigns.list.queryOptions({ input: undefined }))

  const listInput = useMemo(
    () => ({
      campaignId: campaignId === 'all' ? undefined : campaignId,
    }),
    [campaignId],
  )

  const leadsQuery = useQuery(orpc.leads.list.queryOptions({ input: listInput }))
  const statsQuery = useQuery(orpc.leads.stats.queryOptions({ input: listInput }))
  const insightsQuery = useQuery(
    orpc.leads.insights.queryOptions({
      input: { campaignId: campaignId === 'all' ? undefined : campaignId },
    }),
  )

  const selectedCampaign =
    campaignId === 'all' ? undefined : getCampaignById(campaignId) ?? campaignsQuery.data?.find((c) => c.id === campaignId)

  const agentOptions = useMemo(() => {
    if (selectedCampaign && 'agentOptions' in selectedCampaign && selectedCampaign.agentOptions) {
      return selectedCampaign.agentOptions
    }
    if (selectedCampaign && 'agents' in selectedCampaign) {
      return [
        { value: '', label: 'Non assigné' },
        ...selectedCampaign.agents.map((a: { id: string; label: string }) => ({
          value: a.id,
          label: a.label,
        })),
      ]
    }
    const fromApi = campaignsQuery.data?.flatMap((c) =>
      c.agentOptions.filter((o) => o.value),
    )
    return [{ value: '', label: 'Non assigné' }, ...(fromApi ?? [])]
  }, [selectedCampaign, campaignsQuery.data])

  const intentLabels = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of campaignsQuery.data ?? listCampaigns()) {
      for (const f of c.forms) map.set(f.intent, f.intentLabel)
    }
    return map
  }, [campaignsQuery.data])

  const updateStatusMutation = useMutation(
    orpc.leads.updateStatus.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: orpc.leads.list.key() })
        await queryClient.invalidateQueries({ queryKey: orpc.leads.stats.key() })
        await queryClient.invalidateQueries({ queryKey: orpc.leads.insights.key() })
        toast.success('Statut mis à jour')
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : 'Impossible de mettre à jour le statut')
      },
    }),
  )

  const updateAssigneeMutation = useMutation(
    orpc.leads.updateAssignee.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: orpc.leads.list.key() })
        await queryClient.invalidateQueries({ queryKey: orpc.leads.insights.key() })
        toast.success('Agent assigné')
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Impossible d'assigner l'agent")
      },
    }),
  )

  const leads =
    leadsQuery.data?.filter((lead) => (filter === 'all' ? true : lead.status === filter)) ?? []

  const stats = statsQuery.data
  const insights = insightsQuery.data

  return (
    <div className="space-y-10">
      <PageHeader
        kicker="Pipeline"
        title="Leads"
        description="Classement par campagne, extraction des insights et assignation des agents."
        actions={
          <Link to="/admin/parametres">
            <Button variant="outline" size="sm">
              Paramètres
            </Button>
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {(campaignsQuery.data ?? listCampaigns()).map((campaign) => (
          <Button
            key={campaign.id}
            size="sm"
            variant={campaignId === campaign.id ? 'mauve' : 'ghost'}
            onClick={() => setCampaignId(campaign.id)}
          >
            {campaign.shortName}
          </Button>
        ))}
        <Button
          size="sm"
          variant={campaignId === 'all' ? 'mauve' : 'ghost'}
          onClick={() => setCampaignId('all')}
        >
          Tous les formulaires
        </Button>
      </div>

      {stats ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Total leads" value={String(stats.total)} />
          <StatCard label="Nouveaux" value={String(stats.byStatus.new ?? 0)} />
          <StatCard label="Contactés" value={String(stats.byStatus.contacted ?? 0)} />
          <StatCard label="RDV" value={String(stats.byStatus.rdv ?? 0)} />
          <StatCard
            label="Convertis"
            value={`${stats.converted ?? stats.subscribed} · ${stats.conversionRate}%`}
            highlight
          />
        </div>
      ) : null}

      {insights && campaignId !== 'all' ? (
        <div className="grid gap-3 lg:grid-cols-3">
          <InsightPanel title="Montants" entries={insights.amountBuckets} />
          <InsightPanel title="Canaux préférés" entries={insights.channels} />
          <InsightPanel
            title="Agents"
            entries={{
              ...Object.fromEntries(
                Object.entries(insights.agents).map(([id, count]) => [
                  adviserLabel(id, { campaignId }),
                  count,
                ]),
              ),
              ...(insights.unassigned > 0 ? { 'Non assigné': insights.unassigned } : {}),
            }}
          />
        </div>
      ) : null}

      {stats && Object.keys(stats.byIntent ?? {}).length > 0 ? (
        <div className="flex flex-wrap gap-2 text-sm text-night-60">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-label">
            Intentions
          </span>
          {Object.entries(stats.byIntent).map(([intent, count]) => (
            <Badge key={intent} variant="secondary" className="normal-case tracking-normal">
              {intentLabels.get(intent) ?? intent} · {count}
            </Badge>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={filter === 'all' ? 'mauve' : 'ghost'}
          onClick={() => setFilter('all')}
        >
          Tous
        </Button>
        {LEAD_PIPELINE_STATUSES.map((status) => (
          <Button
            key={status}
            size="sm"
            variant={filter === status ? 'mauve' : 'ghost'}
            onClick={() => setFilter(status)}
          >
            {LEAD_STATUS_LABELS[status]}
          </Button>
        ))}
      </div>

      {leadsQuery.isLoading ? (
        <Panel>
          <PanelBody className="py-10 text-sm text-night-60">Chargement des leads…</PanelBody>
        </Panel>
      ) : null}

      {leads.length === 0 && !leadsQuery.isLoading ? (
        <EmptyState
          title="Aucun lead dans cette vue"
          description={
            selectedCampaign
              ? `Publiez les formulaires de « ${selectedCampaign.shortName ?? selectedCampaign.name} » et partagez ${'landingPath' in selectedCampaign ? selectedCampaign.landingPath : 'la landing'} avec des UTMs.`
              : 'Créez ou publiez des formulaires, puis partagez-les avec des liens UTM.'
          }
        />
      ) : null}

      <Panel>
        <PanelBody className="divide-y divide-mauve/10 p-0">
          {leads.map((lead) => {
            const intent = lead.intent
              ? (intentLabels.get(lead.intent) ?? lead.intent)
              : null
            const campaign = resolveLeadCampaign(lead)
            const insightsJson = lead.insights as
              | { company?: string; city?: string; notes?: string }
              | null
              | undefined

            return (
              <div
                key={lead.id}
                className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-start lg:justify-between lg:px-8"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-night-80">
                      {lead.name ?? lead.email ?? 'Lead anonyme'}
                    </p>
                    <Badge variant={leadStatusVariant(lead.status)}>
                      {leadStatusLabel(lead.status)}
                    </Badge>
                    {intent ? (
                      <Badge variant="secondary" className="normal-case tracking-normal">
                        {intent}
                      </Badge>
                    ) : null}
                    {campaign ? (
                      <Badge variant="outline" className="normal-case tracking-normal">
                        {campaign.shortName}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-sm text-night-60">
                    {lead.form?.title} · {new Date(lead.createdAt).toLocaleString('fr-FR')}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    {lead.email ? (
                      <span className="text-everest-green">{lead.email}</span>
                    ) : null}
                    {lead.phone ? <span className="text-night-60">{lead.phone}</span> : null}
                  </div>
                  <dl className="grid gap-1 text-xs text-text-secondary sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <dt className="font-semibold uppercase tracking-[0.1em] text-text-label">
                        Source
                      </dt>
                      <dd className="mt-0.5 normal-case tracking-normal">
                        {formatLeadSource(lead.utmSource, campaign)}
                      </dd>
                    </div>
                    {lead.amountRange ? (
                      <div>
                        <dt className="font-semibold uppercase tracking-[0.1em] text-text-label">
                          Montant
                        </dt>
                        <dd className="mt-0.5 normal-case tracking-normal">{lead.amountRange}</dd>
                      </div>
                    ) : null}
                    {lead.preferredChannel ? (
                      <div>
                        <dt className="font-semibold uppercase tracking-[0.1em] text-text-label">
                          Canal
                        </dt>
                        <dd className="mt-0.5 normal-case tracking-normal">
                          {lead.preferredChannel}
                        </dd>
                      </div>
                    ) : null}
                    {insightsJson?.company ? (
                      <div>
                        <dt className="font-semibold uppercase tracking-[0.1em] text-text-label">
                          Entreprise
                        </dt>
                        <dd className="mt-0.5 normal-case tracking-normal">{insightsJson.company}</dd>
                      </div>
                    ) : null}
                    {insightsJson?.city ? (
                      <div>
                        <dt className="font-semibold uppercase tracking-[0.1em] text-text-label">
                          Ville
                        </dt>
                        <dd className="mt-0.5 normal-case tracking-normal">{insightsJson.city}</dd>
                      </div>
                    ) : null}
                    <div>
                      <dt className="font-semibold uppercase tracking-[0.1em] text-text-label">
                        Agent
                      </dt>
                      <dd className="mt-0.5 normal-case tracking-normal">
                        {adviserLabel(lead.assignee, {
                          campaignId: lead.campaignId ?? lead.form?.campaignId,
                          formSlug: lead.form?.slug,
                        })}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
                  <label className="flex flex-col gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-label">
                    Statut
                    <select
                      value={lead.status}
                      onChange={(e) =>
                        updateStatusMutation.mutate({
                          id: lead.id,
                          status: e.target.value as LeadStatus,
                        })
                      }
                      className={cn(
                        'h-10 min-w-[10rem] rounded-xl border border-mauve/15 bg-white px-3 text-sm font-medium normal-case tracking-normal text-night',
                        'focus:border-mauve focus:outline-none focus:ring-2 focus:ring-mauve/10',
                      )}
                    >
                      {LEAD_PIPELINE_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {LEAD_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-label">
                    Assigner
                    <select
                      value={lead.assignee ?? ''}
                      onChange={(e) =>
                        updateAssigneeMutation.mutate({
                          id: lead.id,
                          assignee: e.target.value,
                        })
                      }
                      className={cn(
                        'h-10 min-w-[10rem] rounded-xl border border-mauve/15 bg-white px-3 text-sm font-medium normal-case tracking-normal text-night',
                        'focus:border-mauve focus:outline-none focus:ring-2 focus:ring-mauve/10',
                      )}
                    >
                      {agentOptionsForLead(lead, agentOptions, campaignsQuery.data).map(
                        (option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                </div>
              </div>
            )
          })}
        </PanelBody>
      </Panel>
    </div>
  )
}

function resolveLeadCampaign(lead: {
  campaignId?: string | null
  form?: { slug?: string; campaignId?: string | null } | null
}) {
  const id = lead.campaignId ?? lead.form?.campaignId
  if (id) return getCampaignById(id)
  if (lead.form?.slug) {
    return listCampaigns().find((c) => c.forms.some((f) => f.slug === lead.form?.slug))
  }
  return undefined
}

function agentOptionsForLead(
  lead: { campaignId?: string | null; form?: { slug?: string; campaignId?: string | null } | null },
  fallback: Array<{ value: string; label: string }>,
  campaigns?: Array<{
    id: string
    forms: Array<{ slug: string }>
    agentOptions: Array<{ value: string; label: string }>
  }>,
) {
  const campaignId = lead.campaignId ?? lead.form?.campaignId
  if (campaignId && campaigns) {
    const match = campaigns.find((c) => c.id === campaignId)
    if (match) return match.agentOptions
  }
  if (lead.form?.slug && campaigns) {
    const match = campaigns.find((c) => c.forms.some((f) => f.slug === lead.form?.slug))
    if (match) return match.agentOptions
  }
  return fallback
}

function InsightPanel({
  title,
  entries,
}: {
  title: string
  entries: Record<string, number>
}) {
  const rows = Object.entries(entries).sort((a, b) => b[1] - a[1]).slice(0, 6)
  return (
    <div className="rounded-2xl border border-everest-green/10 bg-white px-4 py-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-text-secondary">
        {title}
      </p>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-night-60">Pas encore de données</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {rows.map(([label, count]) => (
            <li key={label} className="flex justify-between gap-3 text-sm">
              <span className="truncate text-night-80">{label}</span>
              <span className="shrink-0 font-semibold text-everest-green">{count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border px-4 py-3',
        highlight ? 'border-gold-20 bg-gold-10' : 'border-everest-green/10 bg-white',
      )}
    >
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-text-secondary">
        {label}
      </p>
      <p
        className={cn(
          'mt-1 text-xl font-bold tracking-[-0.03em]',
          highlight ? 'text-gold-cta' : 'text-night-80',
        )}
      >
        {value}
      </p>
    </div>
  )
}
