import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState, type Ref, type RefObject } from 'react'

import { BulletinForm } from '#/components/ipo/bulletin-form'
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

/** Keep trailing parentheticals (e.g. visa refs) on one line; force break before them on mobile. */
function formatReasonLabel(reason: string) {
  const visaMatch = reason.match(/^(.*?)(\s*)(\([^)]+\))$/)
  if (!visaMatch) return reason
  const [, lead, space, visa] = visaMatch
  // Non-breaking hyphen so "AMF-UMOA" never splits mid-acronym.
  const leadProtected = lead.replaceAll('AMF-UMOA', 'AMF\u2011UMOA')
  return (
    <>
      {leadProtected}
      <br className="sm:hidden" />
      <span className="hidden sm:inline">{space}</span>
      <span className="whitespace-nowrap">{visa}</span>
    </>
  )
}

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
    <a
      ref={magneticRef}
      data-ui="button"
      href="#bulletin"
      onClick={() => {
        window.dispatchEvent(new Event('ipo:start-bulletin'))
      }}
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
    </a>
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
  buttonRef,
}: {
  href: string | undefined
  onTrackClick: () => void
  buttonRef?: Ref<HTMLAnchorElement>
}) {
  const configured = Boolean(href && href !== '#')
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setEntered(true)
      return
    }
    const id = window.setTimeout(() => setEntered(true), 480)
    return () => window.clearTimeout(id)
  }, [])

  return (
    <a
      ref={buttonRef}
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
        'fixed bottom-4 right-4 z-100 flex h-12 w-12 items-center justify-center rounded-full sm:bottom-8 sm:right-8 sm:h-14 sm:w-14',
        'bg-[#25D366] text-white shadow-[0_8px_28px_rgba(37,211,102,0.38)]',
        'transition-[transform,opacity,box-shadow] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]',
        'hover:scale-105 hover:shadow-[0_12px_36px_rgba(37,211,102,0.48)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-everest-green',
        entered
          ? configured
            ? 'translate-y-0 scale-100 opacity-100'
            : 'translate-y-0 scale-100 opacity-70'
          : 'translate-y-3 scale-90 opacity-0',
      )}
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white text-white sm:h-7 sm:w-7" fill="currentColor" aria-hidden>
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

