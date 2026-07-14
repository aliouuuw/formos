import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState, type Ref } from 'react'

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
import { trackCampaignEvent } from '#/lib/campaign-analytics'
import { useCampaignContact } from '#/hooks/use-campaign-contact'
import { cn } from '#/lib/utils'
import { orpc } from '#/orpc/client'

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

function DownloadDisc({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'ml-1 flex h-7 w-7 items-center justify-center rounded-full transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-y-0.5',
        className,
      )}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
        <path
          d="M7 2.5v6.5M4.5 7.5 7 10l2.5-2.5M3 11.5h8"
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
  pulse = false,
}: {
  children: React.ReactNode
  variant: 'gold' | 'ghost-light' | 'ghost-dark'
  className?: string
  pulse?: boolean
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
        pulse && 'ipo-cta-pulse',
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
  onTrackClick,
}: {
  children: React.ReactNode
  variant: 'gold' | 'ghost-light' | 'ghost-dark'
  className?: string
  onTrackClick?: () => void
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
      onClick={onTrackClick}
      className={cn(
        buttonVariants({ variant: buttonVariant, size: 'lg' }),
        'transition-transform duration-150 ease-out',
        variant === 'gold' && 'ipo-cta-gold hover:shadow-[0_14px_32px_rgba(203,152,36,0.28)]',
        className,
      )}
    >
      {children}
      <DownloadDisc
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

const FOOTER_SOCIAL_LINK_CLASS =
  'flex h-10 w-10 items-center justify-center rounded-full border border-white/35 text-white transition-colors hover:border-white/55 hover:bg-white/5'

function FloatingWhatsAppButton({
  href,
  onTrackClick,
}: {
  href: string | undefined
  onTrackClick: () => void
}) {
  const configured = Boolean(href && href !== '#')

  return (
    <a
      href={configured ? href : '#'}
      target={configured ? '_blank' : undefined}
      rel={configured ? 'noopener noreferrer' : undefined}
      aria-label="Question sur WhatsApp"
      title={
        configured
          ? 'Question sur WhatsApp'
          : 'WhatsApp non configuré — renseignez le numéro dans Paramètres'
      }
      onClick={(event) => {
        if (!configured) {
          event.preventDefault()
          return
        }
        onTrackClick()
      }}
      className={cn(
        'fixed bottom-5 right-5 z-[100] flex h-14 w-14 items-center justify-center rounded-full',
        'bg-[#25D366] text-white shadow-[0_8px_28px_rgba(37,211,102,0.38)]',
        'transition-transform duration-200 hover:scale-105 hover:shadow-[0_12px_36px_rgba(37,211,102,0.48)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-everest-green',
        'sm:bottom-8 sm:right-8',
        !configured && 'opacity-70',
      )}
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white text-white" fill="currentColor" aria-hidden>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
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
  const subscribeFormQuery = useQuery(
    orpc.forms.getBySlug.queryOptions({ input: { slug: IPO_FORM_SLUGS.subscribe } }),
  )
  const campaignFormId = subscribeFormQuery.data?.id

  const trackWhatsAppClick = (placement: string) => {
    trackCampaignEvent(campaignFormId, 'whatsapp_click', {
      placement,
      campaignId: BRIDGE_BANK_IPO_CAMPAIGN_ID,
    })
  }

  const trackGuideDownload = (placement: string) => {
    trackCampaignEvent(campaignFormId, 'guide_download', {
      placement,
      campaignId: BRIDGE_BANK_IPO_CAMPAIGN_ID,
    })
  }

  const phase = getIpoCampaignPhase()
  const phaseCopy = getIpoPhaseCopy(phase)

  return (
    <div ref={rootRef as unknown as Ref<HTMLDivElement>} className="ipo-campaign relative min-h-dvh overflow-x-hidden bg-(--summit-ivory)">
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
          'pointer-events-none absolute inset-x-0 z-40',
          phase !== 'launch' ? 'top-14 pt-3 sm:pt-4' : 'top-0 pt-5 sm:pt-6',
        )}
      >
        <div className="pointer-events-auto mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 px-5 sm:px-10 lg:px-12">
          <EverestLogo className="h-20 sm:h-24" />
          <GuidePdfLink
            variant="ghost-light"
            className="h-10 border-0 px-4 text-xs hover:border-0 sm:h-11 sm:px-5 sm:text-sm"
            onTrackClick={() => trackGuideDownload('header')}
          >
            {phaseCopy.secondaryCta}
          </GuidePdfLink>
        </div>
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
            {/* <div className="absolute inset-0 bg-[linear-gradient(108deg,rgba(1,45,42,0.96)_0%,rgba(1,45,42,0.82)_38%,rgba(1,45,42,0.45)_68%,rgba(1,45,42,0.62)_100%)]" /> */}
            {/* <div
              data-hero-haze
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_72%_32%,rgba(203,152,36,0.22),transparent_44%)] will-change-transform"
            /> */}
          </div>

          <div
            data-hero-content
            className="relative z-10 mx-auto flex min-h-dvh max-w-[1400px] flex-col justify-end px-5 pb-20 pt-36 sm:px-10 sm:pb-24 lg:justify-center lg:px-12 lg:pb-28 lg:pt-32 will-change-transform"
          >
            <div className="max-w-6xl">
              <h1
                className="ipo-reveal max-w-[16ch] text-[clamp(2.75rem,6.2vw,5.75rem)] font-extrabold leading-[0.94] tracking-[-0.05em] text-white"
                data-reveal
                style={{ transitionDelay: '70ms' }}
              >
                Investissez dans la prochaine étape de{' '}
                <span className="text-gold">Bridge Bank</span>
              </h1>
              <p
                className="ipo-reveal mt-8 max-w-4xl text-base font-light leading-8 text-white/74 sm:text-lg sm:leading-9"
                data-reveal
                style={{ transitionDelay: '130ms' }}
              >
                {phaseCopy.heroSupport[0]}
                <br />
                {phaseCopy.heroSupport[1]}
              </p>
              <div
                className="ipo-reveal mt-11 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center"
                data-reveal
                style={{ transitionDelay: '190ms' }}
              >
                {phase === 'closed' ? (
                  <a
                    href={whatsappHref ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-ui="button"
                    onClick={() => trackWhatsAppClick('hero')}
                    className={cn(
                      buttonVariants({ variant: 'default', size: 'lg' }),
                      'ipo-cta-gold',
                    )}
                  >
                    {phaseCopy.primaryCta}
                    <ArrowDisc className="bg-white/18 text-white" />
                  </a>
                ) : (
                  <CampaignLink variant="gold" pulse>
                    {phaseCopy.primaryCta}
                  </CampaignLink>
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
                <span className="text-[1.75rem] font-bold tracking-[-0.04em] tabular-nums text-everest-green sm:text-3xl">
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
              <dd className="mt-3 text-[1.75rem] font-bold tracking-[-0.04em] text-everest-green sm:text-3xl">
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
                <span className="text-[1.75rem] font-bold tracking-[-0.04em] text-everest-green sm:text-3xl">
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
              <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-bold tracking-[-0.04em] text-everest-green leading-[1.05]">
                Pourquoi acheter des actions <br /><strong>BBG CI</strong> ?
              </h2>
            </div>

            <ul className="mt-16 grid gap-px overflow-hidden rounded-[2rem] sm:grid-cols-2">
              {BBG_INVESTMENT_REASONS.map((reason, index) => (
                <li
                  key={reason}
                  data-reveal
                  className="ipo-reveal group flex gap-5 bg-white px-6 transition-colors duration-300 sm:gap-6 sm:p-8 lg:hover:bg-[#faf8f4]"
                  style={{ transitionDelay: `${index * 60}ms` }}
                >
                  <span
                    aria-hidden
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/35 bg-gold/10 text-xs font-bold tabular-nums tracking-wide text-gold transition-colors duration-300 group-hover:border-gold/55 group-hover:bg-gold/16"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <p className="pt-2 text-base font-medium leading-6 text-night-80">{reason}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-everest-green text-white">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-5 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-12">
          <p className="max-w-4xl text-xs leading-6 text-white/40">
            EVEREST Finance, Société agréée et régulée par l&apos;AMF-UMOA n° SGI/2016-01
          </p>
          <nav aria-label="Réseaux sociaux" className="flex items-center gap-3">
            <a
              href="https://www.linkedin.com/company/20529632/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Everest Finance sur LinkedIn"
              className={FOOTER_SOCIAL_LINK_CLASS}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white" aria-hidden>
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
            <a
              href="https://www.facebook.com/everestfinanceSGI/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Everest Finance sur Facebook"
              className={FOOTER_SOCIAL_LINK_CLASS}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white" aria-hidden>
                <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
              </svg>
            </a>
            <a
              href="https://www.tiktok.com/@everest_finance"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Everest Finance sur TikTok"
              className={FOOTER_SOCIAL_LINK_CLASS}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white" aria-hidden>
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.76-1.6.08-.33.18-.67.18-1.01.02-3.72.02-7.44.02-11.16z" />
              </svg>
            </a>
          </nav>
        </div>
      </footer>

      <FloatingWhatsAppButton
        href={whatsappHref}
        onTrackClick={() => trackWhatsAppClick('floating')}
      />
    </div>
  )
}
