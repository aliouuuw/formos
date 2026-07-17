'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { AdminSelect } from '#/components/admin/admin-select'
import { Badge } from '#/components/ui/badge'
import { Button, buttonVariants } from '#/components/ui/button'
import { Label } from '#/components/ui/label'
import { Separator } from '#/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import { Textarea } from '#/components/ui/textarea'
import type { LeadStatus } from '#/lib/form-types'
import { getCampaignById } from '#/lib/campaigns'
import { BULLETIN_FIELD_IDS, isBulletinFormSlug } from '#/lib/ipo-bulletin'
import {
  agingLabel,
  deadlinesForLead,
  duplicateMatchLabel,
  getLeadAging,
  investorProfile,
  securitiesAccount,
} from '#/lib/lead-admin'
import {
  LEAD_PIPELINE_STATUSES,
  LEAD_STATUS_LABELS,
  LEAD_STATUS_VARIANT,
} from '#/lib/lead-status'
import { adviserLabel, formatLeadSource } from '#/lib/leads'
import { cn } from '#/lib/utils'
import { orpc } from '#/orpc/client'

export function LeadDetailPanel({
  leadId,
  agentOptions,
  onClose,
}: {
  leadId: string
  agentOptions: Array<{ value: string; label: string }>
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const detailQuery = useQuery(orpc.leads.get.queryOptions({ input: { id: leadId } }))
  const campaignsQuery = useQuery(orpc.campaigns.list.queryOptions({ input: undefined }))
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const insights = detailQuery.data?.insights as { notes?: string } | null | undefined
    setNotes(insights?.notes ?? '')
  }, [detailQuery.data?.id, detailQuery.data?.insights])

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: orpc.leads.list.key() })
    await queryClient.invalidateQueries({ queryKey: orpc.leads.stats.key() })
    await queryClient.invalidateQueries({ queryKey: orpc.leads.insights.key() })
    await queryClient.invalidateQueries({
      queryKey: orpc.leads.get.key({ input: { id: leadId } }),
    })
  }

  const updateStatusMutation = useMutation(
    orpc.leads.updateStatus.mutationOptions({
      onSuccess: async () => {
        await invalidate()
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
        await invalidate()
        toast.success('Agent assigné')
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Impossible d'assigner l'agent")
      },
    }),
  )

  const updateNotesMutation = useMutation(
    orpc.leads.updateNotes.mutationOptions({
      onSuccess: async () => {
        await invalidate()
        toast.success('Notes enregistrées')
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Impossible d'enregistrer les notes")
      },
    }),
  )

  const generateBulletinPdf = useMutation(
    orpc.submissions.generateBulletinPdf.mutationOptions({
      onSuccess: (data) => {
        const binary = atob(data.base64)
        const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
        const url = URL.createObjectURL(new Blob([bytes], { type: data.contentType }))
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = data.filename
        anchor.click()
        URL.revokeObjectURL(url)
        toast.success('Bulletin PDF téléchargé')
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : 'Échec de la génération PDF')
      },
    }),
  )

  const lead = detailQuery.data
  const insights = lead?.insights as
    | {
        company?: string
        city?: string
        notes?: string
        extras?: Record<string, string>
        duplicateOfLeadId?: string
        duplicateMatch?: 'email' | 'phone'
      }
    | null
    | undefined
  const campaign = lead
    ? getCampaignById(lead.campaignId ?? lead.form.campaignId ?? '')
    : undefined
  const deadlines = lead ? deadlinesForLead(lead, campaignsQuery.data) : undefined
  const aging = lead && deadlines ? getLeadAging(lead, deadlines) : null
  const profile = investorProfile(insights)
  const account = securitiesAccount(insights)
  const duplicateLabel = duplicateMatchLabel(insights)

  const statusOptions = LEAD_PIPELINE_STATUSES.map((status) => ({
    value: status,
    label: LEAD_STATUS_LABELS[status],
  }))

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <SheetHeader className="space-y-3 border-b border-border px-6 py-5 text-left">
          {lead ? (
            <>
              <SheetTitle className="truncate text-xl font-semibold tracking-tight">
                {lead.name ?? lead.email ?? 'Lead anonyme'}
              </SheetTitle>
              <SheetDescription>
                {lead.form.title} · {new Date(lead.createdAt).toLocaleString('fr-FR')}
              </SheetDescription>
              <div className="flex flex-wrap gap-2">
                <Badge variant={LEAD_STATUS_VARIANT[lead.status as LeadStatus] ?? 'outline'}>
                  {LEAD_STATUS_LABELS[lead.status as LeadStatus] ?? lead.status}
                </Badge>
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
                {profile ? (
                  <Badge variant="secondary" className="normal-case tracking-normal">
                    {profile}
                  </Badge>
                ) : null}
              </div>
              {insights?.duplicateOfLeadId ? (
                <p className="text-xs text-muted-foreground">
                  Même contact qu’un lead existant
                  {insights.duplicateMatch === 'email'
                    ? ' (email)'
                    : insights.duplicateMatch === 'phone'
                      ? ' (téléphone)'
                      : ''}
                  . Historique conservé — lead d’origine{' '}
                  <span className="font-mono text-[11px]">{insights.duplicateOfLeadId.slice(0, 8)}…</span>
                </p>
              ) : null}
              {isBulletinFormSlug(lead.form.slug) ? (
                <Button
                  type="button"
                  variant="everest"
                  size="sm"
                  className="self-start"
                  disabled={generateBulletinPdf.isPending}
                  onClick={() =>
                    generateBulletinPdf.mutate({
                      formId: lead.form.id,
                      submissionId: lead.submission.id,
                    })
                  }
                >
                  {generateBulletinPdf.isPending
                    ? 'Génération du PDF…'
                    : 'Télécharger le bulletin PDF'}
                </Button>
              ) : null}
            </>
          ) : (
            <SheetDescription>Chargement…</SheetDescription>
          )}
        </SheetHeader>

        <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
          {detailQuery.isError ? (
            <p className="text-sm text-destructive">Impossible de charger ce lead.</p>
          ) : null}

          {lead ? (
            <>
              {lead.preferredChannel === 'WhatsApp' && lead.phone ? (
                <ContactAction
                  href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                  label="Ouvrir WhatsApp"
                  external
                />
              ) : null}
              {lead.preferredChannel === 'Appel' && lead.phone ? (
                <ContactAction href={`tel:${lead.phone}`} label="Appeler" />
              ) : null}
              {lead.preferredChannel === 'Email' && lead.email ? (
                <ContactAction href={`mailto:${lead.email}`} label="Envoyer un email" />
              ) : null}

              <section className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">Coordonnées</h3>
                <dl className="grid gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
                  <DetailItem label="Email" value={lead.email} />
                  <DetailItem label="Téléphone" value={lead.phone} />
                  <DetailItem label="Ville" value={insights?.city} />
                  <DetailItem label="Entreprise" value={insights?.company} />
                  <DetailItem
                    label="Source"
                    value={formatLeadSource(lead.utmSource, campaign)}
                  />
                  <DetailItem label="Canal préféré" value={lead.preferredChannel} />
                  <DetailItem label="Montant" value={lead.amountRange} />
                  <DetailItem label="Profil" value={profile} />
                  <DetailItem label="Compte titres" value={account} />
                  <DetailItem
                    label="Agent"
                    value={adviserLabel(lead.assignee, {
                      campaignId: lead.campaignId ?? lead.form.campaignId,
                      formSlug: lead.form.slug,
                    })}
                  />
                </dl>
              </section>

              <Separator />

              <section className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Statut</Label>
                  <AdminSelect
                    value={lead.status}
                    onValueChange={(status) =>
                      updateStatusMutation.mutate({
                        id: lead.id,
                        status: status as LeadStatus,
                      })
                    }
                    options={statusOptions}
                    size="default"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Agent assigné</Label>
                  <AdminSelect
                    value={lead.assignee ?? ''}
                    onValueChange={(assignee) =>
                      updateAssigneeMutation.mutate({ id: lead.id, assignee })
                    }
                    options={agentOptions}
                    size="default"
                  />
                </div>
              </section>

              <section className="space-y-2">
                <Label htmlFor="lead-notes">Notes internes</Label>
                <Textarea
                  id="lead-notes"
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Appel du…, documents manquants, prochain rappel…"
                  className="bg-muted/40"
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="everest"
                    disabled={updateNotesMutation.isPending}
                    onClick={() => updateNotesMutation.mutate({ id: lead.id, notes })}
                  >
                    {updateNotesMutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
                  </Button>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">Réponses du formulaire</h3>
                <dl className="divide-y divide-border rounded-xl border border-border">
                  {lead.fields.map((field) => {
                    const raw = lead.answers[field.id]
                    const value =
                      field.id === BULLETIN_FIELD_IDS.signature && raw
                        ? 'Signature enregistrée'
                        : typeof raw === 'string' && raw.length > 0
                          ? raw
                          : '—'
                    return (
                      <div key={field.id} className="px-4 py-3">
                        <dt className="text-xs text-muted-foreground">{field.label}</dt>
                        <dd className="mt-1 text-sm text-foreground">{value}</dd>
                      </div>
                    )
                  })}
                </dl>
              </section>
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function ContactAction({
  href,
  label,
  external,
}: {
  href: string
  label: string
  external?: boolean
}) {
  return (
    <a
      data-ui="button"
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className={buttonVariants({ variant: 'everest', size: 'default' })}
    >
      {label}
    </a>
  )
}

function DetailItem({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn('mt-0.5 text-foreground')}>{value}</dd>
    </div>
  )
}
