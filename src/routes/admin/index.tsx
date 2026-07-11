import { Link, createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import { EmptyState } from '#/components/empty-state'
import { PageHeader } from '#/components/page-header'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Panel, PanelBody, PanelHeader } from '#/components/ui/panel'
import { orpc } from '#/orpc/client'

export const Route = createFileRoute('/admin/')({ component: AdminDashboard })

function AdminDashboard() {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const formsQuery = useQuery(orpc.forms.list.queryOptions({ input: {} }))

  const createMutation = useMutation(
    orpc.forms.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: orpc.forms.list.key() })
        setTitle('')
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : 'Impossible de créer le formulaire')
      },
    }),
  )

  return (
    <div className="space-y-10">
      <PageHeader
        kicker="Espace de travail"
        title="Formulaires"
        description="Créez des parcours, publiez-les sur /f/slug et suivez les résultats."
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
          />
          <Button
            variant="mauve"
            showArrow
            onClick={() => createMutation.mutate({ title })}
            disabled={!title.trim() || createMutation.isPending}
          >
            Créer
          </Button>
        </PanelBody>
      </Panel>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-text-label">
            Vos formulaires
          </h2>
          {formsQuery.data ? (
            <span className="text-xs text-night-60">{formsQuery.data.length} au total</span>
          ) : null}
        </div>

        {formsQuery.isLoading ? (
          <Panel>
            <PanelBody className="py-10 text-sm text-night-60">Chargement des formulaires…</PanelBody>
          </Panel>
        ) : null}

        {formsQuery.data?.length === 0 && !formsQuery.isLoading ? (
          <EmptyState
            title="Aucun formulaire"
            description="Créez votre premier formulaire ci-dessus. Publiez-le quand vous êtes prêt à partager /f/slug."
          />
        ) : null}

        <div className="space-y-3">
          {formsQuery.data?.map((form) => (
            <Panel key={form.id}>
              <PanelBody className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-lg font-semibold text-night-80">{form.title}</h3>
                    <Badge variant={form.status === 'published' ? 'everest' : 'mauve'}>
                      {form.status === 'published' ? 'Publié' : 'Brouillon'}
                    </Badge>
                  </div>
                  <p className="mt-1 font-mono text-sm text-everest-green">/f/{form.slug}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link to="/admin/forms/$formId" params={{ formId: form.id }}>
                    <Button variant="outline" size="sm">
                      Modifier
                    </Button>
                  </Link>
                  {form.status === 'published' ? (
                    <Link to="/f/$slug" params={{ slug: form.slug }} target="_blank">
                      <Button variant="secondary" size="sm">
                        Voir le formulaire
                      </Button>
                    </Link>
                  ) : null}
                </div>
              </PanelBody>
            </Panel>
          ))}
        </div>
      </div>
    </div>
  )
}
