import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { LeadDetailPanel } from '#/components/admin/lead-detail-panel'
import {
  agentOptionsForLead,
  CampaignSegment,
  LeadsBulkBar,
  LeadsInsightsCollapsible,
  LeadsPagination,
  LeadsSummaryBar,
  LeadsTable,
  LeadsToolbar,
} from '#/components/admin/leads-workspace'
import { EmptyState } from '#/components/empty-state'
import { PageHeader } from '#/components/page-header'
import { Button } from '#/components/ui/button'
import { Panel, PanelBody } from '#/components/ui/panel'
import type { LeadStatus } from '#/lib/form-types'
import { getCampaignById, listCampaigns } from '#/lib/campaigns'
import { LEAD_UNASSIGNED, type LeadListSort } from '#/lib/lead-admin'
import { LEAD_PIPELINE_STATUSES, LEAD_STATUS_LABELS } from '#/lib/lead-status'
import { client, orpc } from '#/orpc/client'

export const Route = createFileRoute('/admin/leads')({ component: LeadsPage })

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function LeadsPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all')
  const defaultCampaignId = listCampaigns()[0]?.id
  const [campaignId, setCampaignId] = useState<string | 'all'>(defaultCampaignId ?? 'all')
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search.trim())
  const [sort, setSort] = useState<LeadListSort>('created_desc')
  const [page, setPage] = useState(1)
  const [agedOnly, setAgedOnly] = useState(false)
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())

  const pageSize = 50

  const campaignsQuery = useQuery(orpc.campaigns.list.queryOptions({ input: undefined }))
  const campaigns = campaignsQuery.data ?? listCampaigns()

  const listInput = useMemo(
    () => ({
      campaignId: campaignId === 'all' ? undefined : campaignId,
      status: statusFilter === 'all' ? undefined : statusFilter,
      assignee: assigneeFilter === 'all' ? undefined : assigneeFilter,
      q: deferredSearch || undefined,
      sort,
      page,
      pageSize,
      agedOnly: agedOnly || undefined,
    }),
    [campaignId, statusFilter, assigneeFilter, deferredSearch, sort, page, agedOnly],
  )

  const statsInput = useMemo(
    () => ({
      campaignId: campaignId === 'all' ? undefined : campaignId,
    }),
    [campaignId],
  )

  const leadsQuery = useQuery(orpc.leads.list.queryOptions({ input: listInput }))
  const statsQuery = useQuery(orpc.leads.stats.queryOptions({ input: statsInput }))
  const insightsQuery = useQuery(
    orpc.leads.insights.queryOptions({
      input: { campaignId: campaignId === 'all' ? undefined : campaignId },
    }),
  )

  const selectedCampaign =
    campaignId === 'all'
      ? undefined
      : (getCampaignById(campaignId) ?? campaigns.find((c) => c.id === campaignId))

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
    const fromApi = campaignsQuery.data?.flatMap((c) => c.agentOptions.filter((o) => o.value))
    return [{ value: '', label: 'Non assigné' }, ...(fromApi ?? [])]
  }, [selectedCampaign, campaignsQuery.data])

  const assigneeFilterOptions = useMemo(() => {
    const agents = agentOptions.filter((o) => o.value)
    return [
      { value: 'all', label: 'Tous' },
      { value: LEAD_UNASSIGNED, label: 'Non assigné' },
      ...agents,
    ]
  }, [agentOptions])

  const intentLabels = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of campaigns) {
      for (const f of c.forms) map.set(f.intent, f.intentLabel)
    }
    return map
  }, [campaigns])

  const statusOptions = useMemo(
    () =>
      LEAD_PIPELINE_STATUSES.map((status) => ({
        value: status,
        label: LEAD_STATUS_LABELS[status],
      })),
    [],
  )

  const invalidateLeadQueries = async () => {
    await queryClient.invalidateQueries({ queryKey: orpc.leads.list.key() })
    await queryClient.invalidateQueries({ queryKey: orpc.leads.stats.key() })
    await queryClient.invalidateQueries({ queryKey: orpc.leads.insights.key() })
  }

  const updateStatusMutation = useMutation(
    orpc.leads.updateStatus.mutationOptions({
      onSuccess: async () => {
        await invalidateLeadQueries()
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
        await invalidateLeadQueries()
        toast.success('Agent assigné')
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Impossible d'assigner l'agent")
      },
    }),
  )

  const bulkStatusMutation = useMutation(
    orpc.leads.bulkUpdateStatus.mutationOptions({
      onSuccess: async (result) => {
        await invalidateLeadQueries()
        setSelectedIds(new Set())
        if (result.skipped > 0) {
          toast.success(
            `${result.updated} statut(s) mis à jour · ${result.skipped} ignoré(s)`,
          )
        } else {
          toast.success(`${result.updated} statut(s) mis à jour`)
        }
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : 'Impossible de mettre à jour les statuts')
      },
    }),
  )

  const bulkAssigneeMutation = useMutation(
    orpc.leads.bulkUpdateAssignee.mutationOptions({
      onSuccess: async (result) => {
        await invalidateLeadQueries()
        setSelectedIds(new Set())
        if (result.skipped > 0) {
          toast.success(
            `${result.updated} lead(s) assigné(s) · ${result.skipped} ignoré(s)`,
          )
        } else {
          toast.success(
            result.updated > 0
              ? `${result.updated} lead(s) mis à jour`
              : 'Aucun lead mis à jour',
          )
        }
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Impossible d'assigner les agents")
      },
    }),
  )

  const leads = leadsQuery.data?.items ?? []
  const total = leadsQuery.data?.total ?? 0
  const hasMore = leadsQuery.data?.hasMore ?? false
  const stats = statsQuery.data
  const insights = insightsQuery.data

  const filterKey = useMemo(
    () =>
      JSON.stringify({
        campaignId: listInput.campaignId,
        status: listInput.status,
        assignee: listInput.assignee,
        q: listInput.q,
        sort: listInput.sort,
        agedOnly: listInput.agedOnly,
      }),
    [
      listInput.campaignId,
      listInput.status,
      listInput.assignee,
      listInput.q,
      listInput.sort,
      listInput.agedOnly,
    ],
  )

  useEffect(() => {
    setSelectedIds(new Set())
  }, [filterKey])

  const resetPage = () => setPage(1)

  const pageIds = leads.map((l) => l.id)
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id))

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAllPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allPageSelected) {
        for (const id of pageIds) next.delete(id)
      } else {
        for (const id of pageIds) next.add(id)
      }
      return next
    })
  }

  const selectedIdList = useMemo(() => [...selectedIds], [selectedIds])
  const bulkBusy =
    bulkStatusMutation.isPending || bulkAssigneeMutation.isPending || exporting

  const handleExport = async () => {
    setExporting(true)
    try {
      const result = await client.leads.exportCsv({
        campaignId: listInput.campaignId,
        status: listInput.status,
        assignee: listInput.assignee,
        q: listInput.q,
        sort: listInput.sort,
        agedOnly: listInput.agedOnly,
      })
      if (!result.csv) {
        toast.message('Aucun lead à exporter pour ces filtres')
        return
      }
      downloadCsv(result.csv, `leads-${campaignId}-${new Date().toISOString().slice(0, 10)}.csv`)
      toast.success(`${result.count} lead(s) exporté(s)`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'export")
    } finally {
      setExporting(false)
    }
  }

  const handleExportSelected = async () => {
    if (selectedIdList.length === 0) return
    setExporting(true)
    try {
      const result = await client.leads.exportCsv({ ids: selectedIdList })
      if (!result.csv) {
        toast.message('Aucun lead à exporter')
        return
      }
      downloadCsv(
        result.csv,
        `leads-selection-${new Date().toISOString().slice(0, 10)}.csv`,
      )
      toast.success(`${result.count} lead(s) exporté(s)`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'export")
    } finally {
      setExporting(false)
    }
  }

  const resolveLeadCampaign = (lead: {
    campaignId?: string | null
    form?: { slug?: string; campaignId?: string | null } | null
  }) => {
    const id = lead.campaignId ?? lead.form?.campaignId
    if (id) return getCampaignById(id)
    if (lead.form?.slug) {
      return listCampaigns().find((c) => c.forms.some((f) => f.slug === lead.form?.slug))
    }
    return undefined
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Leads"
        description="Suivi des prospects par campagne, assignation et relances."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="default"
              size="sm"
              disabled={exporting || total === 0}
              onClick={() => void handleExport()}
            >
              {exporting ? 'Export…' : 'Exporter CSV'}
            </Button>
            <Link to="/admin/parametres">
              <Button variant="mauve" size="sm">
                Paramètres
              </Button>
            </Link>
          </div>
        }
      />

      <CampaignSegment
        campaigns={campaigns.map((c) => ({ id: c.id, shortName: c.shortName }))}
        campaignId={campaignId}
        onChange={(id) => {
          setCampaignId(id)
          resetPage()
        }}
      />

      {stats ? (
        <LeadsSummaryBar
          stats={stats}
          onUnassigned={() => {
            setAssigneeFilter(LEAD_UNASSIGNED)
            setAgedOnly(false)
            resetPage()
          }}
          onAged={() => {
            setAgedOnly(true)
            setStatusFilter('all')
            resetPage()
          }}
        />
      ) : null}

      {insights && campaignId !== 'all' ? (
        <LeadsInsightsCollapsible insights={insights} campaignId={campaignId} />
      ) : null}

      {leadsQuery.isLoading ? (
        <Panel>
          <PanelBody className="py-12 text-sm text-night-60">Chargement des leads…</PanelBody>
        </Panel>
      ) : leads.length === 0 ? (
        <EmptyState
          title="Aucun lead dans cette vue"
          description={
            selectedCampaign
              ? `Publiez les formulaires de « ${selectedCampaign.shortName ?? selectedCampaign.name} » et partagez la landing avec des UTMs.`
              : 'Créez ou publiez des formulaires, puis partagez-les avec des liens UTM.'
          }
        />
      ) : (
        <Panel className="overflow-hidden">
          <LeadsToolbar
            search={search}
            onSearchChange={(value) => {
              setSearch(value)
              resetPage()
            }}
            statusFilter={statusFilter}
            onStatusFilterChange={(value) => {
              setStatusFilter(value)
              setAgedOnly(false)
              resetPage()
            }}
            assigneeFilter={assigneeFilter}
            onAssigneeFilterChange={(value) => {
              setAssigneeFilter(value)
              resetPage()
            }}
            assigneeOptions={assigneeFilterOptions}
            sort={sort}
            onSortChange={(value) => {
              setSort(value)
              resetPage()
            }}
            agedOnly={agedOnly}
            onAgedOnlyChange={(value) => {
              setAgedOnly(value)
              if (value) setStatusFilter('all')
              resetPage()
            }}
          />
          <LeadsBulkBar
            selectedCount={selectedIds.size}
            pageCount={pageIds.length}
            allPageSelected={allPageSelected}
            statusOptions={statusOptions}
            agentOptions={agentOptions}
            busy={bulkBusy}
            onTogglePage={toggleSelectAllPage}
            onClear={() => setSelectedIds(new Set())}
            onBulkStatus={(status) =>
              bulkStatusMutation.mutate({ ids: selectedIdList, status })
            }
            onBulkAssignee={(assignee) =>
              bulkAssigneeMutation.mutate({ ids: selectedIdList, assignee })
            }
            onExportSelected={() => void handleExportSelected()}
          />
          <LeadsTable
            leads={leads}
            intentLabels={intentLabels}
            resolveCampaign={resolveLeadCampaign}
            agentOptions={agentOptions}
            campaigns={campaignsQuery.data}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAllPage}
            onOpen={setSelectedLeadId}
            onStatusChange={(id, status) => updateStatusMutation.mutate({ id, status })}
            onAssigneeChange={(id, assignee) =>
              updateAssigneeMutation.mutate({ id, assignee })
            }
          />
          <LeadsPagination
            page={page}
            pageSize={pageSize}
            total={total}
            hasMore={hasMore}
            isFetching={leadsQuery.isFetching}
            onPrevious={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => p + 1)}
          />
        </Panel>
      )}

      {selectedLeadId ? (
        <LeadDetailPanel
          leadId={selectedLeadId}
          agentOptions={agentOptionsForLead(
            leads.find((l) => l.id === selectedLeadId) ?? {
              campaignId: campaignId === 'all' ? null : campaignId,
            },
            agentOptions,
            campaignsQuery.data,
          )}
          onClose={() => setSelectedLeadId(null)}
        />
      ) : null}
    </div>
  )
}
