import { Link, createFileRoute } from '@tanstack/react-router'

import { AppShell } from '#/components/app-shell'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Panel, PanelBody } from '#/components/ui/panel'

export const Route = createFileRoute('/')({ component: HomePage })

const capabilities = [
  {
    title: 'Multi-step forms',
    body: 'Publish flows at /f/slug with field-level analytics on every step.',
    accent: 'everest' as const,
  },
  {
    title: 'Lead pipeline',
    body: 'Submissions create leads and trigger Inngest jobs automatically.',
    accent: 'mauve' as const,
  },
  {
    title: 'Funnel visibility',
    body: 'See views, starts, completions, and drop-off per field in admin.',
    accent: 'gold' as const,
  },
]

function CapabilityCard({
  title,
  body,
  accent,
}: {
  title: string
  body: string
  accent: 'everest' | 'mauve' | 'gold'
}) {
  const dotClass =
    accent === 'everest'
      ? 'bg-everest-green'
      : accent === 'mauve'
        ? 'bg-mauve'
        : 'bg-gold'

  return (
    <Panel>
      <PanelBody className="space-y-4 py-6">
        <span className={`block h-2 w-2 rounded-full ${dotClass}`} />
        <h3 className="text-lg font-semibold text-night-80">{title}</h3>
        <p className="text-sm leading-relaxed text-night-60">{body}</p>
      </PanelBody>
    </Panel>
  )
}

function HomePage() {
  return (
    <AppShell variant="marketing">
      <section className="section-bg-light page-container py-16 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div className="space-y-6">
            <Badge variant="mauve" className="normal-case tracking-[0.22em]">
              Everest Finance internal
            </Badge>
            <h1 className="luxury-heading max-w-2xl">
              Lead capture that feels on-brand, not bolted on.
            </h1>
            <p className="luxury-subheading-left max-w-xl text-lg">
              Formos gives your team Typeform-style flows, real-time funnel analytics, and a
              leads inbox wired to Inngest.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link to="/admin">
                <Button size="lg" variant="mauve" showArrow>
                  Open admin
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="secondary">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>

          <Panel className="lg:translate-y-4">
            <PanelBody className="space-y-5 py-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mauve-60">
                Live preview path
              </p>
              <p className="font-mono text-sm text-everest-green">/f/your-slug</p>
              <p className="text-sm leading-relaxed text-night-60">
                Publish a form, share the slug on landing pages, and watch completion events roll
                into the admin dashboard.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="everest">Published forms</Badge>
                <Badge variant="mauve">Lead routing</Badge>
                <Badge variant="default">Analytics</Badge>
              </div>
            </PanelBody>
          </Panel>
        </div>
      </section>

      <section className="page-container pb-20 pt-4">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="kicker">Capabilities</p>
            <h2 className="mt-2 text-2xl font-semibold text-night-80">Built for growth ops</h2>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {capabilities.map((item) => (
            <CapabilityCard key={item.title} {...item} />
          ))}
        </div>
      </section>
    </AppShell>
  )
}
