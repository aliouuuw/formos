import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

import { FormRenderer } from '#/components/form-renderer'
import { Badge } from '#/components/ui/badge'
import { orpc } from '#/orpc/client'

export const Route = createFileRoute('/f/$slug')({ component: PublicFormPage })

function PublicFormPage() {
  const { slug } = Route.useParams()
  const formQuery = useQuery(orpc.forms.getBySlug.queryOptions({ input: { slug } }))

  if (formQuery.isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[var(--summit-ivory)]">
        <p className="text-sm text-night-60">Loading form...</p>
      </div>
    )
  }

  if (formQuery.error || !formQuery.data) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 bg-[var(--summit-ivory)] px-4">
        <Badge variant="mauve">Unavailable</Badge>
        <p className="text-sm text-night-60">This form is not published or does not exist.</p>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-[var(--summit-ivory)]">
      <div className="section-bg-everest px-4 py-10 text-center sm:py-14">
        <Badge variant="mauve" className="mx-auto mb-4 normal-case tracking-[0.2em]">
          Everest Finance
        </Badge>
        <p className="text-sm text-white/75">{formQuery.data.title}</p>
      </div>
      <div className="relative -mt-8 px-4 pb-16">
        <FormRenderer
          formId={formQuery.data.id}
          slug={formQuery.data.slug}
          title={formQuery.data.title}
          definition={formQuery.data.definition}
        />
      </div>
    </div>
  )
}
