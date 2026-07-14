import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

import { EmptyState } from '#/components/empty-state'
import { PageHeader } from '#/components/page-header'
import { Button } from '#/components/ui/button'
import { Panel, PanelBody } from '#/components/ui/panel'
import { orpc } from '#/orpc/client'

export const Route = createFileRoute('/admin/forms/$formId/submissions')({
  component: SubmissionsPage,
})

function SubmissionsPage() {
  const { formId } = Route.useParams()
  const formQuery = useQuery(orpc.forms.getById.queryOptions({ input: { id: formId } }))
  const submissionsQuery = useQuery(
    orpc.submissions.list.queryOptions({ input: { formId } }),
  )
  const exportQuery = useQuery({
    ...orpc.submissions.exportCsv.queryOptions({ input: { formId } }),
    enabled: false,
  })

  function handleExport() {
    void exportQuery.refetch().then(({ data }) => {
      if (!data?.csv) return
      const blob = new Blob([data.csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${formQuery.data?.slug ?? formId}-submissions.csv`
      a.click()
      URL.revokeObjectURL(url)
    })
  }

  const form = formQuery.data
  const submissions = submissionsQuery.data ?? []
  const fields = form?.definition.pages.flatMap((p) => p.fields) ?? []

  return (
    <div className="space-y-10">
      <PageHeader
        kicker="Soumissions"
        title={form?.title ?? '…'}
        description={`${submissions.length} soumission${submissions.length === 1 ? '' : 's'} collectée${submissions.length === 1 ? '' : 's'}`}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/admin/forms/$formId" params={{ formId }}>
              <Button variant="secondary" size="sm">
                ← Éditeur
              </Button>
            </Link>
            <Button
              variant="default"
              size="sm"
              onClick={handleExport}
              disabled={submissions.length === 0 || exportQuery.isFetching}
            >
              {exportQuery.isFetching ? 'Export…' : 'Exporter CSV'}
            </Button>
          </div>
        }
      />

      {submissionsQuery.isLoading ? (
        <Panel>
          <PanelBody className="py-10 text-sm text-night-60">Chargement des soumissions…</PanelBody>
        </Panel>
      ) : submissions.length === 0 ? (
        <EmptyState
          title="Aucune soumission"
          description="Les visiteurs qui complètent ce formulaire apparaîtront ici."
        />
      ) : (
        <Panel>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-left">
                  <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-mauve-60 sm:px-8">
                    Reçue le
                  </th>
                  {fields.slice(0, 4).map((f) => (
                    <th
                      key={f.id}
                      className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-mauve-60"
                    >
                      {f.label}
                    </th>
                  ))}
                  {fields.length > 4 ? (
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-mauve-60">
                      +{fields.length - 4} autres
                    </th>
                  ) : null}
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => {
                  const answers = sub.answers as Record<string, string>
                  return (
                    <tr
                      key={sub.id}
                      className="border-b border-mauve-10 transition-colors last:border-b-0 hover:bg-mauve-05"
                    >
                      <td className="px-6 py-4 tabular-nums text-night-60 sm:px-8">
                        {new Date(sub.createdAt).toLocaleString()}
                      </td>
                      {fields.slice(0, 4).map((f) => (
                        <td
                          key={f.id}
                          className="max-w-[200px] truncate px-4 py-4 text-night-80"
                        >
                          {answers[f.id] ?? <span className="text-night-40">—</span>}
                        </td>
                      ))}
                      {fields.length > 4 ? <td className="px-4 py-4 text-night-40">…</td> : null}
                      <td className="px-4 py-4 text-right">
                        <Link
                          to="/admin/forms/$formId/submissions/$submissionId"
                          params={{ formId, submissionId: sub.id }}
                        >
                          <Button variant="everest" size="sm">
                            Voir
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  )
}