/** Shifts footer social links left when the fixed WhatsApp button overlaps them. */
function useFooterNavWhatsAppClearance(
  navRef: RefObject<HTMLElement | null>,
  whatsappRef: RefObject<HTMLAnchorElement | null>,
) {
  const [clearance, setClearance] = useState(0)

  useEffect(() => {
    const nav = navRef.current
    const whatsapp = whatsappRef.current
    if (!nav || !whatsapp) return

    const gap = 16

    const check = () => {
      const navRect = nav.getBoundingClientRect()
      const btnRect = whatsapp.getBoundingClientRect()
      const verticallyOverlaps =
        navRect.bottom > btnRect.top && navRect.top < btnRect.bottom
      if (!verticallyOverlaps) {
        setClearance(0)
        return
      }
      const overlap = navRect.right + gap - btnRect.left
      setClearance(overlap > 0 ? Math.ceil(overlap) : 0)
    }

    check()
    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    return () => {
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
  }, [navRef, whatsappRef])

  return clearance
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
  const footerNavRef = useRef<HTMLElement>(null)
  const whatsappRef = useRef<HTMLAnchorElement>(null)
  const footerNavClearance = useFooterNavWhatsAppClearance(footerNavRef, whatsappRef)
  useHeroKinetic(heroRef)
  const { data: contact } = useCampaignContact(BRIDGE_BANK_IPO_CAMPAIGN_ID)
  const whatsappHref = contact?.whatsappUrl ?? undefined
  const subscribeFormQuery = useQuery(
    orpc.forms.getBySlug.queryOptions({ input: { slug: IPO_FORM_SLUGS.subscribe } }),
  )
  const bulletinFormQuery = useQuery(
    orpc.forms.getBySlug.queryOptions({ input: { slug: IPO_FORM_SLUGS.bulletin } }),
  )
  const campaignFormId = bulletinFormQuery.data?.id ?? subscribeFormQuery.data?.id

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
    <div
      ref={rootRef as unknown as Ref<HTMLDivElement>}
      id="top"
      className="ipo-campaign relative min-h-dvh overflow-x-hidden bg-(--summit-ivory)"
    >
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
        <div className="pointer-events-auto mx-auto flex w-full max-w-[1400px] items-center justify-between gap-3 px-5 sm:gap-4 sm:px-10 lg:px-12">
          <EverestLogo className="h-16 sm:h-24 lg:h-28" />
          <GuidePdfLink
            variant="ghost-light"
            className="h-9 shrink-0 border-0 px-2.5 text-[11px] hover:border-0 sm:h-11 sm:px-5 sm:text-sm"
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
            className="relative z-10 mx-auto flex min-h-dvh max-w-[1400px] flex-col justify-center px-5 py-28 sm:px-10 sm:py-32 lg:px-12 lg:py-28 will-change-transform"
          >
            <div className="mx-auto w-full max-w-6xl text-center sm:mx-0 sm:text-left">
              <h1
                className="ipo-reveal mx-auto max-w-[14ch] text-[clamp(2.35rem,9.5vw,3.75rem)] font-extrabold leading-[1.08] tracking-[-0.05em] text-white sm:mx-0 sm:max-w-[16ch] sm:leading-[1.2]"
                data-reveal
                style={{ transitionDelay: '70ms' }}
              >
                Investissez dans la prochaine étape de{' '}
                <span className="text-gold">Bridge Bank</span>
              </h1>
              <p
                className="ipo-reveal mx-auto mt-5 max-w-[34ch] text-base font-light leading-7 text-white/74 sm:mx-0 sm:mt-8 sm:max-w-4xl sm:text-lg sm:leading-8"
                data-reveal
                style={{ transitionDelay: '130ms' }}
              >
                {phaseCopy.heroSupport[0]}
                <br className="hidden sm:block" />
                <span className="sm:hidden"> </span>
                {phaseCopy.heroSupport[1]}
              </p>
              <div
                className="ipo-reveal mt-8 flex flex-col items-center gap-3 sm:mt-11 sm:flex-row sm:items-center"
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

        <section className="relative z-10 -mt-8 border border-everest-green/10 bg-white/95 shadow-[0_24px_60px_rgba(1,45,42,0.08)] backdrop-blur-sm sm:-mt-14">
          <dl className="mx-auto grid max-w-[1400px] grid-cols-3 divide-x divide-everest-green/10">
            <div className="ipo-reveal px-2.5 py-4 text-center sm:px-10 sm:py-9 sm:text-left lg:px-12" data-reveal>
              <dt className="text-[8px] font-medium uppercase leading-tight tracking-[0.14em] text-everest-green/55 sm:text-[10px] sm:tracking-[0.2em]">
                Prix par action
              </dt>
              <dd className="mt-1.5 sm:mt-3">
                <span className="text-[0.95rem] font-bold tracking-[-0.04em] tabular-nums text-everest-green sm:text-3xl">
                  <span ref={price.ref}>{new Intl.NumberFormat('fr-FR').format(price.value)}</span>
                </span>
                <span className="ml-1 text-[10px] font-medium text-gold sm:ml-2 sm:text-sm">FCFA</span>
              </dd>
            </div>
            <div
              className="ipo-reveal px-2.5 py-4 text-center sm:px-10 sm:py-9 sm:text-left lg:px-12"
              data-reveal
              style={{ transitionDelay: '50ms' }}
            >
              <dt className="text-[8px] font-medium uppercase leading-tight tracking-[0.14em] text-everest-green/55 sm:text-[10px] sm:tracking-[0.2em]">
                Fenêtre de souscription
              </dt>
              <dd className="mt-1.5 text-[0.8rem] font-bold leading-snug tracking-[-0.04em] text-everest-green sm:mt-3 sm:text-3xl sm:leading-none">
                20 juil. <span className="text-gold">→</span> 6 août
              </dd>
            </div>
            <div
              className="ipo-reveal px-2.5 py-4 text-center sm:px-10 sm:py-9 sm:text-left lg:px-12"
              data-reveal
              style={{ transitionDelay: '100ms' }}
            >
              <dt className="text-[8px] font-medium uppercase leading-tight tracking-[0.14em] text-everest-green/55 sm:text-[10px] sm:tracking-[0.2em]">
                Cotation visée
              </dt>
              <dd className="mt-1.5 sm:mt-3">
                <span className="text-[0.95rem] font-bold tracking-[-0.04em] text-everest-green sm:text-3xl">
                  Septembre
                </span>
                <span className="ml-1 text-[10px] font-medium text-gold sm:ml-2 sm:text-sm">2026</span>
              </dd>
            </div>
          </dl>
        </section>

        <section id="parcours" className="bg-(--summit-ivory)">
          <div className="mx-auto max-w-[1400px] px-5 py-14 sm:px-10 sm:py-24 lg:px-12 lg:py-36">
            <div className="ipo-reveal max-w-3xl" data-reveal>
              <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.24em] text-everest-green/50 sm:mb-4">
                Pourquoi investir
              </p>
              <h2 className="text-[clamp(1.65rem,7vw,3.5rem)] font-bold tracking-[-0.04em] text-everest-green leading-[1.1] sm:leading-[1.05]">
                Pourquoi acheter des actions{' '}
                <br className="hidden sm:block" />
                <strong>BBG CI</strong> ?
              </h2>
            </div>

            <ul className="mt-8 grid gap-px overflow-hidden rounded-3xl sm:mt-16 sm:rounded-[2rem] sm:grid-cols-2">
              {BBG_INVESTMENT_REASONS.map((reason, index) => (
                <li
                  key={reason}
                  data-reveal
                  className="ipo-reveal group flex gap-4 bg-white px-5 py-5 transition-colors duration-300 sm:gap-6 sm:p-8 lg:hover:bg-[#faf8f4]"
                  style={{ transitionDelay: `${index * 60}ms` }}
                >
                  <span
                    aria-hidden
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/35 bg-gold/10 text-xs font-bold tabular-nums tracking-wide text-gold transition-colors duration-300 group-hover:border-gold/55 group-hover:bg-gold/16 sm:h-11 sm:w-11"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <p className="pt-1.5 text-[0.9375rem] font-medium leading-6 text-night-80 sm:pt-2 sm:text-base">
                    {formatReasonLabel(reason)}
                  </p>
                </li>
              ))}
            </ul>

          </div>
        </section>

        {phase !== 'closed' ? (
          <section id="bulletin" className="scroll-mt-24 bg-white">
            <div className="mx-auto max-w-[1400px] px-5 py-14 sm:px-10 sm:py-24 lg:px-12 lg:py-28">
              <div className="ipo-reveal mx-auto max-w-3xl text-center" data-reveal>
                <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.24em] text-everest-green/50 sm:mb-4">
                  Dossier officiel
                </p>
                <h2 className="text-[clamp(1.65rem,7vw,3rem)] font-bold tracking-[-0.04em] text-everest-green leading-[1.1]">
                  Bulletin de souscription
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-text-secondary sm:text-base sm:leading-8">
                  Saisissez vos informations et signez en ligne : le bulletin officiel signé sera
                  prêt pour le règlement avec votre conseiller.
                </p>
              </div>

              <div className="ipo-reveal mx-auto mt-10 max-w-2xl sm:mt-14" data-reveal>
                {bulletinFormQuery.data ? (
                  <BulletinForm
                    key={`${bulletinFormQuery.data.id}-v${bulletinFormQuery.data.version}`}
                    formId={bulletinFormQuery.data.id}
                    slug={bulletinFormQuery.data.slug}
                    defaultUtmSource="landing-bulletin"
                  />
                ) : bulletinFormQuery.isError ? (
                  <div className="rounded-[1.5rem] border border-everest-green/10 bg-(--summit-ivory) px-6 py-10 text-center">
                    <p className="text-sm text-text-secondary">
                      Le bulletin n&apos;est pas disponible pour le moment.
                    </p>
                    <Link
                      to="/f/$slug"
                      params={{ slug: IPO_FORM_SLUGS.bulletin }}
                      search={ipoFormSearchParams('bulletin')}
                      data-ui="button"
                      className={cn(buttonVariants({ variant: 'everest', size: 'lg' }), 'mt-5')}
                    >
                      Réessayer sur la page dédiée
                      <ArrowDisc className="bg-everest-green/10 text-everest-green" />
                    </Link>
                  </div>
                ) : (
                  <div className="rounded-[1.5rem] border border-everest-green/10 bg-(--summit-ivory) px-6 py-14 text-center text-sm text-text-secondary">
                    Chargement du bulletin…
                  </div>
                )}

                <p className="mt-8 text-center text-sm text-text-secondary">
                  Vous préférez être rappelé ?{' '}
                  <Link
                    to="/f/$slug"
                    params={{ slug: IPO_FORM_SLUGS.subscribe }}
                    search={ipoFormSearchParams()}
                    className="font-medium text-everest-green underline-offset-4 hover:underline"
                  >
                    Laissez vos coordonnées
                  </Link>
                </p>
              </div>
            </div>
          </section>
        ) : null}
      </main>

      <footer className="border-t border-white/10 bg-everest-green text-white">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center gap-5 px-5 py-6 md:pb-24 text-center sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-10 sm:py-7 sm:pb-7 sm:text-left lg:px-12">
          <p className="max-w-4xl text-xs leading-5 text-white/40 sm:leading-6">
            EVEREST Finance, Société agréée et régulée par l&apos;AMF-UMOA <br /> n° SGI/2016-01
          </p>
          <nav
            ref={footerNavRef}
            aria-label="Réseaux sociaux"
            className="flex items-center gap-3 transition-[margin] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
            style={{
              marginRight: footerNavClearance > 0 ? footerNavClearance : undefined,
            }}
          >
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
        buttonRef={whatsappRef}
        onTrackClick={() => trackWhatsAppClick('floating')}
      />
    </div>
  )
}
