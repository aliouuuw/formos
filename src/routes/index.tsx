import { Link, createFileRoute } from '@tanstack/react-router'
import { BarChart3, Check, Send } from 'lucide-react'

import { AppShell } from '#/components/app-shell'
import { Button } from '#/components/ui/button'

export const Route = createFileRoute('/')({ component: HomePage })

const steps = [
  { number: '01', title: 'Créer le formulaire', body: 'Ajoutez les champs dont vous avez besoin et organisez les étapes.' },
  { number: '02', title: 'Partager le lien', body: 'Publiez un /f/slug et diffusez-le sur vos campagnes.' },
  { number: '03', title: 'Suivre les réponses', body: 'Les leads arrivent automatiquement. Vous voyez où les gens abandonnent.' },
]

const activity = [
  { initials: 'AM', name: 'Aminata Mbaye', source: 'Bilan patrimonial', time: '2m' },
  { initials: 'LN', name: 'Louis Nadeau', source: 'Prêt immobilier', time: '11m' },
  { initials: 'SK', name: 'Sarah Kim', source: 'Crédit entreprise', time: '24m' },
]

function FormPreview() {
  return (
    <div className="form-preview" aria-label="Exemple d'interface de formulaire Formos">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-gold" />
          <span className="text-xs font-medium tracking-wide text-white/80">Découverte patrimoniale</span>
        </div>
        <span className="font-mono text-[10px] text-white/40">02 / 05</span>
      </div>
      <div className="px-6 pb-7 pt-8 sm:px-8 sm:pb-8">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">Un peu de contexte</p>
        <h2 className="max-w-md text-2xl font-medium leading-tight text-white sm:text-3xl">
          Qu'aimeriez-vous que votre patrimoine rende possible ?
        </h2>
        <div className="mt-8 grid gap-2.5">
          {['Une retraite plus sereine', "L'achat d'une maison ou d'un bien immobilier", 'Bâtir un héritage durable'].map(
            (option, index) => (
              <div
                key={option}
                className={`flex items-center justify-between rounded-xl border px-4 py-3.5 text-sm ${
                  index === 0
                    ? 'border-gold/60 bg-gold/10 text-white'
                    : 'border-white/10 bg-white/[0.03] text-white/65'
                }`}
              >
                <span>{option}</span>
                {index === 0 ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold text-everest-green">
                    <Check size={12} strokeWidth={3} />
                  </span>
                ) : (
                  <span className="h-5 w-5 rounded-full border border-white/20" />
                )}
              </div>
            ),
          )}
        </div>
        <div className="mt-7 flex items-center justify-between">
          <span className="text-[11px] text-white/35">Appuyez sur Entrée ↵</span>
          <span className="flex h-10 items-center gap-2 rounded-full bg-gold px-5 text-xs font-semibold text-everest-green">
            Continuer <Send size={13} />
          </span>
        </div>
      </div>
    </div>
  )
}

