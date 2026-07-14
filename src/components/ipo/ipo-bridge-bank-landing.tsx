import { Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

import { buttonVariants } from '#/components/ui/button'
import {
  IPO_CAMPAIGN,
  IPO_FORM_SLUGS,
  IPO_GUIDE_PDF_PATH,
  getIpoCampaignPhase,
  getIpoPhaseCopy,
  ipoFormSearchParams,
} from '#/lib/ipo-campaign'
import { BRIDGE_BANK_IPO_CAMPAIGN_ID } from '#/lib/campaigns'
import { useCampaignContact } from '#/hooks/use-campaign-contact'
import { cn } from '#/lib/utils'

const BBG_INVESTMENT_REASONS = [
  'Banque rentable et en forte croissance',
  'Dividende annuel versé aux actionnaires',
  "Exposition directe à l'économie ivoirienne",
  "Placement réglementé, encadré par l'AMF-UMOA (VISA N° AO/26-03)",
  "Participation directe à la croissance de l'économie ivoirienne, 1ère puissance économique de l'UEMOA",
  'Banque en pleine expansion digitale et régionale',
] as const

function EverestLogo({ className }: { className?: string }) {
  return (
    <img
      src="/logo-everest.png"
      alt="Everest Finance"
      className={cn('h-14 w-auto sm:h-16', className)}
    />
  )
}

function ArrowDisc({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'ml-1 flex h-7 w-7 items-center justify-center rounded-full transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px',
        className,
      )}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
        <path
          d="M3 7h8M8 4l3 3-3 3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

/** Nudges toward the cursor within a small radius — restrained, not a full magnetic-button gimmick. */
function useMagnetic(strength = 8) {
  const ref = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (window.matchMedia('(pointer: coarse)').matches) return

    const onMove = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * strength
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * strength
      node.style.transform = `translate(${x}px, ${y}px)`
    }
    const onLeave = () => {
      node.style.transform = ''
    }

    node.addEventListener('pointermove', onMove)
    node.addEventListener('pointerleave', onLeave)
    return () => {
      node.removeEventListener('pointermove', onMove)
      node.removeEventListener('pointerleave', onLeave)
    }
  }, [strength])

  return ref
}

function CampaignLink({
  children,
  variant,
  className,
}: {
  children: React.ReactNode
  variant: 'gold' | 'ghost-light' | 'ghost-dark'
  className?: string
}) {
  const buttonVariant =
    variant === 'gold' ? 'default' : variant === 'ghost-light' ? 'ghost-light' : 'outline'
  const magneticRef = useMagnetic(7)

  return (
    <Link
      ref={magneticRef}
      data-ui="button"
      to="/f/$slug"
      params={{ slug: IPO_FORM_SLUGS.subscribe }}
      search={ipoFormSearchParams()}
      className={cn(
        buttonVariants({ variant: buttonVariant, size: 'lg' }),
        'transition-transform duration-150 ease-out',
        variant === 'gold' && 'ipo-cta-gold hover:shadow-[0_14px_32px_rgba(203,152,36,0.28)]',
        className,
      )}
    >
      {children}
      <ArrowDisc
        className={
          variant === 'gold'
            ? 'bg-white/18 text-white'
            : variant === 'ghost-light'
              ? 'bg-white/12 text-white'
              : 'bg-everest-green/10 text-everest-green'
        }
      />
    </Link>
  )
}

function GuidePdfLink({
  children,
  variant,
  className,
}: {
  children: React.ReactNode
  variant: 'gold' | 'ghost-light' | 'ghost-dark'
  className?: string
}) {
  const buttonVariant =
    variant === 'gold' ? 'default' : variant === 'ghost-light' ? 'ghost-light' : 'outline'
  const magneticRef = useMagnetic(7)

  return (
    <a
      ref={magneticRef}
      data-ui="button"
      href={IPO_GUIDE_PDF_PATH}
      download="guide-souscription-ipo-bridge-bank.pdf"
      className={cn(
        buttonVariants({ variant: buttonVariant, size: 'lg' }),
        'transition-transform duration-150 ease-out',
        variant === 'gold' && 'ipo-cta-gold hover:shadow-[0_14px_32px_rgba(203,152,36,0.28)]',
        className,
      )}
    >
      {children}
      <ArrowDisc
        className={
          variant === 'gold'
            ? 'bg-white/18 text-white'
            : variant === 'ghost-light'
              ? 'bg-white/12 text-white'
              : 'bg-everest-green/10 text-everest-green'
        }
      />
    </a>
  )
}

