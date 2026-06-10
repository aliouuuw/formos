import { Link, createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
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
    }),
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[Fraunces] text-4xl font-bold">Forms</h1>
        <p className="mt-2 text-[var(--sea-ink-soft)]">
          Create, publish, and monitor internal lead capture forms.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New form</CardTitle>
          <CardDescription>Start with a default email capture flow.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Mortgage inquiry"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Button
            onClick={() => createMutation.mutate({ title })}
            disabled={!title.trim() || createMutation.isPending}
          >
            Create form
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {formsQuery.data?.map((form) => (
          <Card key={form.id}>
            <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">{form.title}</h2>
                  <Badge variant={form.status === 'published' ? 'success' : 'secondary'}>
                    {form.status}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">/f/{form.slug}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to="/admin/forms/$formId" params={{ formId: form.id }}>
                  <Button variant="outline">Edit</Button>
                </Link>
                {form.status === 'published' ? (
                  <Link to="/f/$slug" params={{ slug: form.slug }} target="_blank">
                    <Button variant="secondary">Open public form</Button>
                  </Link>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
        {formsQuery.isLoading ? (
          <p className="text-sm text-[var(--sea-ink-soft)]">Loading forms...</p>
        ) : null}
        {formsQuery.data?.length === 0 && !formsQuery.isLoading ? (
          <p className="text-sm text-[var(--sea-ink-soft)]">No forms yet. Create your first one.</p>
        ) : null}
      </div>
    </div>
  )
}
