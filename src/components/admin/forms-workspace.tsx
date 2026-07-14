'use client'

import { Link } from '@tanstack/react-router'
import { Archive, ExternalLink, MoreHorizontal, Pencil, RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '#/components/ui/alert-dialog'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { Panel } from '#/components/ui/panel'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group'
import type { FormStatus } from '#/lib/form-types'
import { FORM_STATUS_LABELS, FORM_STATUS_VARIANTS } from '#/lib/form-status'
import { cn } from '#/lib/utils'

export type FormListItem = {
  id: string
  title: string
  slug: string
  status: string
  updatedAt: Date | string
  publishedAt?: Date | string | null
}

type FormView = 'active' | 'archived'

type PendingAction =
  | { type: 'archive'; form: FormListItem }
  | { type: 'restore'; form: FormListItem }
  | { type: 'delete'; form: FormListItem; force?: boolean }

export function FormsSummaryBar({
  total,
  published,
  draft,
  archived,
}: {
  total: number
  published: number
  draft: number
  archived: number
}) {
  return (
    <div className="flex flex-wrap items-stretch divide-x divide-everest-green/10 overflow-hidden rounded-2xl border border-everest-green/10 bg-card shadow-[0_8px_24px_rgba(1,45,42,0.06)]">
      <SummaryMetric label="Total" value={String(total)} />
      <SummaryMetric label="Publiés" value={String(published)} tone={published > 0 ? 'gold' : 'default'} />
      <SummaryMetric label="Brouillons" value={String(draft)} tone={draft > 0 ? 'mauve' : 'default'} />
      <SummaryMetric label="Archivés" value={String(archived)} muted={archived > 0} />
    </div>
  )
}

function SummaryMetric({
  label,
  value,
  tone = 'default',
  muted,
}: {
  label: string
  value: string
  tone?: 'default' | 'gold' | 'mauve'
  muted?: boolean
}) {
  return (
    <div className="min-w-22 flex-1 px-4 py-3.5 sm:px-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-everest-green/55">
        {label}
      </p>
      <p
        className={cn(
          'mt-1.5 text-lg font-semibold tabular-nums tracking-tight',
          muted && 'text-everest-green/45',
          !muted && tone === 'gold' && 'text-gold-cta',
          !muted && tone === 'mauve' && 'text-mauve',
          !muted && tone === 'default' && 'text-night-80',
        )}
      >
        {value}
      </p>
    </div>
  )
}

export function FormsListPanel({
  forms,
  view,
  onViewChange,
  isLoading,
  onArchive,
  onRestore,
  onDelete,
  pendingId,
  forceDeleteTarget,
  onConfirmForceDelete,
  onCancelForceDelete,
}: {
  forms: FormListItem[]
  view: FormView
  onViewChange: (view: FormView) => void
  isLoading?: boolean
  onArchive: (form: FormListItem) => void
  onRestore: (form: FormListItem) => void
  onDelete: (form: FormListItem, force?: boolean) => void
  pendingId?: string | null
  forceDeleteTarget?: FormListItem | null
  onConfirmForceDelete?: () => void
  onCancelForceDelete?: () => void
}) {
  const [pending, setPending] = useState<PendingAction | null>(null)

  const closeDialog = () => setPending(null)

  const confirm = () => {
    if (!pending) return
    if (pending.type === 'archive') onArchive(pending.form)
    if (pending.type === 'restore') onRestore(pending.form)
    if (pending.type === 'delete') onDelete(pending.form, pending.force)
    closeDialog()
  }

  return (
    <>
      <Panel className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-everest-green/10 bg-everest-green/[0.03] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(value) => value && onViewChange(value as FormView)}
            variant="outline"
            className="inline-flex gap-1 rounded-full border border-everest-green/15 bg-white/80 p-1"
          >
            <ToggleGroupItem
              value="active"
              className="rounded-full border-0 px-3.5 text-xs text-everest-green/70 shadow-none sm:text-sm data-[state=on]:bg-everest-green data-[state=on]:text-white"
            >
              Actifs
            </ToggleGroupItem>
            <ToggleGroupItem
              value="archived"
              className="rounded-full border-0 px-3.5 text-xs text-everest-green/70 shadow-none sm:text-sm data-[state=on]:bg-everest-green data-[state=on]:text-white"
            >
              Archivés
            </ToggleGroupItem>
          </ToggleGroup>
          <p className="text-xs text-everest-green/55">
            {isLoading ? 'Chargement…' : `${forms.length} formulaire(s)`}
          </p>
        </div>

        {isLoading ? (
          <div className="px-6 py-12 text-sm text-muted-foreground">Chargement des formulaires…</div>
        ) : forms.length === 0 ? (
          <div className="px-6 py-12 text-sm text-muted-foreground">
            {view === 'archived'
              ? 'Aucun formulaire archivé.'
              : 'Aucun formulaire actif. Créez-en un ci-dessus.'}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4 sm:px-6">Formulaire</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Dernière màj</TableHead>
                <TableHead className="px-4 text-right sm:px-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forms.map((form) => {
                const status = form.status as FormStatus
                const isArchived = status === 'archived'
                const isPending = pendingId === form.id

                return (
                  <TableRow key={form.id}>
                    <TableCell className="px-4 align-top sm:px-6">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">{form.title}</p>
                        <p className="mt-0.5 font-mono text-xs text-everest-green">/f/{form.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <Badge
                        variant={FORM_STATUS_VARIANTS[status] ?? 'outline'}
                        className="normal-case tracking-normal"
                      >
                        {FORM_STATUS_LABELS[status] ?? form.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="align-top text-sm text-muted-foreground">
                      {new Date(form.updatedAt).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell className="px-4 align-top text-right sm:px-6">
                      <div className="flex items-center justify-end gap-2">
                        <Link to="/admin/forms/$formId" params={{ formId: form.id }}>
                          <Button variant="everest" size="sm">
                            {isArchived ? 'Consulter' : 'Modifier'}
                          </Button>
                        </Link>
                        <FormActionsMenu
                          form={form}
                          disabled={isPending}
                          onArchive={() => setPending({ type: 'archive', form })}
                          onRestore={() => setPending({ type: 'restore', form })}
                          onDelete={() => setPending({ type: 'delete', form })}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Panel>

      <AlertDialog open={Boolean(pending)} onOpenChange={(open) => !open && closeDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending?.type === 'archive'
                ? 'Archiver ce formulaire ?'
                : pending?.type === 'restore'
                  ? 'Restaurer ce formulaire ?'
                  : pending?.force
                    ? 'Supprimer définitivement ?'
                    : 'Supprimer ce formulaire ?'}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                {pending?.type === 'archive' ? (
                  <>
                    <p>
                      <span className="font-medium text-foreground">{pending.form.title}</span> ne
                      sera plus accessible sur{' '}
                      <span className="font-mono text-everest-green">/f/{pending.form.slug}</span>.
                      Les réponses et leads existants sont conservés.
                    </p>
                  </>
                ) : null}
                {pending?.type === 'restore' ? (
                  <p>
                    Le formulaire repassera en brouillon. Vous pourrez le modifier et le republier.
                  </p>
                ) : null}
                {pending?.type === 'delete' ? (
                  <>
                    <p>
                      {pending.force
                        ? 'Toutes les réponses, leads et statistiques liés seront supprimés de façon irréversible.'
                        : 'La suppression est réservée aux formulaires sans réponses. Sinon, archivez-le.'}
                    </p>
                    {!pending.force ? (
                      <p className="text-xs">
                        Si le formulaire contient des données, une confirmation supplémentaire vous
                        sera demandée.
                      </p>
                    ) : null}
                  </>
                ) : null}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(pendingId)}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirm}
              disabled={Boolean(pendingId)}
              className={cn(
                pending?.type === 'delete' &&
                  'bg-destructive hover:bg-destructive/90 focus-visible:shadow-[0_0_0_3px_rgba(220,38,38,0.2)]',
                pending?.type === 'restore' &&
                  'bg-mauve hover:bg-[#3a183f] focus-visible:shadow-[0_0_0_3px_var(--mauve-10),0_0_0_1px_var(--mauve)]',
              )}
            >
              {pending?.type === 'archive'
                ? 'Archiver'
                : pending?.type === 'restore'
                  ? 'Restaurer'
                  : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(forceDeleteTarget)}
        onOpenChange={(open) => !open && onCancelForceDelete?.()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer avec les données ?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">{forceDeleteTarget?.title}</span>{' '}
              contient des réponses ou des leads. Cette action supprime définitivement toutes les
              données associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(pendingId)}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={Boolean(pendingId)}
              onClick={onConfirmForceDelete}
              className="bg-destructive hover:bg-destructive/90 focus-visible:shadow-[0_0_0_3px_rgba(220,38,38,0.2)]"
            >
              Supprimer tout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function FormActionsMenu({
  form,
  disabled,
  onArchive,
  onRestore,
  onDelete,
}: {
  form: FormListItem
  disabled?: boolean
  onArchive: () => void
  onRestore: () => void
  onDelete: () => void
}) {
  const isArchived = form.status === 'archived'
  const isPublished = form.status === 'published'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 w-9 p-0" disabled={disabled}>
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link to="/admin/forms/$formId" params={{ formId: form.id }} className="cursor-pointer">
            <Pencil className="size-4" />
            {isArchived ? 'Consulter' : 'Modifier'}
          </Link>
        </DropdownMenuItem>
        {isPublished ? (
          <DropdownMenuItem asChild>
            <Link
              to="/f/$slug"
              params={{ slug: form.slug }}
              target="_blank"
              className="cursor-pointer"
            >
              <ExternalLink className="size-4" />
              Voir en ligne
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        {isArchived ? (
          <DropdownMenuItem onClick={onRestore}>
            <RotateCcw className="size-4" />
            Restaurer
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={onArchive}>
            <Archive className="size-4" />
            Archiver
          </DropdownMenuItem>
        )}
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <Trash2 className="size-4" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export type { FormView }
