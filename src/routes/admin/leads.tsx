import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import type { LeadStatus } from '#/lib/form-types'
import { orpc } from '#/orpc/client'

export const Route = createFileRoute('/admin/leads')({ component: LeadsPage })

const statuses: LeadStatus[] = ['new', 'contacted', 'qualified', 'won', 'lost']

function LeadsPage() {
  const queryClient = useQueryClient()
  const leadsQuery = useQuery(orpc.leads.list.queryOptions({ input: {} }))

  const updateMutation = useMutation(
    orpc.leads.updateStatus.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: orpc.leads.list.key() })
      },
    }),
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[Fraunces] text-4xl font-bold">Leads</h1>
        <p className="mt-2 text-[var(--sea-ink-soft)]">
          Submissions captured across your published forms.
        </p>
      </div>

      <div className="grid gap-4">
        {leadsQuery.data?.map((lead) => (
          <Card key={lead.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{lead.name ?? lead.email ?? 'Anonymous lead'}</CardTitle>
                <p className="text-sm text-[var(--sea-ink-soft)]">
                  {lead.form?.title} · {new Date(lead.createdAt).toLocaleString()}
                </p>
              </div>
              <Badge>{lead.status}</Badge>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm">
                <p>{lead.email}</p>
                {lead.phone ? <p>{lead.phone}</p> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {statuses.map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={lead.status === status ? 'default' : 'outline'}
                    onClick={() => updateMutation.mutate({ id: lead.id, status })}
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        {leadsQuery.isLoading ? (
          <p className="text-sm text-[var(--sea-ink-soft)]">Loading leads...</p>
        ) : null}
        {leadsQuery.data?.length === 0 && !leadsQuery.isLoading ? (
          <p className="text-sm text-[var(--sea-ink-soft)]">No leads yet.</p>
        ) : null}
      </div>
    </div>
  )
}
