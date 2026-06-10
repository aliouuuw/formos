import { Link, createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { FormBuilder } from '#/components/form-builder'
import { PageHeader } from '#/components/page-header'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Panel, PanelBody, PanelHeader } from '#/components/ui/panel'
import { Textarea } from '#/components/ui/textarea'
import { formDefinitionSchema } from '#/lib/form-types'
import type { FormDefinition } from '#/lib/form-types'
import { orpc } from '#/orpc/client'

export const Route = createFileRoute('/admin/forms/$formId')({ component: FormEditorPage })

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-[7rem] flex-1 border-r border-mauve-10 px-5 py-4 last:border-r-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mauve-60">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-night-80">{value}</p>
    </div>
  )
}

function FormEditorPage() {
  const { formId } = Route.useParams()
  const queryClient = useQueryClient()
  const formQuery = useQuery(orpc.forms.getById.queryOptions({ input: { id: formId } }))
  const statsQuery = useQuery(orpc.forms.stats.queryOptions({ input: { id: formId } }))
  const analyticsQuery = useQuery(
    orpc.analytics.getByForm.queryOptions({ input: { formId } }),
  )

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [definition, setDefinition] = useState<FormDefinition | null>(null)
  const [definitionJson, setDefinitionJson] = useState('')
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [mode, setMode] = useState<'builder' | 'json'>('builder')
  const isDirtyRef = useRef(false)

  useEffect(() => {
    if (formQuery.data) {
      setTitle(formQuery.data.title)
      setSlug(formQuery.data.slug)
      setDefinition(formQuery.data.definition)
      setDefinitionJson(JSON.stringify(formQuery.data.definition, null, 2))
      isDirtyRef.current = false
    }
  }, [formQuery.data])

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
        toast.error('Invalid JSON — fix it before switching to the builder.')
      }
    }
  }

  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (!isDirtyRef.current) return
      e.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  const updateMutation = useMutation(
    orpc.forms.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: orpc.forms.getById.key({ input: { id: formId } }) })
        await queryClient.invalidateQueries({ queryKey: orpc.forms.list.key() })
        isDirtyRef.current = false
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

  async function handleSave() {
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
    return <p className="text-sm text-night-60">Loading form...</p>
  }

  if (!formQuery.data) {
    return <p className="text-sm text-red-700">Form not found.</p>
  }

  return (
    <div className="space-y-10">
      <PageHeader
        kicker="Editor"
        title={formQuery.data.title}
        badge={
          <Badge variant={formQuery.data.status === 'published' ? 'everest' : 'mauve'}>
            {formQuery.data.status}
          </Badge>
        }
        description={`Public URL: /f/${formQuery.data.slug}`}
        actions={
          <>
            <Link to="/admin/forms/$formId/submissions" params={{ formId }}>
              <Button variant="ghost" size="sm">
                Submissions
              </Button>
            </Link>
            <Button variant="outline" onClick={() => void handleSave()} disabled={updateMutation.isPending}>
              Save changes
            </Button>
            {formQuery.data.status !== 'published' ? (
              <Button
                variant="mauve"
                showArrow
                onClick={() => publishMutation.mutate({ id: formId })}
                disabled={publishMutation.isPending}
              >
                Publish
              </Button>
            ) : (
              <Link to="/f/$slug" params={{ slug: formQuery.data.slug }} target="_blank">
                <Button variant="secondary">Preview live</Button>
              </Link>
            )}
          </>
        }
      />

      <Panel>
        <PanelBody className="flex flex-col overflow-hidden p-0 sm:flex-row">
          <StatItem label="Views" value={statsQuery.data?.views ?? 0} />
          <StatItem label="Starts" value={statsQuery.data?.starts ?? 0} />
          <StatItem label="Completions" value={statsQuery.data?.completions ?? 0} />
          <StatItem label="Rate" value={`${statsQuery.data?.completionRate ?? 0}%`} />
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader>
          <h2 className="text-base font-semibold text-night-80">Form settings</h2>
        </PanelHeader>
        <PanelBody>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => { setTitle(e.target.value); isDirtyRef.current = true }} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" value={slug} onChange={(e) => { setSlug(e.target.value); isDirtyRef.current = true }} />
            </div>
          </div>
        </PanelBody>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={mode === 'builder' ? 'mauve' : 'ghost'}
              onClick={() => switchMode('builder')}
            >
              Builder
            </Button>
            <Button
              size="sm"
              variant={mode === 'json' ? 'mauve' : 'ghost'}
              onClick={() => switchMode('json')}
            >
              JSON
            </Button>
          </div>

          {mode === 'builder' && definition ? (
            <FormBuilder
              definition={definition}
              onChange={(next) => {
                setDefinition(next)
                isDirtyRef.current = true
              }}
            />
          ) : (
            <Panel>
              <PanelBody className="space-y-2">
                <Label htmlFor="definition">Definition JSON</Label>
                <Textarea
                  id="definition"
                  value={definitionJson}
                  onChange={(e) => { setDefinitionJson(e.target.value); isDirtyRef.current = true }}
                  rows={24}
                  className="font-mono text-xs"
                />
                {jsonError ? <p className="text-sm text-red-700">{jsonError}</p> : null}
              </PanelBody>
            </Panel>
          )}
        </div>

        <Panel>
          <PanelHeader>
            <h2 className="text-base font-semibold text-night-80">Funnel events</h2>
            <p className="mt-1 text-sm text-night-60">Counts grouped by analytics event type.</p>
          </PanelHeader>
          <PanelBody className="space-y-0 p-0">
            {analyticsQuery.data?.funnel.map((row) => (
              <div
                key={row.eventType}
                className="flex items-center justify-between border-b border-mauve-10 px-6 py-3 text-sm last:border-b-0 sm:px-8"
              >
                <span className="text-night-60">{row.eventType}</span>
                <span className="font-semibold tabular-nums text-mauve">{row.count}</span>
              </div>
            ))}
            {analyticsQuery.data?.funnel.length === 0 ? (
              <p className="px-6 py-8 text-sm text-night-60 sm:px-8">No analytics events yet.</p>
            ) : null}
          </PanelBody>
        </Panel>
      </div>
    </div>
  )
}
