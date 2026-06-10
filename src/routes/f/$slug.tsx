import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

import { FormRenderer } from '#/components/form-renderer'
import { orpc } from '#/orpc/client'

export const Route = createFileRoute('/f/$slug')({ component: PublicFormPage })

function PublicFormPage() {
  const { slug } = Route.useParams()
  const formQuery = useQuery(orpc.forms.getBySlug.queryOptions({ input: { slug } }))

  if (formQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-base)]">
        <p className="text-sm text-[var(--sea-ink-soft)]">Loading form...</p>
      </div>
    )
  }

  if (formQuery.error || !formQuery.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-base)]">
        <p className="text-sm text-red-600">This form is unavailable.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] px-4 py-16">
      <FormRenderer
        formId={formQuery.data.id}
        slug={formQuery.data.slug}
        title={formQuery.data.title}
        definition={formQuery.data.definition}
      />
    </div>
  )
}
