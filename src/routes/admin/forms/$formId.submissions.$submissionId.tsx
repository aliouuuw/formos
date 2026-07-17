import { Link, createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '#/components/page-header'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Panel, PanelBody, PanelHeader } from '#/components/ui/panel'
import { BULLETIN_FIELD_IDS, isBulletinFormSlug } from '#/lib/ipo-bulletin'
import { orpc } from '#/orpc/client'

export const Route = createFileRoute('/admin/forms/$formId/submissions/$submissionId')({
  component: SubmissionDetailPage,
})

function SubmissionDetailPage() {
  const { formId, submissionId } = Route.useParams()
  const query = useQuery(
    orpc.submissions.get.queryOptions({ input: { formId, submissionId } }),
  )
  const formQuery = useQuery(orpc.forms.getById.queryOptions({ input: { id: formId } }))
  const [pdfLoading, setPdfLoading] = useState(false)

  const generatePdf = useMutation(
    orpc.submissions.generateBulletinPdf.mutationOptions({
      onSuccess: (data) => {
        const binary = atob(data.base64)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
        const blob = new Blob([bytes], { type: data.contentType })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = data.filename
        a.click()
        URL.revokeObjectURL(url)
        toast.success('Bulletin PDF téléchargé')
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : 'Échec de la génération PDF')
      },
      onSettled: () => setPdfLoading(false),
    }),
  )

  if (query.isLoading) {
    return <p className="text-sm text-night-60">Loading…</p>
  }

  if (!query.data) {
    return <p className="text-sm text-red-700">Submission not found.</p>
  }

  const { submission, definition } = query.data
  const answers = submission.answers as Record<string, string>
  const fields = definition.pages.flatMap((p) => p.fields)
  const lead = submission.lead as { email?: string; name?: string; phone?: string; status?: string } | null
  const canGenerateBulletin = isBulletinFormSlug(formQuery.data?.slug ?? '')

  return (
    <div className="space-y-10">
      <PageHeader
        kicker="Soumission"
        title={`#${submission.id.slice(0, 8)}`}
        description={`Reçue le ${new Date(submission.createdAt).toLocaleString()} · version ${submission.formVersion}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canGenerateBulletin ? (
              <Button
                variant="everest"
                size="sm"
                disabled={pdfLoading || generatePdf.isPending}
                onClick={() => {
                  setPdfLoading(true)
                  generatePdf.mutate({ formId, submissionId })
                }}
              >
                {pdfLoading || generatePdf.isPending
                  ? 'Génération…'
                  : 'Télécharger le bulletin PDF'}
              </Button>
            ) : null}
            <Link to="/admin/forms/$formId/submissions" params={{ formId }}>
              <Button variant="secondary" size="sm">
                ← Toutes les soumissions
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Panel>
          <PanelHeader>
            <h2 className="text-base font-semibold text-night-80">Réponses</h2>
            <p className="mt-1 text-sm text-night-60">
              Affichées selon la définition en version {submission.formVersion}.
            </p>
          </PanelHeader>
          <PanelBody className="divide-y divide-mauve/10 p-0">
            {fields.map((field) => {
              const rawValue = answers[field.id]
              const value =
                field.id === BULLETIN_FIELD_IDS.signature && rawValue
                  ? 'Signature enregistrée'
                  : rawValue
              return (
                <div
                  key={field.id}
                  className="grid grid-cols-[180px_1fr] gap-4 px-6 py-4 sm:px-8"
                >
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mauve-60">
                      {field.label}
                    </p>
                    <p className="text-xs text-night-40">{field.type}</p>
                  </div>
                  <p className={value ? 'text-sm text-night-80' : 'text-sm text-night-40'}>
                    {value ?? '—'}
                  </p>
                </div>
              )
            })}
          </PanelBody>
        </Panel>

        <div className="space-y-6">
          {lead ? (
            <Panel>
              <PanelHeader>
                <h2 className="text-base font-semibold text-night-80">Lead</h2>
              </PanelHeader>
              <PanelBody className="space-y-3">
                {lead.name ? (
                  <Row label="Nom" value={lead.name} />
                ) : null}
                {lead.email ? (
                  <Row label="Email" value={lead.email} highlight />
                ) : null}
                {lead.phone ? (
                  <Row label="Téléphone" value={lead.phone} />
                ) : null}
                {lead.status ? (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mauve-60">
                      Statut
                    </span>
                    <Badge variant="mauve">{lead.status}</Badge>
                  </div>
                ) : null}
              </PanelBody>
            </Panel>
          ) : null}

          <Panel>
            <PanelHeader>
              <h2 className="text-base font-semibold text-night-80">Métadonnées</h2>
            </PanelHeader>
            <PanelBody className="space-y-3">
              <Row label="Session" value={submission.sessionId} mono />
              {submission.completedAt ? (
                <Row
                  label="Complétée"
                  value={new Date(submission.completedAt).toLocaleString()}
                />
              ) : null}
              {(submission.metadata as Record<string, string> | null)?.utmSource ? (
                <Row
                  label="Source UTM"
                  value={(submission.metadata as Record<string, string>).utmSource}
                />
              ) : null}
              {(submission.metadata as Record<string, string> | null)?.utmCampaign ? (
                <Row
                  label="Campagne UTM"
                  value={(submission.metadata as Record<string, string>).utmCampaign}
                />
              ) : null}
              {(submission.metadata as Record<string, string> | null)?.referrer ? (
                <Row
                  label="Référent"
                  value={(submission.metadata as Record<string, string>).referrer}
                />
              ) : null}
            </PanelBody>
          </Panel>
        </div>
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  highlight = false,
  mono = false,
}: {
  label: string
  value: string
  highlight?: boolean
  mono?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-mauve-60">
        {label}
      </span>
      <span
        className={[
          'min-w-0 break-all text-right text-sm',
          highlight ? 'text-everest-green' : 'text-night-80',
          mono ? 'font-mono text-xs' : '',
        ].join(' ')}
      >
        {value}
      </span>
    </div>
  )
}
