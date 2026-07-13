import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

import { FormRenderer } from '#/components/form-renderer'
import { Badge } from '#/components/ui/badge'
import { IPO_FORM_SLUGS } from '#/lib/ipo-campaign'
import { orpc } from '#/orpc/client'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/f/$slug')({ component: PublicFormPage })

const IPO_SLUGS = new Set<string>([IPO_FORM_SLUGS.subscribe, IPO_FORM_SLUGS.infos])

function PublicFormPage() {
  const { slug } = Route.useParams()
  const formQuery = useQuery(orpc.forms.getBySlug.queryOptions({ input: { slug } }))
  const isIpoCampaign = IPO_SLUGS.has(slug)

  if (formQuery.isLoading) {
    return (
      <div
        className={cn(
          'flex min-h-dvh items-center justify-center',
          isIpoCampaign ? 'ipo-form-shell' : 'bg-(--summit-ivory)',
        )}
      >
        <p className={cn('text-sm', isIpoCampaign ? 'text-white/70' : 'text-night-60')}>
          Chargement du formulaire…
        </p>
      </div>
    )
  }

  if (formQuery.error || !formQuery.data) {
    return (
      <div
        className={cn(
          'flex min-h-dvh flex-col items-center justify-center gap-3 px-4',
          isIpoCampaign ? 'ipo-form-shell' : 'bg-(--summit-ivory)',
        )}
      >
        <Badge variant={isIpoCampaign ? 'everest' : 'mauve'}>Indisponible</Badge>
        <p className={cn('text-sm', isIpoCampaign ? 'text-white/70' : 'text-night-60')}>
          Ce formulaire n&apos;est pas publié ou n&apos;existe pas.
        </p>
      </div>
    )
  }

  if (isIpoCampaign) {
    return (
      <div className="ipo-form-shell min-h-dvh">
        <div className="mx-auto flex max-w-3xl flex-col px-4 pb-20 pt-8 sm:px-6 sm:pt-12">
          <div className="mb-10 flex items-center justify-between gap-4">
            <Link
              to="/ipo-bridge-bank"
              className="ipo-text-link text-sm font-medium no-underline transition-colors"
            >
              ← Retour à la campagne
            </Link>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
              Everest Finance
            </p>
          </div>

          <div className="mb-10 max-w-xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-white/50">
              IPO Bridge Bank
            </p>
            <h1 className="mt-4 text-[clamp(2rem,5vw,2.85rem)] font-extrabold tracking-[-0.045em] leading-[1.02] text-white">
              {formQuery.data.title.replace(/^IPO Bridge Bank — /, '').replace(/^IPO Bridge Bank - /, '')}
            </h1>
            <p className="mt-4 max-w-md text-base font-light leading-8 text-white/62">
              Un conseiller vous contacte sur le canal choisi sous 24&nbsp;h ouvrées.
            </p>
          </div>

          <FormRenderer
            formId={formQuery.data.id}
            slug={formQuery.data.slug}
            title={formQuery.data.title}
            definition={formQuery.data.definition}
            panelClassName="ipo-form-panel w-full max-w-none rounded-[2rem]"
            campaign
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-(--summit-ivory)">
      <div className="section-bg-everest px-4 py-10 text-center sm:py-14">
        <Badge variant="everest" className="mx-auto mb-4 normal-case tracking-[0.2em]">
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
