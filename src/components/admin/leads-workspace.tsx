'use client'

import type { ReactNode } from 'react'
import type { LeadStatus } from '#/lib/form-types'
import type { LeadListSort } from '#/lib/lead-admin'
import { agingLabel, deadlinesForLead, duplicateMatchLabel, getLeadAging, investorProfile, LEAD_LIST_SORTS, securitiesAccount } from '#/lib/lead-admin'
import type { CampaignConfig } from '#/lib/campaigns/types'
import { LEAD_PIPELINE_STATUSES, LEAD_STATUS_LABELS } from '#/lib/lead-status'
import { adviserLabel, formatLeadSource } from '#/lib/leads'
import { AdminSelect } from '#/components/admin/admin-select'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group'
import { cn } from '#/lib/utils'

type LeadRow = {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  status: string
  intent: string | null
  amountRange: string | null
  preferredChannel: string | null
  assignee: string | null
  utmSource: string | null
  campaignId: string | null
  createdAt: Date | string
  updatedAt: Date | string
  insights: unknown
  form?: {
    title?: string
    slug?: string
    campaignId?: string | null
  } | null
}

const SORT_LABELS: Record<LeadListSort, string> = {
  created_desc: 'Plus récents',
  created_asc: 'Plus anciens',
  updated_desc: 'Dernière màj ↓',
  updated_asc: 'Dernière màj ↑',
}

export function LeadsSummaryBar({
  stats,
  onUnassigned,
  onAged,
}: {
  stats: {
    total: number
    byStatus: Record<string, number>
    converted?: number
    subscribed?: number
    conversionRate: number
    unassigned?: number
    aged?: number
  }
  onUnassigned: () => void
  onAged: () => void
}) {
  const converted = stats.converted ?? stats.subscribed ?? 0
  const nouveaux = stats.byStatus.new ?? 0
  const enCours = (stats.byStatus.contacted ?? 0) + (stats.byStatus.rdv ?? 0)
  const unassigned = stats.unassigned ?? 0
  const aged = stats.aged ?? 0

  return (
    <div className="flex flex-wrap items-stretch divide-x divide-everest-green/10 overflow-hidden rounded-2xl border border-everest-green/10 bg-card shadow-[0_8px_24px_rgba(1,45,42,0.06)]">
      <Metric label="Total" value={String(stats.total)} />
      <Metric label="Nouveaux" value={String(nouveaux)} tone={nouveaux > 0 ? 'green' : 'default'} />
      <Metric label="En cours" value={String(enCours)} />
      <Metric label="Convertis" value={`${converted} (${stats.conversionRate}%)`} tone="gold" />
      <Metric
        label="Non assignés"
        value={String(unassigned)}
        onClick={onUnassigned}
        tone={unassigned > 0 ? 'green' : 'default'}
      />
      <Metric
        label="Délais dépassés"
        value={String(aged)}
        onClick={onAged}
        tone={aged > 0 ? 'mauve' : 'default'}
      />
    </div>
  )
}

function Metric({
  label,
  value,
  onClick,
  tone = 'default',
}: {
  label: string
  value: string
  onClick?: () => void
  tone?: 'default' | 'green' | 'gold' | 'mauve'
}) {
  const body = (
    <>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-everest-green/55">
        {label}
      </p>
      <p
        className={cn(
          'mt-1.5 text-lg font-semibold tabular-nums tracking-tight',
          tone === 'gold' && 'text-gold-cta',
          tone === 'green' && 'text-everest-green',
          tone === 'mauve' && 'text-mauve',
          tone === 'default' && 'text-night-80',
        )}
      >
        {value}
      </p>
    </>
  )

  const className = cn(
    'min-w-30 flex-1 px-4 py-3.5 text-left sm:px-5',
    onClick && 'transition-colors duration-200 hover:bg-everest-green/5',
  )

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        {body}
      </button>
    )
  }

  return <div className={className}>{body}</div>
}

