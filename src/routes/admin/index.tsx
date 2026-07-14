import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import {
  FormsListPanel,
  FormsSummaryBar,
  type FormListItem,
  type FormView,
} from '#/components/admin/forms-workspace'
import { EmptyState } from '#/components/empty-state'
import { PageHeader } from '#/components/page-header'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Panel, PanelBody, PanelHeader } from '#/components/ui/panel'
import { orpc } from '#/orpc/client'

export const Route = createFileRoute('/admin/')({ component: AdminDashboard })

function AdminDashboard() {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [view, setView] = useState<FormView>('active')
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [forceDeleteTarget, setForceDeleteTarget] = useState<FormListItem | null>(null)

  const formsQuery = useQuery(
    orpc.forms.list.queryOptions({ input: { view: 'all' } }),
  )

  const allForms = formsQuery.data ?? []

  const counts = useMemo(() => {
    let published = 0
    let draft = 0
    let archived = 0
    for (const form of allForms) {
      if (form.status === 'published') published += 1
      else if (form.status === 'archived') archived += 1
      else draft += 1
    }
    return { published, draft, archived, total: allForms.length }
  }, [allForms])

  const visibleForms = useMemo(() => {
    if (view === 'archived') {
      return allForms.filter((form) => form.status === 'archived')
    }
    return allForms.filter((form) => form.status !== 'archived')
  }, [allForms, view])

  const invalidateForms = async () => {
    await queryClient.invalidateQueries({ queryKey: orpc.forms.list.key() })
  }

  const createMutation = useMutation(
    orpc.forms.create.mutationOptions({
      onSuccess: async () => {
        await invalidateForms()
        setTitle('')
        toast.success('Formulaire créé')
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : 'Impossible de créer le formulaire')
      },
    }),
  )

  const archiveMutation = useMutation(
    orpc.forms.archive.mutationOptions({
      onSuccess: async () => {
        await invalidateForms()
        toast.success('Formulaire archivé')
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : 'Archivage impossible')
      },
      onSettled: () => setPendingId(null),
    }),
  )

  const restoreMutation = useMutation(
    orpc.forms.restore.mutationOptions({
      onSuccess: async () => {
        await invalidateForms()
        setView('active')
        toast.success('Formulaire restauré en brouillon')
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : 'Restauration impossible')
      },
      onSettled: () => setPendingId(null),
    }),
  )

  const deleteMutation = useMutation(
    orpc.forms.delete.mutationOptions({
      onSuccess: async () => {
        await invalidateForms()
        setForceDeleteTarget(null)
        toast.success('Formulaire supprimé')
      },
      onError: (err) => {
        const message = err instanceof Error ? err.message : 'Suppression impossible'
        toast.error(message)
      },
      onSettled: () => setPendingId(null),
    }),
  )

  async function handleArchive(form: FormListItem) {
    setPendingId(form.id)
    await archiveMutation.mutateAsync({ id: form.id })
  }

  async function handleRestore(form: FormListItem) {
    setPendingId(form.id)
    await restoreMutation.mutateAsync({ id: form.id })
  }

  async function handleDelete(form: FormListItem, force?: boolean) {
    setPendingId(form.id)
    try {
      await deleteMutation.mutateAsync({ id: form.id, force })
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      if (!force && /réponse|lead/i.test(message)) {
        setForceDeleteTarget(form)
      }
    }
  }

  async function handleConfirmForceDelete() {
    if (!forceDeleteTarget) return
    await handleDelete(forceDeleteTarget, true)
  }

  const showEmptyWorkspace =
    !formsQuery.isLoading && counts.total === 0 && view === 'active'

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Espace de travail"
        title="Formulaires"
        description="Créez des parcours, publiez-les sur /f/slug, archivez ou supprimez ceux qui ne sont plus utilisés."
      />

      <Panel>
        <PanelHeader>
          <h2 className="text-base font-semibold text-night-80">Nouveau formulaire</h2>
          <p className="mt-1 text-sm text-night-60">Commence avec une étape de capture email.</p>
        </PanelHeader>
        <PanelBody className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            placeholder="Demande de prêt immobilier"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="sm:flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && title.trim()) {
                createMutation.mutate({ title: title.trim() })
              }
            }}
          />
          <Button
            variant="mauve"
            showArrow
            onClick={() => createMutation.mutate({ title: title.trim() })}
            disabled={!title.trim() || createMutation.isPending}
          >
            Créer
          </Button>
        </PanelBody>
      </Panel>

      {counts.total > 0 ? (
        <FormsSummaryBar
          total={counts.total}
          published={counts.published}
          draft={counts.draft}
          archived={counts.archived}
        />
      ) : null}

      {showEmptyWorkspace ? (
        <EmptyState
          title="Aucun formulaire"
          description="Créez votre premier formulaire ci-dessus. Publiez-le quand vous êtes prêt à partager /f/slug."
        />
      ) : (
        <FormsListPanel
          forms={visibleForms}
          view={view}
          onViewChange={setView}
          isLoading={formsQuery.isLoading}
          pendingId={pendingId}
          onArchive={(form) => void handleArchive(form)}
          onRestore={(form) => void handleRestore(form)}
          onDelete={(form, force) => void handleDelete(form, force)}
          forceDeleteTarget={forceDeleteTarget}
          onConfirmForceDelete={() => void handleConfirmForceDelete()}
          onCancelForceDelete={() => setForceDeleteTarget(null)}
        />
      )}
    </div>
  )
}
