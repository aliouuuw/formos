import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

import { PageHeader } from '#/components/page-header'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Panel, PanelBody, PanelHeader } from '#/components/ui/panel'
import { orpc } from '#/orpc/client'

export const Route = createFileRoute('/admin/campaigns')({
  component: CampaignsPage,
})

function CampaignsPage() {
  const campaignsQuery = useQuery(orpc.campaigns.list.queryOptions({ input: undefined }))

  return (
    <div className="space-y-10">
      <PageHeader
        kicker="Configuration"
        title="Campagnes"
        description="Vue d'ensemble : formulaires, intentions et performance."
        actions={
          <Link to="/admin/parametres">
            <Button variant="mauve" size="sm" showArrow>
              Paramètres
            </Button>
          </Link>
        }
      />

      {campaignsQuery.isLoading ? (
        <p className="text-sm text-night-60">Chargement…</p>
      ) : null}

      <div className="space-y-6">
        {(campaignsQuery.data ?? []).map((campaign) => (
          <Panel key={campaign.id}>
            <PanelHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold tracking-[-0.02em] text-night-80">
                    {campaign.name}
                  </h2>
                  <p className="mt-1 text-sm text-text-secondary">{campaign.description}</p>
                </div>
                <Badge variant="secondary" className="normal-case tracking-normal">
                  {campaign.id}
                </Badge>
              </div>
            </PanelHeader>
            <PanelBody className="space-y-6">
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                <Meta label="Landing" value={campaign.landingPath} />
                <Meta label="UTM campaign" value={campaign.utmCampaign} />
                <Meta
                  label="Conversion"
                  value={campaign.conversionStatuses.join(', ')}
                />
                <Meta
                  label="WhatsApp"
                  value={campaign.whatsappConfigured ? (campaign.whatsappNumber ?? 'Configuré') : 'À configurer'}
                />
              </dl>

              <section>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-label">
                  Formulaires & intentions
                </h3>
                <ul className="mt-3 divide-y divide-mauve/10 rounded-xl border border-mauve/10">
                  {campaign.forms.map((form) => (
                    <li
                      key={form.slug}
                      className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                    >
                      <div>
                        <p className="font-medium text-night-80">/f/{form.slug}</p>
                        <p className="text-xs text-text-secondary">{form.intentLabel}</p>
                      </div>
                      <Badge variant="outline" className="normal-case tracking-normal">
                        {form.intent}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-label">
                  Agents ({campaign.agents.length})
                </h3>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {campaign.agents.map((agent) => (
                    <li key={agent.id}>
                      <Badge variant="mauve" className="normal-case tracking-normal">
                        {agent.label}
                      </Badge>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-text-secondary">
                  Modifier la liste dans{' '}
                  <Link to="/admin/parametres" className="font-medium text-mauve hover:underline">
                    Paramètres
                  </Link>
                  .
                </p>
              </section>
            </PanelBody>
          </Panel>
        ))}
      </div>
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-label">
        {label}
      </dt>
      <dd className="mt-1 font-medium text-night-80">{value}</dd>
    </div>
  )
}