export function LeadsInsightsCollapsible({
  insights,
  campaignId,
}: {
  insights: {
    amountBuckets: Record<string, number>
    channels: Record<string, number>
    profiles?: Record<string, number>
    accounts?: Record<string, number>
    agents: Record<string, number>
    unassigned: number
  }
  campaignId?: string
}) {
  const hasData =
    Object.keys(insights.amountBuckets).length > 0 ||
    Object.keys(insights.channels).length > 0

  if (!hasData) return null

  return (
    <div className="overflow-hidden rounded-2xl border border-everest-green/10 bg-everest-green/[0.03] shadow-[0_8px_24px_rgba(1,45,42,0.04)]">
      <details className="group">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-everest-green marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="flex items-center justify-between gap-3">
            <span>Répartition campagne</span>
            <span className="text-xs font-normal text-everest-green/55 group-open:hidden">
              Afficher
            </span>
            <span className="hidden text-xs font-normal text-everest-green/55 group-open:inline">
              Masquer
            </span>
          </span>
        </summary>
        <div className="grid gap-px border-t border-everest-green/10 bg-everest-green/10 sm:grid-cols-2 lg:grid-cols-5">
          <InsightBlock title="Montants" entries={insights.amountBuckets} />
          <InsightBlock title="Canaux" entries={insights.channels} />
          <InsightBlock title="Profils" entries={insights.profiles ?? {}} />
          <InsightBlock title="Compte titres" entries={insights.accounts ?? {}} />
          <InsightBlock
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
      </details>
    </div>
  )
}

