import { Link, createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import type { FormDefinition } from '#/lib/form-types'
import { orpc } from '#/orpc/client'

export const Route = createFileRoute('/admin/forms/$formId')({ component: FormEditorPage })

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
  const [definitionJson, setDefinitionJson] = useState('')

  useEffect(() => {
    if (formQuery.data) {
      setTitle(formQuery.data.title)
      setSlug(formQuery.data.slug)
      setDefinitionJson(JSON.stringify(formQuery.data.definition, null, 2))
    }
  }, [formQuery.data])

  const updateMutation = useMutation(
    orpc.forms.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: orpc.forms.getById.key({ input: { id: formId } }) })
        await queryClient.invalidateQueries({ queryKey: orpc.forms.list.key() })
      },
    }),
  )

  const publishMutation = useMutation(
    orpc.forms.publish.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: orpc.forms.getById.key({ input: { id: formId } }) })
        await queryClient.invalidateQueries({ queryKey: orpc.forms.list.key() })
      },
    }),
  )

  async function handleSave() {
    let definition: FormDefinition
    try {
      definition = JSON.parse(definitionJson) as FormDefinition
    } catch {
      alert('Invalid JSON definition')
      return
    }

    updateMutation.mutate({
      id: formId,
      title,
      slug,
      definition,
    })
  }

  if (formQuery.isLoading) {
    return <p className="text-sm text-[var(--sea-ink-soft)]">Loading form...</p>
  }

  if (!formQuery.data) {
    return <p className="text-sm text-red-600">Form not found.</p>
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-[Fraunces] text-4xl font-bold">{formQuery.data.title}</h1>
            <Badge variant={formQuery.data.status === 'published' ? 'success' : 'secondary'}>
              {formQuery.data.status}
            </Badge>
          </div>
          <p className="mt-2 text-[var(--sea-ink-soft)]">Public URL: /f/{formQuery.data.slug}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void handleSave()} disabled={updateMutation.isPending}>
            Save
          </Button>
          {formQuery.data.status !== 'published' ? (
            <Button onClick={() => publishMutation.mutate({ id: formId })} disabled={publishMutation.isPending}>
              Publish
            </Button>
          ) : (
            <Link to="/f/$slug" params={{ slug: formQuery.data.slug }} target="_blank">
              <Button variant="secondary">Preview live</Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Views</CardDescription>
            <CardTitle>{statsQuery.data?.views ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Starts</CardDescription>
            <CardTitle>{statsQuery.data?.starts ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Completions</CardDescription>
            <CardTitle>{statsQuery.data?.completions ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Completion rate</CardDescription>
            <CardTitle>{statsQuery.data?.completionRate ?? 0}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="definition">Definition JSON</Label>
            <Textarea
              id="definition"
              value={definitionJson}
              onChange={(e) => setDefinitionJson(e.target.value)}
              rows={18}
              className="font-mono text-xs"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Analytics funnel</CardTitle>
          <CardDescription>Event counts grouped by type.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {analyticsQuery.data?.funnel.map((row) => (
            <div key={row.eventType} className="flex items-center justify-between text-sm">
              <span>{row.eventType}</span>
              <span className="font-semibold">{row.count}</span>
            </div>
          ))}
          {analyticsQuery.data?.funnel.length === 0 ? (
            <p className="text-sm text-[var(--sea-ink-soft)]">No analytics events yet.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