function useReveal() {
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const nodes = root.querySelectorAll<HTMLElement>('[data-reveal]')

    if (reduce) {
      nodes.forEach((node) => node.classList.add('is-revealed'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed')
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.14, rootMargin: '0px 0px -6% 0px' },
    )

    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [])

  return rootRef
}

/** Cursor depth + scroll haze on the hero — light Alpine kinetic without GSAP. */
function useHeroKinetic(heroRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    const media = hero.querySelector<HTMLElement>('[data-hero-media]')
    const haze = hero.querySelector<HTMLElement>('[data-hero-haze]')
    const content = hero.querySelector<HTMLElement>('[data-hero-content]')
    if (!media) return

    let raf = 0
    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0
    let scrollProgress = 0

    const tick = () => {
      currentX += (targetX - currentX) * 0.08
      currentY += (targetY - currentY) * 0.08
      const parallaxX = currentX * 18
      const parallaxY = currentY * 12 + scrollProgress * 40
      const scale = 1.08 + scrollProgress * 0.04

      media.style.transform = `translate3d(${parallaxX}px, ${parallaxY}px, 0) scale(${scale})`
      if (haze) {
        haze.style.transform = `translate3d(${currentX * -10}px, ${currentY * -8}px, 0)`
        haze.style.opacity = String(0.55 + scrollProgress * 0.25)
      }
      if (content) {
        content.style.transform = `translate3d(0, ${scrollProgress * 28}px, 0)`
        content.style.opacity = String(1 - scrollProgress * 0.55)
      }
      raf = requestAnimationFrame(tick)
    }

    const onPointer = (event: PointerEvent) => {
      const rect = hero.getBoundingClientRect()
      targetX = (event.clientX - rect.left) / rect.width - 0.5
      targetY = (event.clientY - rect.top) / rect.height - 0.5
    }

    const onScroll = () => {
      const rect = hero.getBoundingClientRect()
      const visible = Math.min(1, Math.max(0, -rect.top / Math.max(rect.height, 1)))
      scrollProgress = visible
    }

    hero.addEventListener('pointermove', onPointer)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      hero.removeEventListener('pointermove', onPointer)
      window.removeEventListener('scroll', onScroll)
    }
  }, [heroRef])
}