function InsightBlock({
  title,
  entries,
}: {
  title: string
  entries: Record<string, number>
}) {
  const rows = Object.entries(entries).sort((a, b) => b[1] - a[1]).slice(0, 5)
  return (
    <div className="bg-card px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-everest-green/55">
        {title}
      </p>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-everest-green/40">—</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {rows.map(([label, count]) => (
            <li key={label} className="flex justify-between gap-2 text-sm">
              <span className="truncate text-night-80">{label}</span>
              <span className="shrink-0 font-medium tabular-nums text-gold-cta">{count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function LeadsToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  assigneeFilter,
  onAssigneeFilterChange,
  assigneeOptions,
  sort,
  onSortChange,
  agedOnly,
  onAgedOnlyChange,
}: {
  search: string
  onSearchChange: (value: string) => void
  statusFilter: LeadStatus | 'all'
  onStatusFilterChange: (value: LeadStatus | 'all') => void
  assigneeFilter: string
  onAssigneeFilterChange: (value: string) => void
  assigneeOptions: Array<{ value: string; label: string }>
  sort: LeadListSort
  onSortChange: (value: LeadListSort) => void
  agedOnly: boolean
  onAgedOnlyChange: (value: boolean) => void
}) {
  const statusOptions = [
    { value: 'all', label: 'Tous' },
    ...LEAD_PIPELINE_STATUSES.map((status) => ({
      value: status,
      label: LEAD_STATUS_LABELS[status],
    })),
  ]

  const sortOptions = LEAD_LIST_SORTS.map((value) => ({
    value,
    label: SORT_LABELS[value],
  }))

  const assigneeLabel =
    assigneeOptions.find((o) => o.value === assigneeFilter)?.label ?? assigneeFilter

  const activeFilters: Array<{ key: string; label: string; onClear: () => void }> = []
  if (search.trim()) {
    activeFilters.push({
      key: 'q',
      label: `Recherche: ${search.trim()}`,
      onClear: () => onSearchChange(''),
    })
  }
  if (statusFilter !== 'all') {
    activeFilters.push({
      key: 'status',
      label: `Statut: ${LEAD_STATUS_LABELS[statusFilter]}`,
      onClear: () => onStatusFilterChange('all'),
    })
  }
  if (assigneeFilter !== 'all') {
    activeFilters.push({
      key: 'assignee',
      label: `Agent: ${assigneeLabel}`,
      onClear: () => onAssigneeFilterChange('all'),
    })
  }
  if (agedOnly) {
    activeFilters.push({
      key: 'sla',
      label: 'Délais dépassés',
      onClear: () => onAgedOnlyChange(false),
    })
  }

  const hasActiveFilters = activeFilters.length > 0
  const sortIsDefault = sort === 'created_desc'

  const resetFilters = () => {
    onSearchChange('')
    onStatusFilterChange('all')
    onAssigneeFilterChange('all')
    onAgedOnlyChange(false)
    onSortChange('created_desc')
  }

  return (
    <div className="border-b border-everest-green/10 bg-everest-green/[0.03]">
      {/* Row 1: search (ERP primary discovery) */}
      <div className="flex flex-col gap-2 border-b border-everest-green/10 px-4 py-3 sm:flex-row sm:items-center sm:gap-3 sm:px-6">
        <div className="relative min-w-0 flex-1">
          <span
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-everest-green/45"
            aria-hidden
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
              <path
                d="M20 20l-3.5-3.5"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher nom, email, téléphone…"
            className="h-9 bg-card pl-9"
            aria-label="Rechercher"
          />
        </div>
        {(hasActiveFilters || !sortIsDefault) && (
          <Button type="button" size="sm" variant="secondary" onClick={resetFilters}>
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Row 2: labeled filter grid (Odoo / SAP filter bar) */}
      <div className="grid gap-3 px-4 py-3 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1fr_1fr_1fr_auto]">
        <FilterField label="Statut" htmlFor="lead-filter-status">
          <AdminSelect
            value={statusFilter}
            onValueChange={(v) => onStatusFilterChange(v as LeadStatus | 'all')}
            options={statusOptions}
            triggerClassName="w-full min-w-0"
          />
        </FilterField>

        <FilterField label="Agent" htmlFor="lead-filter-agent">
          <AdminSelect
            value={assigneeFilter}
            onValueChange={onAssigneeFilterChange}
            options={assigneeOptions}
            triggerClassName="w-full min-w-0"
          />
        </FilterField>

        <FilterField label="Trier par" htmlFor="lead-filter-sort">
          <AdminSelect
            value={sort}
            onValueChange={(v) => onSortChange(v as LeadListSort)}
            options={sortOptions}
            triggerClassName="w-full min-w-0"
          />
        </FilterField>

        <FilterField label="Délais" htmlFor="lead-filter-overdue">
          <label
            htmlFor="lead-filter-overdue"
            className={cn(
              'flex h-9 cursor-pointer items-center gap-2.5 rounded-xl border px-3 text-sm transition-colors',
              agedOnly
                ? 'border-everest-green/30 bg-everest-green/5 text-everest-green'
                : 'border-everest-green/15 bg-card text-foreground hover:border-everest-green/25',
            )}
          >
            <input
              id="lead-filter-overdue"
              type="checkbox"
              checked={agedOnly}
              onChange={(e) => onAgedOnlyChange(e.target.checked)}
              className="size-3.5 shrink-0 accent-[var(--everest-green)]"
            />
            <span className="font-medium">Délais dépassés</span>
          </label>
        </FilterField>
      </div>

      {/* Row 3: active filter chips */}
      {hasActiveFilters ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-everest-green/10 px-4 py-2.5 sm:px-6">
          <span className="text-xs text-everest-green/55">Filtres actifs</span>
          {activeFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={filter.onClear}
              className="inline-flex items-center gap-1.5 rounded-full border border-everest-green/20 bg-card px-2.5 py-1 text-xs font-medium text-everest-green transition-colors hover:border-everest-green/40 hover:bg-everest-green/5"
            >
              {filter.label}
              <span aria-hidden className="text-muted-foreground">
                ×
              </span>
              <span className="sr-only">Retirer</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function FilterField({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: ReactNode
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <label htmlFor={htmlFor} className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-everest-green/55">
        {label}
      </label>
      {children}
    </div>
  )
}

export function LeadsBulkBar({
  selectedCount,
  pageCount,
  allPageSelected,
  statusOptions,
  agentOptions,
  busy,
  onTogglePage,
  onClear,
  onBulkStatus,
  onBulkAssignee,
  onExportSelected,
}: {
  selectedCount: number
  pageCount: number
  allPageSelected: boolean
  statusOptions: Array<{ value: string; label: string }>
  agentOptions: Array<{ value: string; label: string }>
  busy: boolean
  onTogglePage: () => void
  onClear: () => void
  onBulkStatus: (status: LeadStatus) => void
  onBulkAssignee: (assignee: string) => void
  onExportSelected: () => void
}) {
  if (selectedCount === 0) return null

  return (
    <div
      className="flex flex-col gap-3 border-b border-everest-green/15 bg-everest-green/[0.06] px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-6"
      role="toolbar"
      aria-label="Actions groupées"
    >
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-everest-green">
          <input
            type="checkbox"
            checked={allPageSelected}
            ref={(el) => {
              if (el) el.indeterminate = selectedCount > 0 && !allPageSelected
            }}
            onChange={onTogglePage}
            className="size-3.5 accent-[var(--everest-green)]"
            aria-label={
              allPageSelected
                ? 'Désélectionner la page'
                : 'Sélectionner toute la page'
            }
          />
          <span>
            {selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}
            {pageCount > 0 ? (
              <span className="font-normal text-everest-green/55">
                {' '}
                · page {pageCount}
              </span>
            ) : null}
          </span>
        </label>
        <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={onClear}>
          Tout désélectionner
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <AdminSelect
          value=""
          placeholder="Statut…"
          onValueChange={(status) => {
            if (status) onBulkStatus(status as LeadStatus)
          }}
          options={[{ value: '', label: 'Changer le statut…' }, ...statusOptions]}
          triggerClassName="min-w-[10rem]"
        />
        <AdminSelect
          value=""
          placeholder="Agent…"
          onValueChange={(assignee) => {
            if (assignee === '__unassign__') onBulkAssignee('')
            else if (assignee) onBulkAssignee(assignee)
          }}
          options={[
            { value: '', label: 'Assigner un agent…' },
            ...agentOptions.filter((o) => o.value),
            { value: '__unassign__', label: 'Retirer l’agent' },
          ]}
          triggerClassName="min-w-[10rem]"
        />
        <Button
          type="button"
          size="sm"
          variant="default"
          disabled={busy}
          onClick={onExportSelected}
        >
          Exporter la sélection
        </Button>
      </div>
    </div>
  )
}

export function LeadsTable({
  leads,
  intentLabels,
  resolveCampaign,
  agentOptions,
  campaigns,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onOpen,
  onStatusChange,
  onAssigneeChange,
}: {
  leads: LeadRow[]
  intentLabels: Map<string, string>
  resolveCampaign: (lead: LeadRow) => CampaignConfig | undefined
  agentOptions: Array<{ value: string; label: string }>
  campaigns?: Array<{
    id: string
    forms: Array<{ slug: string }>
    agentOptions: Array<{ value: string; label: string }>
    newLeadDeadlineHours?: number
    contactedLeadDeadlineHours?: number
  }>
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onToggleSelectAll: () => void
  onOpen: (id: string) => void
  onStatusChange: (id: string, status: LeadStatus) => void
  onAssigneeChange: (id: string, assignee: string) => void
}) {
  const statusOptions = LEAD_PIPELINE_STATUSES.map((status) => ({
    value: status,
    label: LEAD_STATUS_LABELS[status],
  }))

  const allSelected = leads.length > 0 && leads.every((l) => selectedIds.has(l.id))
  const someSelected = leads.some((l) => selectedIds.has(l.id))

  return (
    <Table className="min-w-[1120px]">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-10 px-3 sm:px-4">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected && !allSelected
              }}
              onChange={onToggleSelectAll}
              className="size-3.5 accent-[var(--everest-green)]"
              aria-label="Sélectionner toute la page"
            />
          </TableHead>
          <TableHead className="px-2 sm:px-4">Lead</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Montant</TableHead>
          <TableHead>Profil</TableHead>
          <TableHead>Canal</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Agent</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Assigner</TableHead>
          <TableHead className="px-4 sm:px-6" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.map((lead) => {
          const campaign = resolveCampaign(lead)
          const insightsJson = lead.insights as
            | {
                city?: string
                extras?: Record<string, string>
                duplicateOfLeadId?: string
                duplicateMatch?: 'email' | 'phone'
              }
            | null
            | undefined
          const profile = investorProfile(insightsJson)
          const account = securitiesAccount(insightsJson)
          const duplicateLabel = duplicateMatchLabel(insightsJson)
          const deadlines = deadlinesForLead(lead, campaigns)
          const aging = getLeadAging(lead, deadlines)
          const intent = lead.intent ? (intentLabels.get(lead.intent) ?? lead.intent) : null
          const options = agentOptionsForLead(lead, agentOptions, campaigns)
          const isSelected = selectedIds.has(lead.id)

          return (
            <TableRow
              key={lead.id}
              className={cn(isSelected && 'bg-everest-green/[0.04]')}
              data-state={isSelected ? 'selected' : undefined}
            >
              <TableCell className="px-3 align-top sm:px-4">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleSelect(lead.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1 size-3.5 accent-[var(--everest-green)]"
                  aria-label={`Sélectionner ${lead.name ?? lead.email ?? 'lead'}`}
                />
              </TableCell>
              <TableCell className="px-2 align-top sm:px-4">
                <button type="button" className="group text-left" onClick={() => onOpen(lead.id)}>
                  <p className="font-medium text-foreground group-hover:text-everest-green">
                    {lead.name ?? lead.email ?? 'Lead anonyme'}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(lead.createdAt).toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {insightsJson?.city ? ` · ${insightsJson.city}` : ''}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {aging ? (
                      <Badge variant="mauve" className="normal-case tracking-normal">
                        {agingLabel(aging, deadlines)}
                      </Badge>
                    ) : null}
                    {duplicateLabel ? (
                      <Badge variant="outline" className="normal-case tracking-normal">
                        {duplicateLabel}
                      </Badge>
                    ) : null}
                    {intent ? (
                      <Badge variant="secondary" className="normal-case tracking-normal">
                        {intent}
                      </Badge>
                    ) : null}
                  </div>
                </button>
              </TableCell>
              <TableCell className="align-top">
                <div className="max-w-48 space-y-0.5">
                  {lead.email ? (
                    <p className="truncate text-everest-green">{lead.email}</p>
                  ) : null}
                  {lead.phone ? (
                    <p className="truncate text-muted-foreground">{lead.phone}</p>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="max-w-40 truncate align-top">
                {lead.amountRange ?? <span className="text-muted-foreground">—</span>}
              </TableCell>
              <TableCell className="align-top">
                <div className="space-y-0.5 text-xs">
                  <p>{profile ?? '—'}</p>
                  {account ? <p className="text-muted-foreground">Compte: {account}</p> : null}
                </div>
              </TableCell>
              <TableCell className="align-top">
                {lead.preferredChannel ?? <span className="text-muted-foreground">—</span>}
              </TableCell>
              <TableCell className="max-w-32 truncate align-top text-muted-foreground">
                {formatLeadSource(lead.utmSource, campaign)}
              </TableCell>
              <TableCell className="max-w-32 truncate align-top">
                {adviserLabel(lead.assignee, {
                  campaignId: lead.campaignId ?? lead.form?.campaignId,
                  formSlug: lead.form?.slug,
                })}
              </TableCell>
              <TableCell className="align-top">
                <AdminSelect
                  value={lead.status}
                  onValueChange={(status) => onStatusChange(lead.id, status as LeadStatus)}
                  options={statusOptions}
                />
              </TableCell>
              <TableCell className="align-top">
                <AdminSelect
                  value={lead.assignee ?? ''}
                  onValueChange={(assignee) => onAssigneeChange(lead.id, assignee)}
                  options={options}
                />
              </TableCell>
              <TableCell className="px-4 text-right align-top sm:px-6">
                <Button type="button" size="sm" variant="everest" onClick={() => onOpen(lead.id)}>
                  Détail
                </Button>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

export function agentOptionsForLead(
  lead: {
    campaignId?: string | null
    form?: { slug?: string; campaignId?: string | null } | null
  },
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

export function LeadsPagination({
  page,
  pageSize,
  total,
  hasMore,
  isFetching,
  onPrevious,
  onNext,
}: {
  page: number
  pageSize: number
  total: number
  hasMore: boolean
  isFetching: boolean
  onPrevious: () => void
  onNext: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-everest-green/10 px-4 py-3 text-sm text-everest-green/55 sm:px-6">
      <p>
        {total === 0
          ? 'Aucun résultat'
          : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} sur ${total}`}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={page <= 1 || isFetching}
          onClick={onPrevious}
        >
          Précédent
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={!hasMore || isFetching}
          onClick={onNext}
        >
          Suivant
        </Button>
      </div>
    </div>
  )
}

export function CampaignSegment({
  campaigns,
  campaignId,
  onChange,
}: {
  campaigns: Array<{ id: string; shortName: string }>
  campaignId: string | 'all'
  onChange: (id: string | 'all') => void
}) {
  return (
    <ToggleGroup
      type="single"
      value={campaignId}
      onValueChange={(value) => {
        if (value) onChange(value as string | 'all')
      }}
      variant="outline"
      className="inline-flex flex-wrap gap-1 rounded-full border border-everest-green/15 bg-everest-green/[0.04] p-1"
    >
      {campaigns.map((campaign) => (
        <ToggleGroupItem
          key={campaign.id}
          value={campaign.id}
          className="rounded-full border-0 px-3.5 py-1.5 text-sm text-everest-green/70 shadow-none data-[state=on]:bg-everest-green data-[state=on]:text-white data-[state=on]:shadow-[0_4px_12px_rgba(1,45,42,0.2)]"
        >
          {campaign.shortName}
        </ToggleGroupItem>
      ))}
      <ToggleGroupItem
        value="all"
        className="rounded-full border-0 px-3.5 py-1.5 text-sm text-everest-green/70 shadow-none data-[state=on]:bg-everest-green data-[state=on]:text-white data-[state=on]:shadow-[0_4px_12px_rgba(1,45,42,0.2)]"
      >
        Tous
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
