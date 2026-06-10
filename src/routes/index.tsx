import { Link, createFileRoute } from '@tanstack/react-router'

import { AppShell } from '#/components/app-shell'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'

export const Route = createFileRoute('/')({ component: HomePage })

function HomePage() {
  return (
    <AppShell variant="marketing">
      <section className="grid gap-10 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--kicker)]">
            Everest Finance internal
          </p>
          <h1 className="mt-4 max-w-2xl font-[Fraunces] text-5xl font-bold leading-tight">
            Build Typeform-style flows, capture leads, and measure drop-off.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-[var(--sea-ink-soft)]">
            Formos lets your team publish forms on landing pages or dedicated routes, track
            completion analytics, and route new leads through Inngest workflows.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/admin">
              <Button size="lg">Go to admin</Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Form builder</CardTitle>
              <CardDescription>
                Multi-step forms with JSON definitions stored in Postgres.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Lead pipeline</CardTitle>
              <CardDescription>
                Submissions create leads and trigger Inngest background jobs.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Field analytics</CardTitle>
              <CardDescription>
                Funnel metrics and per-question drop-off in the admin dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Public forms live at <code>/f/your-slug</code>.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </AppShell>
  )
}
