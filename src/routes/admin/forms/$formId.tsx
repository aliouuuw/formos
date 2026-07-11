import { Link, createFileRoute, useBlocker } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { FormBuilder } from '#/components/form-builder'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Label } from '#/components/ui/label'
import { Panel, PanelBody } from '#/components/ui/panel'
import { Textarea } from '#/components/ui/textarea'
import { formatAnalyticsEvent } from '#/lib/analytics-labels'
import { formDefinitionSchema, slugify } from '#/lib/form-types'
import {
  describeSlugRedirectTtl,
  getClientSlugRedirectTtlDays,
} from '#/lib/slug-redirect-config.shared'
import type { FormDefinition } from '#/lib/form-types'
import { cn } from '#/lib/utils'
import { orpc } from '#/orpc/client'

export const Route = createFileRoute('/admin/forms/$formId')({ component: FormEditorPage })

type Tab = 'build' | 'results'

function FormEditorPage() {
  const { formId } = Route.useParams()
  const queryClient = useQueryClient()
  const formQuery = useQuery(orpc.forms.getById.queryOptions({ input: { id: formId } }))
  const statsQuery = useQuery(orpc.forms.stats.queryOptions({ input: { id: formId } }))
  const analyticsQuery = useQuery(orpc.analytics.getByForm.queryOptions({ input: { formId } }))

  const [tab, setTab] = useState<Tab>('build')
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [definition, setDefinition] = useState<FormDefinition | null>(null)
  const [definitionJson, setDefinitionJson] = useState('')
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [mode, setMode] = useState<'builder' | 'json'>('builder')
  const [dirty, setDirty] = useState(false)
  const dirtyRef = useRef(false)
  const savedSlugRef = useRef('')

  function markDirty() {
    dirtyRef.current = true
    setDirty(true)
  }

  useEffect(() => {
    if (formQuery.data) {
      setTitle(formQuery.data.title)
      setSlug(formQuery.data.slug)
      setDefinition(formQuery.data.definition)
      setDefinitionJson(JSON.stringify(formQuery.data.definition, null, 2))
      savedSlugRef.current = formQuery.data.slug
      dirtyRef.current = false
      setDirty(false)
    }
  }, [formQuery.data])

  useBlocker({
    shouldBlockFn: () => {
      if (!dirtyRef.current) return false
      return !window.confirm('You have unsaved changes. Leave without saving?')
    },
    enableBeforeUnload: () => dirtyRef.current,
  })

  function switchMode(next: 'builder' | 'json') {
    if (next === mode) return
    if (next === 'json') {
      if (definition) setDefinitionJson(JSON.stringify(definition, null, 2))
      setMode('json')
    } else {
      try {
        const parsed = formDefinitionSchema.parse(JSON.parse(definitionJson))
        setDefinition(parsed)
        setJsonError(null)
        setMode('builder')
      } catch {
        setJsonError('Fix the JSON before switching back to the builder.')
        toast.error('Invalid JSON. Fix it before switching to the builder.')
      }
    }
  }

  const updateMutation = useMutation(
    orpc.forms.update.mutationOptions({
      onSuccess: async (updated) => {
        await queryClient.invalidateQueries({ queryKey: orpc.forms.getById.key({ input: { id: formId } }) })
        await queryClient.invalidateQueries({ queryKey: orpc.forms.list.key() })
        setSlug(updated.slug)
        savedSlugRef.current = updated.slug
        dirtyRef.current = false
        setDirty(false)
        toast.success('Changes saved')
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : 'Failed to save changes')
      },
    }),
  )

  const publishMutation = useMutation(
    orpc.forms.publish.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: orpc.forms.getById.key({ input: { id: formId } }) })
        await queryClient.invalidateQueries({ queryKey: orpc.forms.list.key() })
        toast.success('Form published')
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : 'Failed to publish form')
      },
    }),
  )

  function handleSave() {
    let toSave: FormDefinition

    if (mode === 'json') {
      try {
        toSave = formDefinitionSchema.parse(JSON.parse(definitionJson))
        setJsonError(null)
      } catch {
        setJsonError('Definition must be valid JSON matching the form schema.')
        return
      }
    } else {
      if (!definition) return
      const result = formDefinitionSchema.safeParse(definition)
      if (!result.success) {
        toast.error(result.error.issues[0]?.message ?? 'Invalid form definition')
        return
      }
      toSave = result.data
    }

    updateMutation.mutate({ id: formId, title, slug, definition: toSave })
  }

  if (formQuery.isLoading) {
    return <p className="text-sm text-night-60">Chargement du formulaire…</p>
  }

  if (!formQuery.data) {
    return <p className="text-sm text-red-700">Formulaire introuvable.</p>
  }

  const form = formQuery.data
  const published = form.status === 'published'
  const normalizedSlug = slugify(slug)
  const slugChanged = normalizedSlug !== savedSlugRef.current
  const slugRedirectTtlDays = getClientSlugRedirectTtlDays()

  return (
    <div className="space-y-8">
      {/* Editor top bar */}
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <Link
            to="/admin"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-night-60 transition-colors duration-150 hover:bg-mauve-05 hover:text-mauve"
            aria-label="Back to forms"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>

          <div className="min-w-0 flex-1">
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                markDirty()
              }}
              placeholder="Untitled form"
              aria-label="Form title"
              className="w-full max-w-xl truncate rounded-lg border border-transparent bg-transparent px-2 py-1 text-2xl font-semibold tracking-tight text-night-80 transition-colors duration-150 hover:border-mauve-10 focus:border-mauve/30 focus:outline-none"
            />
            <div className="mt-0.5 flex items-center gap-2 px-2">
              <Badge variant={published ? 'everest' : 'mauve'}>{form.status}</Badge>
              <span className="flex items-center font-mono text-xs text-night-60">
                /f/
                <input
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value)
                    markDirty()
                  }}
                  aria-label="Form slug"
                  size={Math.max(slug.length, 4)}
                  className={cn(
                    'rounded border bg-transparent px-0.5 font-mono text-xs text-everest-green transition-colors duration-150 hover:border-border-subtle focus:border-mauve/30 focus:outline-none',
                    published && slugChanged
                      ? 'border-gold-20 bg-gold-10/40'
                      : 'border-transparent',
                  )}
                />
              </span>
            </div>
            {published && slugChanged ? (
              <p className="mt-2 rounded-xl border border-gold-20 bg-gold-10/50 px-3 py-2 text-xs leading-relaxed text-night-80">
                <span className="font-medium text-night-80">Slug change on a live form.</span>{' '}
                After you save,{' '}
                <span className="font-mono text-everest-green">/f/{savedSlugRef.current}</span> will
                keep working {describeSlugRedirectTtl(slugRedirectTtlDays)} and show this form.
                New visitors should use{' '}
                <span className="font-mono text-everest-green">/f/{normalizedSlug}</span>.
                {slugRedirectTtlDays > 0 ? (
                  <>
                    {' '}
                    Set <span className="font-mono">SLUG_REDIRECT_TTL_DAYS=0</span> for permanent
                    redirects.
                  </>
                ) : null}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            {dirty || updateMutation.isPending ? (
              <Button
                variant="everest"
                size="sm"
                onClick={handleSave}
                disabled={updateMutation.isPending}
              >
                <span className="mr-0.5 h-1.5 w-1.5 rounded-full bg-gold" aria-hidden />
                {updateMutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
            ) : (
              <span className="inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-medium text-everest-green">
                <span className="h-1.5 w-1.5 rounded-full bg-everest-green" aria-hidden />
                Enregistré
              </span>
            )}
            {published ? (
              dirty ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => toast.message("Enregistrez vos modifications avant d'ouvrir le formulaire en ligne.")}
                >
                  Voir en ligne ↗
                </Button>
              ) : (
                <Link to="/f/$slug" params={{ slug }} target="_blank">
                  <Button variant="secondary" size="sm">
                    Voir en ligne ↗
                  </Button>
                </Link>
              )
            ) : (
              <Button
                variant="mauve"
                size="sm"
                onClick={() => publishMutation.mutate({ id: formId })}
                disabled={publishMutation.isPending}
              >
                {publishMutation.isPending ? 'Publication…' : 'Publier'}
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <nav className="flex items-center gap-6 border-b border-border-subtle" aria-label="Sections de l'éditeur">
          {(
            [
              { id: 'build', label: 'Éditeur' },
              { id: 'results', label: 'Résultats' },
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                '-mb-px border-b-2 pb-2.5 text-sm font-medium transition-colors duration-150',
                tab === id
                  ? 'border-mauve text-night-80'
                  : 'border-transparent text-night-60 hover:text-night-80',
              )}
            >
              {label}
            </button>
          ))}
          {tab === 'build' ? (
            <button
              type="button"
              onClick={() => switchMode(mode === 'builder' ? 'json' : 'builder')}
              className="-mb-px ml-auto pb-2.5 font-mono text-xs text-night-60 transition-colors duration-150 hover:text-mauve"
            >
              {mode === 'builder' ? '{ } Modifier le JSON' : "← Retour à l'éditeur"}
            </button>
          ) : null}
        </nav>
      </header>

      {/* Build tab */}
      {tab === 'build' ? (
        mode === 'builder' && definition ? (
          <FormBuilder
            definition={definition}
            previewTitle={title.trim() || 'Preview'}
            onChange={(next) => {
              setDefinition(next)
              markDirty()
            }}
          />
        ) : (
          <div className="max-w-3xl space-y-2">
            <Label htmlFor="definition">Definition JSON</Label>
            <Textarea
              id="definition"
              value={definitionJson}
              onChange={(e) => {
                setDefinitionJson(e.target.value)
                markDirty()
              }}
              rows={24}
              className="font-mono text-xs"
            />
            {jsonError ? <p className="text-sm text-red-700">{jsonError}</p> : null}
          </div>
        )
      ) : null}

      {/* Results tab */}
      {tab === 'results' ? (
        <div className="max-w-3xl space-y-10">
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {(
              [
                { label: 'Vues', value: statsQuery.data?.views ?? 0 },
                { label: 'Démarrages', value: statsQuery.data?.starts ?? 0 },
                { label: 'Complétions', value: statsQuery.data?.completions ?? 0 },
                { label: 'Taux de complétion', value: `${statsQuery.data?.completionRate ?? 0}%` },
              ] as const
            ).map(({ label, value }) => (
              <div key={label} className="rounded-2xl border border-border-subtle bg-white p-5">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-label">
                  {label}
                </dt>
                <dd className="mt-2 text-2xl font-semibold tabular-nums text-night-80">{value}</dd>
              </div>
            ))}
          </dl>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-text-label">
                Entonnoir
              </h2>
              <Link to="/admin/forms/$formId/submissions" params={{ formId }}>
                <Button variant="outline" size="sm">
                  Parcourir les soumissions →
                </Button>
              </Link>
            </div>

            {analyticsQuery.data?.funnel.length ? (
              <Panel>
                <PanelBody className="divide-y divide-mauve/10 p-0">
                  {analyticsQuery.data.funnel.map((row) => (
                    <div key={row.eventType} className="flex items-center justify-between px-6 py-3 text-sm sm:px-8">
                      <span className="text-night-80">{formatAnalyticsEvent(row.eventType)}</span>
                      <span className="font-semibold tabular-nums text-night-80">{row.count}</span>
                    </div>
                  ))}
                </PanelBody>
              </Panel>
            ) : (
              <p className="rounded-2xl border border-dashed border-mauve/20 bg-mauve-05 py-8 text-center text-sm text-night-60">
                Pas encore d'activité. {published ? 'Partagez' : 'Publiez le formulaire et partagez'}{' '}
                <span className="font-mono text-everest-green">/f/{form.slug}</span> pour commencer à
                collecter des données.
              </p>
            )}
          </section>
        </div>
      ) : null}
    </div>
  )
}
