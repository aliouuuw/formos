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
  const leadsQuery = useQuery(orpc.leads.list.queryOptions({ input: {} }))

  const updateMutation = useMutation(
    orpc.leads.updateStatus.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: orpc.leads.list.key() })
        toast.success('Statut mis à jour')
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : 'Impossible de mettre à jour le statut')
      },
    }),
  )

  const leads =
    leadsQuery.data?.filter((lead) => (filter === 'all' ? true : lead.status === filter)) ?? []

  return (
    <div className="space-y-10">
      <PageHeader
        kicker="Pipeline"
        title="Leads"
        description="Toutes les réponses de vos formulaires publiés, prêtes à être relancées."
      />

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
          description="Publiez un formulaire et partagez /f/slug. Les nouvelles soumissions apparaîtront ici."
        />
      ) : null}

      <Panel>
        <PanelBody className="divide-y divide-mauve/10 p-0">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-night-80">
                    {lead.name ?? lead.email ?? 'Lead anonyme'}
                  </p>
                  <Badge variant={leadStatusVariant(lead.status)}>{leadStatusLabel(lead.status)}</Badge>
                </div>
                <p className="text-sm text-night-60">
                  {lead.form?.title} · {new Date(lead.createdAt).toLocaleString()}
                </p>
                <p className="text-sm text-everest-green">{lead.email}</p>
                {lead.phone ? <p className="text-sm text-night-60">{lead.phone}</p> : null}
              </div>

              <label className="flex flex-col gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-label">
                Statut
                <select
                  value={lead.status}
                  onChange={(e) =>
                    updateMutation.mutate({
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
            </div>
          ))}
        </PanelBody>
      </Panel>
    </div>
  )
}
