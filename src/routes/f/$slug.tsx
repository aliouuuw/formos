import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

import { FormRenderer } from '#/components/form-renderer'
import { BulletinForm } from '#/components/ipo/bulletin-form'
import { Badge } from '#/components/ui/badge'
import { getCampaignByFormSlug, getFormBinding } from '#/lib/campaigns'
import { isBulletinFormSlug } from '#/lib/ipo-bulletin'
import { orpc } from '#/orpc/client'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/f/$slug')({ component: PublicFormPage })

function PublicFormPage() {
  const { slug } = Route.useParams()
  const formQuery = useQuery({
    ...orpc.forms.getBySlug.queryOptions({ input: { slug } }),
    staleTime: 0,
    refetchOnMount: 'always',
  })
  const campaign = getCampaignByFormSlug(slug)
  const formBinding = getFormBinding(slug)
  const isCampaignForm = Boolean(campaign)

  if (formQuery.isLoading) {
    return (
      <div
        className={cn(
          'flex min-h-dvh items-center justify-center',
          isCampaignForm ? 'ipo-form-shell' : 'bg-(--summit-ivory)',
        )}
      >
        <p className={cn('text-sm', isCampaignForm ? 'text-white/70' : 'text-night-60')}>
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
          isCampaignForm ? 'ipo-form-shell' : 'bg-(--summit-ivory)',
        )}
      >
        <Badge variant={isCampaignForm ? 'everest' : 'mauve'}>Indisponible</Badge>
        <p className={cn('text-sm', isCampaignForm ? 'text-white/70' : 'text-night-60')}>
          Ce formulaire n&apos;est pas publié ou n&apos;existe pas.
        </p>
      </div>
    )
  }

  if (campaign && formBinding) {
    return (
      <div className="ipo-form-shell min-h-dvh">
        <div className="mx-auto flex max-w-3xl flex-col px-4 pb-20 pt-8 sm:px-6 sm:pt-12">
          <div className="mb-10 flex items-center justify-between gap-4">
            {campaign.landingPath === '/ipo-bridge-bank' ? (
              <Link
                to="/ipo-bridge-bank"
                className="ipo-text-link text-sm font-medium no-underline transition-colors"
              >
                ← Retour à la campagne
              </Link>
            ) : (
              <a
                href={campaign.landingPath}
                className="ipo-text-link text-sm font-medium no-underline transition-colors"
              >
                ← Retour à la campagne
              </a>
            )}
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
              Everest Finance
            </p>
          </div>

          <div className="mb-10 max-w-xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-white/50">
              {campaign.shortName}
            </p>
            <h1 className="mt-4 text-[clamp(2rem,5vw,2.85rem)] font-extrabold tracking-[-0.045em] leading-[1.02] text-white">
              {formQuery.data.title
                .replace(/^IPO Bridge Bank — /, '')
                .replace(/^IPO Bridge Bank - /, '')}
            </h1>
            <p className="mt-4 max-w-md text-base font-light leading-8 text-white/62">
              {isBulletinFormSlug(slug)
                ? 'Remplissez et signez le bulletin officiel en ligne. Le PDF signé sera généré pour finaliser le règlement avec votre conseiller.'
                : 'Laissez vos coordonnées : un conseiller vous rappelle sous 24 h ouvrées pour finaliser votre souscription.'}
            </p>
          </div>

          {isBulletinFormSlug(slug) ? (
            <BulletinForm
              key={`${formQuery.data.id}-v${formQuery.data.version}`}
              formId={formQuery.data.id}
              slug={formQuery.data.slug}
            />
          ) : (
            <FormRenderer
              key={`${formQuery.data.id}-v${formQuery.data.version}`}
              formId={formQuery.data.id}
              slug={formQuery.data.slug}
              title={formQuery.data.title}
              definition={formQuery.data.definition}
              panelClassName="ipo-form-panel w-full max-w-none rounded-[2rem]"
              campaign
            />
          )}
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
          key={`${formQuery.data.id}-v${formQuery.data.version}`}
          formId={formQuery.data.id}
          slug={formQuery.data.slug}
          title={formQuery.data.title}
          definition={formQuery.data.definition}
        />
      </div>
    </div>
  )
}
