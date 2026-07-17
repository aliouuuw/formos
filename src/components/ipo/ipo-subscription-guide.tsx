import { Link } from '@tanstack/react-router'

import { buttonVariants, Button } from '#/components/ui/button'
import { IPO_CAMPAIGN, IPO_GUIDE_PDF_PATH } from '#/lib/ipo-campaign'
import {
  IPO_GUIDE_META,
  IPO_GUIDE_SECTIONS,
  IPO_GUIDE_TOC,
} from '#/lib/ipo-guide-content'
import { cn } from '#/lib/utils'

export function IpoSubscriptionGuide() {
  return (
    <div className="ipo-guide min-h-dvh bg-(--summit-ivory) text-night-80">
      <div className="ipo-guide-no-print border-b border-everest-green/10 bg-everest-green px-5 py-4 text-white sm:px-8">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4">
          <Link
            to="/ipo-bridge-bank"
            className="ipo-text-link text-sm font-medium text-white/85 no-underline hover:text-white"
          >
            ← Retour à la campagne
          </Link>
          <div className="flex flex-wrap gap-2">
            <a
              href={IPO_GUIDE_PDF_PATH}
              download="guide-souscription-ipo-bridge-bank.pdf"
              data-ui="button"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                'border-white/30 bg-white/5 text-white hover:border-white/50 hover:bg-white/10 hover:text-white',
              )}
            >
              Télécharger le PDF complet
            </a>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-white/30 bg-white/5 text-white hover:border-white/50 hover:bg-white/10 hover:text-white"
              onClick={() => window.print()}
            >
              Imprimer
            </Button>
            <Link
              to="/f/$slug"
              params={{ slug: 'ipo-souscrire' }}
              data-ui="button"
              className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'ipo-cta-gold')}
            >
              Je veux souscrire
            </Link>
            <Link
              to="/f/$slug"
              params={{ slug: 'ipo-bulletin' }}
              data-ui="button"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                'border-white/30 bg-white/5 text-white hover:border-white/50 hover:bg-white/10 hover:text-white',
              )}
            >
              Remplir le bulletin
            </Link>
          </div>
        </div>
      </div>

      <article className="mx-auto max-w-3xl px-6 py-12 sm:px-10 sm:py-16">
        <header className="border-b border-everest-green/12 pb-10">
          <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-gold">
            {IPO_GUIDE_META.publisher} · v{IPO_GUIDE_META.version}
          </p>
          <h1 className="mt-4 text-[clamp(1.75rem,4vw,2.5rem)] font-extrabold tracking-[-0.04em] leading-[1.08] text-everest-green">
            {IPO_GUIDE_META.title}
          </h1>
          <p className="mt-3 text-lg font-medium text-night-80">{IPO_GUIDE_META.subtitle}</p>
          <p className="mt-4 text-base font-light leading-8 text-text-secondary">
            {IPO_GUIDE_META.disclaimerShort}
          </p>
          <div className="ipo-guide-no-print mt-6 rounded-2xl border border-gold/30 bg-gold/8 px-5 py-4">
            <p className="text-sm leading-7 text-night-80">
              <strong className="font-semibold">Version complète en PDF</strong> — calendrier
              détaillé, checklist dossier, FAQ et mentions légales. Ce résumé web ne remplace pas
              le document téléchargeable.
            </p>
            <a
              href={IPO_GUIDE_PDF_PATH}
              download="guide-souscription-ipo-bridge-bank.pdf"
              className="mt-3 inline-flex text-sm font-semibold text-everest-green underline-offset-4 hover:underline"
            >
              Télécharger le guide PDF ({IPO_GUIDE_META.publishedAt})
            </a>
          </div>
        </header>

        <nav className="mt-10" aria-label="Sommaire">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-everest-green/70">
            Sommaire
          </h2>
          <ol className="mt-4 grid gap-2 sm:grid-cols-2">
            {IPO_GUIDE_TOC.map((item) => (
              <li key={item.id} className="flex gap-2 text-sm text-text-secondary">
                <span className="font-bold text-gold">{item.id}.</span>
                {item.label}
              </li>
            ))}
          </ol>
        </nav>

        <section className="mt-12">
          <h2 className="text-xl font-bold tracking-[-0.02em] text-everest-green">
            {IPO_GUIDE_SECTIONS.object.title}
          </h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-text-secondary">
            {IPO_GUIDE_SECTIONS.object.paragraphs.map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-bold tracking-[-0.02em] text-everest-green">
            {IPO_GUIDE_SECTIONS.offer.title}
          </h2>
          <dl className="mt-6 divide-y divide-everest-green/10 rounded-2xl border border-everest-green/10 bg-white">
            {IPO_GUIDE_SECTIONS.offer.rows.map(([label, value]) => (
              <div key={label} className="grid gap-1 px-5 py-4 sm:grid-cols-[11rem_1fr] sm:gap-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-everest-green/60">
                  {label}
                </dt>
                <dd className="text-sm font-medium text-night-80">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-bold tracking-[-0.02em] text-everest-green">
            {IPO_GUIDE_SECTIONS.timeline.title}
          </h2>
          <ol className="mt-8 space-y-6">
            {IPO_GUIDE_SECTIONS.timeline.events.map((event) => (
              <li
                key={event.label}
                className="border-l-2 border-gold pl-5"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-everest-green">
                  {event.date}
                </p>
                <h3 className="mt-1 text-base font-semibold">{event.label}</h3>
                <p className="mt-2 text-sm leading-7 text-text-secondary">{event.detail}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-bold tracking-[-0.02em] text-everest-green">
            {IPO_GUIDE_SECTIONS.procedure.title}
          </h2>
          <ol className="mt-8 space-y-8">
            {IPO_GUIDE_SECTIONS.procedure.steps.map((step) => (
              <li key={step.step}>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">
                  {step.step}
                </p>
                <h3 className="mt-1 text-lg font-semibold">{step.title}</h3>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-text-secondary">
                  {step.tasks.map((task) => (
                    <li key={task.slice(0, 32)}>{task}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-12 rounded-2xl border border-everest-green/10 bg-white p-6 sm:p-8">
          <h2 className="text-lg font-bold text-everest-green">
            {IPO_GUIDE_SECTIONS.dossier.title}
          </h2>
          <p className="mt-3 text-sm leading-7 text-text-secondary">
            {IPO_GUIDE_SECTIONS.dossier.intro}
          </p>
          <ul className="mt-5 space-y-3">
            {IPO_GUIDE_SECTIONS.dossier.checklist.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-6 text-night-80">
                <span
                  className="mt-0.5 size-4 shrink-0 rounded border border-everest-green/40"
                  aria-hidden
                />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-xs leading-6 text-night-60">{IPO_GUIDE_SECTIONS.dossier.note}</p>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-bold tracking-[-0.02em] text-everest-green">
            {IPO_GUIDE_SECTIONS.faq.title}
          </h2>
          <dl className="mt-6 space-y-6">
            {IPO_GUIDE_SECTIONS.faq.items.map((item) => (
              <div key={item.q}>
                <dt className="font-semibold text-night-80">{item.q}</dt>
                <dd className="mt-2 text-sm leading-7 text-text-secondary">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <footer className="mt-12 border-t border-everest-green/10 pt-8 text-xs leading-6 text-night-60">
          <p>{IPO_GUIDE_SECTIONS.contact.legal}</p>
          <p className="mt-3">
            © {IPO_CAMPAIGN.intermediary} · {IPO_GUIDE_META.publishedAt}
          </p>
        </footer>
      </article>
    </div>
  )
}