/** Counts up once the element enters view — a quiet delight moment, not a gimmick. */
function useCountUp(target: number, duration = 1100) {
  const ref = useRef<HTMLSpanElement>(null)
  const [value, setValue] = useState(0)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setValue(target)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        observer.disconnect()
        const start = performance.now()
        const step = (now: number) => {
          const progress = Math.min(1, (now - start) / duration)
          const eased = 1 - Math.pow(1 - progress, 4)
          setValue(Math.round(eased * target))
          if (progress < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
      },
      { threshold: 0.6 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [target, duration])

  return { ref, value }
}

export function IpoBridgeBankLanding() {
  const price = useCountUp(IPO_CAMPAIGN.sharePriceFcfa)
  const rootRef = useReveal()
  const heroRef = useRef<HTMLElement>(null)
  useHeroKinetic(heroRef)
  const { data: contact } = useCampaignContact(BRIDGE_BANK_IPO_CAMPAIGN_ID)
  const whatsappHref = contact?.whatsappUrl ?? undefined

  const phase = getIpoCampaignPhase()
  const phaseCopy = getIpoPhaseCopy(phase)

  return (
    <div ref={rootRef} className="ipo-campaign relative min-h-dvh overflow-x-hidden bg-(--summit-ivory)">
      <div className="ipo-campaign-grain pointer-events-none fixed inset-0 z-1" aria-hidden />

      {phase !== 'launch' ? (
        <div
          className={cn(
            'sticky top-0 z-50 border-b px-4 py-2.5 text-center text-sm',
            phase === 'final' || phase === 'closed'
              ? 'border-gold/30 bg-gold-cta text-white'
              : 'border-white/10 bg-everest-green text-white/90',
          )}
          role="status"
        >
          <p className="mx-auto max-w-4xl font-medium leading-snug">{phaseCopy.banner}</p>
        </div>
      ) : null}

      <header
        className={cn(
          'pointer-events-none absolute inset-x-0 z-40 flex justify-center px-4 sm:px-8',
          phase !== 'launch' ? 'top-14 pt-3 sm:pt-4' : 'top-0 pt-5 sm:pt-6',
        )}
      >
        <EverestLogo className="pointer-events-auto h-20 sm:h-24" />
      </header>

      <main>
        <section
          ref={heroRef}
          className="ipo-hero relative min-h-dvh overflow-hidden bg-everest-green text-white"
        >
          <div className="absolute inset-0 overflow-hidden">
            <div data-hero-media className="ipo-hero-media absolute inset-[-6%] will-change-transform">
              <img
                src="/Hero.png"
                alt="Vue sur Abidjan au crépuscule — Bridge Bank Group Côte d'Ivoire"
                className="h-full w-full object-cover object-[center_38%]"
              />
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(108deg,rgba(1,45,42,0.96)_0%,rgba(1,45,42,0.82)_38%,rgba(1,45,42,0.45)_68%,rgba(1,45,42,0.62)_100%)]" />
            <div
              data-hero-haze
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_72%_32%,rgba(203,152,36,0.22),transparent_44%)] will-change-transform"
            />
          </div>

          <div
            data-hero-content
            className="relative z-10 mx-auto flex min-h-dvh max-w-[1400px] flex-col justify-end px-5 pb-20 pt-36 sm:px-10 sm:pb-24 lg:justify-center lg:px-12 lg:pb-28 lg:pt-32 will-change-transform"
          >
            <div className="max-w-4xl">
              <p className="ipo-reveal mb-7 text-[10px] font-medium uppercase tracking-[0.28em] text-gold" data-reveal>
                {phaseCopy.kicker}
              </p>
              <h1
                className="ipo-reveal max-w-[16ch] text-[clamp(2.75rem,6.2vw,5.75rem)] font-extrabold leading-[0.94] tracking-[-0.05em] text-white"
                data-reveal
                style={{ transitionDelay: '70ms' }}
              >
                Investissez dans la prochaine étape de{' '}
                <span className="text-gold">Bridge Bank</span>
              </h1>
              <p
                className="ipo-reveal mt-8 max-w-xl text-base font-light leading-8 text-white/74 sm:text-lg sm:leading-9"
                data-reveal
                style={{ transitionDelay: '130ms' }}
              >
                {phaseCopy.heroSupport}
              </p>
              <div
                className="ipo-reveal mt-11 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center"
                data-reveal
                style={{ transitionDelay: '190ms' }}
              >
                {phase === 'closed' ? (
                  <>
                    <GuidePdfLink variant="ghost-light">
                      {phaseCopy.secondaryCta}
                    </GuidePdfLink>
                    <a
                      href={whatsappHref ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-ui="button"
                      className={cn(
                        buttonVariants({ variant: 'default', size: 'lg' }),
                        'ipo-cta-gold',
                      )}
                    >
                      {phaseCopy.primaryCta}
                      <ArrowDisc className="bg-white/18 text-white" />
                    </a>
                  </>
                ) : phaseCopy.emphasizeInfos ? (
                  <>
                    <CampaignLink variant="gold">
                      {phaseCopy.primaryCta}
                    </CampaignLink>
                    <GuidePdfLink variant="ghost-light">
                      {phaseCopy.secondaryCta}
                    </GuidePdfLink>
                  </>
                ) : (
                  <>
                    <GuidePdfLink variant="ghost-light">
                      {phaseCopy.secondaryCta}
                    </GuidePdfLink>
                    <CampaignLink variant="gold">
                      {phaseCopy.primaryCta}
                    </CampaignLink>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-10 -mt-10 border border-everest-green/10 bg-white/95 shadow-[0_24px_60px_rgba(1,45,42,0.08)] backdrop-blur-sm sm:-mt-14">
          <dl className="mx-auto grid max-w-[1400px] divide-y divide-everest-green/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="ipo-reveal px-6 py-9 sm:px-10 lg:px-12" data-reveal>
              <dt className="text-[10px] font-medium uppercase tracking-[0.2em] text-everest-green/55">
                Prix par action
              </dt>
              <dd className="mt-3">
                <span className="text-[1.75rem] font-bold tracking-[-0.04em] tabular-nums text-night-80 sm:text-3xl">
                  <span ref={price.ref}>{new Intl.NumberFormat('fr-FR').format(price.value)}</span>
                </span>
                <span className="ml-2 text-sm font-medium text-gold">FCFA</span>
              </dd>
            </div>
            <div
              className="ipo-reveal px-6 py-9 sm:px-10 lg:px-12"
              data-reveal
              style={{ transitionDelay: '50ms' }}
            >
              <dt className="text-[10px] font-medium uppercase tracking-[0.2em] text-everest-green/55">
                Fenêtre de souscription
              </dt>
              <dd className="mt-3 text-[1.75rem] font-bold tracking-[-0.04em] text-night-80 sm:text-3xl">
                20 juil. <span className="text-gold">→</span> 6 août
              </dd>
            </div>
            <div
              className="ipo-reveal px-6 py-9 sm:px-10 lg:px-12"
              data-reveal
              style={{ transitionDelay: '100ms' }}
            >
              <dt className="text-[10px] font-medium uppercase tracking-[0.2em] text-everest-green/55">
                Cotation visée
              </dt>
              <dd className="mt-3">
                <span className="text-[1.75rem] font-bold tracking-[-0.04em] text-night-80 sm:text-3xl">
                  Septembre
                </span>
                <span className="ml-2 text-sm font-medium text-gold">2026</span>
              </dd>
            </div>
          </dl>
        </section>

        <section id="parcours" className="bg-(--summit-ivory)">
          <div className="mx-auto max-w-[1400px] px-5 py-24 sm:px-10 lg:px-12 lg:py-36">
            <div className="ipo-reveal max-w-3xl" data-reveal>
              <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.24em] text-everest-green/50">
                Pourquoi investir
              </p>
              <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-bold tracking-[-0.04em] text-night-80 leading-[1.05]">
                Pourquoi acheter des actions BBG CI ?
              </h2>
            </div>

            <ul className="mt-16 grid gap-px overflow-hidden rounded-[2rem] border border-everest-green/10 bg-everest-green/10 sm:grid-cols-2">
              {BBG_INVESTMENT_REASONS.map((reason, index) => (
                <li
                  key={reason}
                  data-reveal
                  className="ipo-reveal group flex gap-5 bg-white p-6 transition-colors duration-300 sm:gap-6 sm:p-8 lg:hover:bg-[#faf8f4]"
                  style={{ transitionDelay: `${index * 60}ms` }}
                >
                  <span
                    aria-hidden
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/35 bg-gold/10 text-xs font-bold tabular-nums tracking-wide text-gold transition-colors duration-300 group-hover:border-gold/55 group-hover:bg-gold/16"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <p className="pt-2 text-base font-medium leading-8 text-night-80">{reason}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="relative overflow-hidden bg-white">
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(ellipse_at_100%_50%,rgba(70,29,76,0.06),transparent_70%)]" />
          <div className="relative mx-auto max-w-[1400px] px-5 py-24 sm:px-10 lg:px-12 lg:py-32">
            <div className="ipo-reveal max-w-2xl" data-reveal>
              <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.24em] text-everest-green/50">
                Pourquoi Everest
              </p>
              <h2 className="text-[clamp(1.85rem,3.5vw,2.75rem)] font-bold tracking-[-0.035em] text-night-80 leading-[1.08]">
                Un intermédiaire. Un suivi. Une décision éclairée.
              </h2>
            </div>

            <div className="mt-16 grid gap-x-16 gap-y-16 lg:grid-cols-3">
              {[
                {
                  index: 'I',
                  title: 'Accompagnement dédié',
                  body: 'Un conseiller qualifie votre projet et prépare le dossier de souscription avec vous.',
                },
                {
                  index: 'II',
                  title: 'Information documentée',
                  body: "Notice, calendrier et conditions de l'offre sont présentés avant toute décision.",
                },
                {
                  index: 'III',
                  title: 'Fenêtre maîtrisée',
                  body: `Souscription du ${IPO_CAMPAIGN.subscriptionStart} au ${IPO_CAMPAIGN.subscriptionEnd}, avec clôture anticipée possible.`,
                },
              ].map((item, index) => (
                <article
                  key={item.title}
                  data-reveal
                  className="ipo-reveal relative"
                  style={{ transitionDelay: `${index * 80}ms` }}
                >
                  <div className="flex items-center gap-4 lg:block">
                    <span
                      aria-hidden
                      className="pointer-events-none shrink-0 select-none text-4xl font-extrabold leading-none tracking-[-0.04em] text-everest-green/8 sm:text-5xl lg:text-[5.5rem]"
                    >
                      {item.index}
                    </span>
                    <h3 className="text-xl font-semibold tracking-[-0.02em] text-night-80 lg:mt-4">
                      {item.title}
                    </h3>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-text-secondary">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#021f1d] text-white">
        <div className="mx-auto max-w-[1400px] px-5 py-12 sm:px-10 lg:px-12">
          <div className="mb-10 flex flex-col gap-6 border-b border-white/10 pb-10 sm:flex-row sm:items-center sm:justify-between">
            <EverestLogo />
            <div className="flex flex-wrap items-center gap-4">
              <a
                href={whatsappHref ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="ipo-nav-link text-sm font-medium no-underline"
              >
                Question sur WhatsApp
              </a>
              <p className="text-xs text-white/45">Campagne IPO Bridge Bank · 2026</p>
            </div>
          </div>
          <p className="max-w-4xl text-xs leading-6 text-white/40">
            EVEREST Finance vous accompagne dans votre souscription. Laissez vos coordonnées : un conseiller
            vous recontacte pour finaliser votre dossier.
          </p>
        </div>
      </footer>
    </div>
  )
}
