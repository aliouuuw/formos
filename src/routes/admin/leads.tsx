import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import { EmptyState } from '#/components/empty-state'
import { PageHeader } from '#/components/page-header'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Panel, PanelBody } from '#/components/ui/panel'
import type { LeadStatus } from '#/lib/form-types'
import {
  IPO_ADVISER_OPTIONS,
  adviserLabel,
  formatLeadSource,
} from '#/lib/leads'
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

function intentLabel(intent: string | null | undefined) {
  if (intent === 'subscribe') return 'Souscription'
  if (intent === 'infos') return 'Infos / guide'
  return null
}

function LeadsPage() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<LeadStatus | 'all'>('all')
  const [ipoOnly, setIpoOnly] = useState(true)

  const leadsQuery = useQuery(
    orpc.leads.list.queryOptions({
      input: { campaignOnly: ipoOnly },
    }),
  )

  const statsQuery = useQuery(
    orpc.leads.stats.queryOptions({
      input: { campaignOnly: ipoOnly },
    }),
  )

  const updateStatusMutation = useMutation(
    orpc.leads.updateStatus.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: orpc.leads.list.key() })
        await queryClient.invalidateQueries({ queryKey: orpc.leads.stats.key() })
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
        toast.success('Conseiller assigné')
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Impossible d'assigner le conseiller")
      },
    }),
  )

  const leads =
    leadsQuery.data?.filter((lead) => (filter === 'all' ? true : lead.status === filter)) ?? []

  const stats = statsQuery.data

  return (
    <div className="space-y-10">
      <PageHeader
        kicker="Pipeline"
        title="Leads IPO"
        description="Suivi des prospects Bridge Bank : source, montant, canal et conversion vers la souscription."
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={ipoOnly ? 'mauve' : 'ghost'}
          onClick={() => setIpoOnly(true)}
        >
          Campagne IPO
        </Button>
        <Button
          size="sm"
          variant={!ipoOnly ? 'mauve' : 'ghost'}
          onClick={() => setIpoOnly(false)}
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
            label="Souscrits"
            value={`${stats.subscribed} · ${stats.conversionRate}%`}
            highlight
          />
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
          description="Publiez les formulaires IPO et partagez la landing /ipo-bridge-bank avec des liens UTM par canal."
        />
      ) : null}

      <Panel>
        <PanelBody className="divide-y divide-mauve/10 p-0">
          {leads.map((lead) => {
            const intent = intentLabel(lead.intent)
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
                        {formatLeadSource(lead.utmSource)}
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
                    <div>
                      <dt className="font-semibold uppercase tracking-[0.1em] text-text-label">
                        Conseiller
                      </dt>
                      <dd className="mt-0.5 normal-case tracking-normal">
                        {adviserLabel(lead.assignee)}
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
                      {IPO_ADVISER_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
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
        highlight
          ? 'border-gold-20 bg-gold-10'
          : 'border-everest-green/10 bg-white',
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
