import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { EmptyState } from '#/components/empty-state'
import { PageHeader } from '#/components/page-header'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Panel, PanelBody } from '#/components/ui/panel'
import type { LeadStatus } from '#/lib/form-types'
import { cn } from '#/lib/utils'
import { orpc } from '#/orpc/client'

export const Route = createFileRoute('/admin/leads')({ component: LeadsPage })

const statuses: LeadStatus[] = ['new', 'contacted', 'qualified', 'won', 'lost']

const statusVariant: Record<LeadStatus, 'mauve' | 'everest' | 'default' | 'secondary' | 'outline'> = {
  new: 'mauve',
  contacted: 'everest',
  qualified: 'default',
  won: 'everest',
  lost: 'outline',
}

function LeadsPage() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<LeadStatus | 'all'>('all')
  const leadsQuery = useQuery(orpc.leads.list.queryOptions({ input: {} }))

  const updateMutation = useMutation(
    orpc.leads.updateStatus.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: orpc.leads.list.key() })
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
        description="Every submission from your published forms, ready for follow-up."
      />

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={filter === 'all' ? 'mauve' : 'ghost'}
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        {statuses.map((status) => (
          <Button
            key={status}
            size="sm"
            variant={filter === status ? 'mauve' : 'ghost'}
            onClick={() => setFilter(status)}
          >
            {status}
          </Button>
        ))}
      </div>

      {leadsQuery.isLoading ? (
        <Panel>
          <PanelBody className="py-10 text-sm text-night-60">Loading leads...</PanelBody>
        </Panel>
      ) : null}

      {leads.length === 0 && !leadsQuery.isLoading ? (
        <EmptyState
          title="No leads in this view"
          description="Publish a form and share /f/slug. New submissions will appear here with email, phone, and source form."
        />
      ) : null}

      <Panel>
        <PanelBody className="divide-y divide-mauve-10 p-0">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-night-80">
                    {lead.name ?? lead.email ?? 'Anonymous lead'}
                  </p>
                  <Badge variant={statusVariant[lead.status as LeadStatus]}>{lead.status}</Badge>
                </div>
                <p className="text-sm text-night-60">
                  {lead.form?.title} · {new Date(lead.createdAt).toLocaleString()}
                </p>
                <p className="text-sm text-everest-green">{lead.email}</p>
                {lead.phone ? <p className="text-sm text-night-60">{lead.phone}</p> : null}
              </div>

              <label className="flex flex-col gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-mauve-60">
                Status
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
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
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