function HomePage() {
  return (
    <AppShell variant="marketing">
      {/* Screen 1 — Hero */}
      <section className="landing-hero overflow-hidden">
        <div className="page-container relative grid gap-12 pb-16 pt-12 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:pb-20 lg:pt-16">
          <div className="relative z-10 rise-in">
            <p className="mb-6 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-everest-green">
              <span className="h-px w-8 bg-gold" /> Everest Finance · Plateforme interne
            </p>
            <h1 className="max-w-[18ch] text-balance font-display text-[clamp(2.25rem,4.5vw,4rem)] font-medium leading-[0.98] tracking-[-0.04em] text-everest-green">
              Créez des formulaires et suivez vos leads.
            </h1>
            <p className="mt-6 max-w-[33rem] text-pretty text-base font-light leading-7 text-text-secondary">
              Formos transforme vos campagnes en formulaires de marque, suit les taux de complétion et
              centralise vos leads pour votre équipe.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/admin">
                <Button size="lg" variant="mauve" showArrow className="h-12 px-7">
                  Ouvrir l'admin
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="secondary">
                  Se connecter
                </Button>
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-everest-green/10 pt-5 text-xs text-text-secondary">
              <span className="flex items-center gap-2"><Check size={14} className="text-gold" /> Formulaires sans code</span>
              <span className="flex items-center gap-2"><Check size={14} className="text-gold" /> Stats par champ</span>
              <span className="flex items-center gap-2"><Check size={14} className="text-gold" /> Routage Inngest</span>
            </div>
          </div>

          <div className="relative lg:pl-8">
            <div className="hero-orbit hero-orbit-one" />
            <div className="hero-orbit hero-orbit-two" />
            <div className="relative z-10 lg:rotate-[1.5deg]">
              <FormPreview />
              <div className="absolute -bottom-6 -left-4 hidden w-52 rounded-2xl border border-everest-green/10 bg-white/90 p-4 shadow-[0_18px_50px_rgba(1,45,42,0.16)] backdrop-blur md:block lg:-left-10">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-everest-green-05 text-everest-green"><BarChart3 size={17} /></span>
                  <div><p className="font-mono text-lg font-semibold leading-none text-everest-green">68,4 %</p><p className="mt-1 text-[10px] text-text-secondary">taux de complétion</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Screen 2 — How it works + live activity + CTA */}
      <section className="section-compact page-container pb-16 pt-4 sm:pb-20">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:gap-8">
          {/* Left — workflow + CTA */}
          <div className="flex flex-col gap-6">
            <div>
              <p className="kicker">Comment ça marche</p>
              <h2 className="mt-4 max-w-sm text-balance text-2xl font-semibold leading-tight text-everest-green sm:text-3xl">
                Du formulaire au lead.
              </h2>
            </div>
            <ol className="space-y-px border-y border-everest-green/10">
              {steps.map((item) => (
                <li key={item.number} className="workflow-row grid gap-3 py-5 sm:grid-cols-[2.5rem_1fr] sm:items-start">
                  <span className="font-mono text-xs text-gold">{item.number}</span>
                  <div>
                    <h3 className="text-base font-semibold text-night-80">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-6 text-text-secondary">{item.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="cta-inline relative overflow-hidden rounded-2xl px-6 py-7 sm:px-8">
              <h3 className="text-xl font-semibold leading-tight text-everest-green">Créez un formulaire en quelques minutes.</h3>
              <p className="mt-2 text-sm leading-6 text-text-secondary">Puis publiez et suivez les premières réponses.</p>
              <div className="mt-5"><Link to="/admin"><Button variant="mauve" size="lg" showArrow className="h-11 px-6">Aller à Formos</Button></Link></div>
            </div>
          </div>

          {/* Right — live activity */}
          <div className="section-activity overflow-hidden rounded-[1.75rem]">
            <div className="p-6 sm:p-8">
              <div className="mb-5 flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gold">Activité des leads</p>
                <span className="flex items-center gap-2 text-[10px] text-white/40"><span className="h-1.5 w-1.5 rounded-full bg-gold" /> En direct</span>
              </div>
              <h2 className="text-2xl font-medium leading-tight text-white sm:text-3xl">Voyez qui répond.</h2>
              <div className="mt-6 space-y-2">
                {activity.map((lead) => (
                  <div key={lead.name} className="lead-row grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.045] p-3.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-[10px] font-semibold text-gold">{lead.initials}</span>
                    <div className="min-w-0"><p className="truncate text-sm font-medium text-white/90">{lead.name}</p><p className="mt-0.5 truncate text-[11px] text-white/40">{lead.source}</p></div>
                    <span className="font-mono text-[10px] text-white/35">{lead.time}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-white/[0.045] p-4"><p className="font-mono text-xl font-semibold text-white">147</p><p className="mt-1 text-[10px] text-white/40">démarrages cette semaine</p></div>
                <div className="rounded-xl bg-white/[0.045] p-4"><p className="font-mono text-xl font-semibold text-gold">+18,7 %</p><p className="mt-1 text-[10px] text-white/40">vs. semaine dernière</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  )
}
