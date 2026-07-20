import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

import { Button, buttonVariants } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Panel, PanelBody, PanelHeader } from '#/components/ui/panel'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Textarea } from '#/components/ui/textarea'
import { useCampaignContact } from '#/hooks/use-campaign-contact'
import { BRIDGE_BANK_IPO_CAMPAIGN_ID } from '#/lib/campaigns'
import {
  BULLETIN_FIELD_IDS as ID,
  GENDER_OPTIONS,
  ID_TYPE_OPTIONS,
  NATIONALITY_OPTIONS,
  OCCUPATION_OPTIONS,
  ORG_TYPE_OPTIONS,
  PAYMENT_OPTIONS,
  RESIDENCE_OPTIONS,
  SHARE_PRICE_FCFA,
  SIGNATURE_HEIGHT,
  SIGNATURE_WIDTH,
  SUBSCRIBER_TYPES,
  SUBSCRIPTION_PLACE_OPTIONS,
  computeBulletinTotals,
  enrichBulletinAnswers,
  parseSignature,
  serializeSignature,
  type SignatureStroke,
  validateBulletinStep,
  type SubscriberType,
} from '#/lib/ipo-bulletin'
import { getSessionId, rotateSessionId } from '#/lib/session-id'
import { HONEYPOT_FIELD_ID } from '#/lib/submission-hygiene'
import { cn } from '#/lib/utils'
import { client } from '#/orpc/client'

type StepId = 'type' | 'identity' | 'physique' | 'morale' | 'subscription'

function formatFcfa(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n)
}

function SignaturePad({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [strokes, setStrokes] = useState<SignatureStroke[]>(() => parseSignature(value) ?? [])
  const drawing = useRef(false)

  function pointFromEvent(event: ReactPointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect()
    return {
      x: Math.max(
        0,
        Math.min(SIGNATURE_WIDTH, ((event.clientX - bounds.left) / bounds.width) * SIGNATURE_WIDTH),
      ),
      y: Math.max(
        0,
        Math.min(
          SIGNATURE_HEIGHT,
          ((event.clientY - bounds.top) / bounds.height) * SIGNATURE_HEIGHT,
        ),
      ),
    }
  }

  function updateStrokes(update: (current: SignatureStroke[]) => SignatureStroke[]) {
    setStrokes((current) => {
      const next = update(current)
      onChange(serializeSignature(next))
      return next
    })
  }

  function handlePointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    drawing.current = true
    const point = pointFromEvent(event)
    updateStrokes((current) => [...current, [point]])
  }

  function handlePointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    if (!drawing.current) return
    event.preventDefault()
    const point = pointFromEvent(event)
    updateStrokes((current) => {
      const pointCount = current.reduce((total, stroke) => total + stroke.length, 0)
      if (pointCount >= 500) return current
      const lastStroke = current.at(-1)
      const lastPoint = lastStroke?.at(-1)
      if (!lastStroke || !lastPoint) return current
      if (Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y) < 4) return current
      return [...current.slice(0, -1), [...lastStroke, point]]
    })
  }

  function handlePointerEnd(event: ReactPointerEvent<SVGSVGElement>) {
    drawing.current = false
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const hasSignature = parseSignature(serializeSignature(strokes)) !== null

  return (
    <div className="overflow-hidden rounded-xl border border-everest-green/15 bg-white">
      <div className="flex items-center justify-between gap-4 border-b border-everest-green/10 px-4 py-3">
        <p className="text-xs text-text-secondary">
          Signez avec votre doigt, votre souris ou votre stylet.
        </p>
        <button
          type="button"
          className="shrink-0 text-xs font-medium text-everest-green underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
          disabled={strokes.length === 0}
          onClick={() => updateStrokes(() => [])}
        >
          Effacer
        </button>
      </div>
      <svg
        viewBox={`0 0 ${SIGNATURE_WIDTH} ${SIGNATURE_HEIGHT}`}
        role="img"
        aria-label="Zone de signature du souscripteur"
        className="block aspect-10/3 w-full cursor-crosshair touch-none bg-[#fdfcf9]"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        <line
          x1="70"
          y1="245"
          x2="930"
          y2="245"
          stroke="currentColor"
          strokeWidth="2"
          className="text-everest-green/12"
        />
        {strokes.map((stroke, index) => (
          <polyline
            key={index}
            points={stroke.map(({ x, y }) => `${x},${y}`).join(' ')}
            fill="none"
            stroke="#071b1a"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
      <p className="border-t border-everest-green/10 px-4 py-2 text-xs text-text-secondary">
        {hasSignature ? 'Signature enregistrée' : 'Signature requise'}
      </p>
    </div>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label className="text-gold/90">
        {label}
        {required ? ' *' : ''}
      </Label>
      {children}
    </div>
  )
}

function SelectField({
  id,
  value,
  placeholder,
  options,
  onChange,
}: {
  id: string
  value: string
  placeholder?: string
  options: readonly string[]
  onChange: (v: string) => void
}) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger id={id}>
        <SelectValue placeholder={placeholder ?? 'Sélectionner…'} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function BulletinForm({
  formId,
  slug,
  defaultUtmSource = 'bulletin',
}: {
  formId: string
  slug: string
  /** Used when the page URL has no utm_source (e.g. embedded on the landing). */
  defaultUtmSource?: string
}) {
  const [sessionId, setSessionId] = useState(() => getSessionId())
  const { data: campaignContact } = useCampaignContact(BRIDGE_BANK_IPO_CAMPAIGN_ID)
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({
    [ID.date]: new Date().toISOString().slice(0, 10),
    [ID.sgiBtcc]: 'EVEREST Finance',
  })
  const [honeypot, setHoneypot] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState<{ thankYou: string; submissionId: string } | null>(null)
  const [formKey, setFormKey] = useState(0)
  const doneRef = useRef(done)
  doneRef.current = done

  function startOver() {
    setFormKey((key) => key + 1)
    setSessionId(rotateSessionId())
    setStepIndex(0)
    setAnswers({
      [ID.date]: new Date().toISOString().slice(0, 10),
      [ID.sgiBtcc]: 'EVEREST Finance',
    })
    setHoneypot('')
    setError(null)
    setLoading(false)
    setDone(null)
  }

  useEffect(() => {
    const onStart = () => {
      if (doneRef.current) startOver()
    }
    window.addEventListener('ipo:start-bulletin', onStart)
    return () => window.removeEventListener('ipo:start-bulletin', onStart)
  }, [])

  const subscriberType = answers[ID.subscriberType] as SubscriberType | undefined

  const steps = useMemo(() => {
    const base: { id: StepId; title: string }[] = [
      { id: 'type', title: 'Type de souscripteur' },
      { id: 'identity', title: 'Identité' },
    ]
    if (subscriberType === 'Personne morale') {
      base.push({ id: 'morale', title: 'Personne morale' })
    } else {
      base.push({ id: 'physique', title: 'Situation professionnelle' })
    }
    base.push({ id: 'subscription', title: 'Souscription & paiement' })
    return base
  }, [subscriberType])

  const step = steps[Math.min(stepIndex, steps.length - 1)]!
  const isLast = stepIndex === steps.length - 1
  const progress = Math.round(((stepIndex + 1) / steps.length) * 100)

  function set(fieldId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }))
  }

  function selectSubscriberType(type: SubscriberType) {
    setAnswers((prev) => ({ ...prev, [ID.subscriberType]: type }))
    setError(null)
    setStepIndex(1)
  }

  const shareCount = Number(answers[ID.shareCount] || 0)
  const totals =
    Number.isFinite(shareCount) && shareCount > 0
      ? computeBulletinTotals(shareCount)
      : null

  async function goNext() {
    if (!step) return
    const validationError = validateBulletinStep(step.id, answers)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)

    if (!isLast) {
      setStepIndex((i) => i + 1)
      return
    }

    setLoading(true)
    try {
      const enriched = enrichBulletinAnswers(answers)
      if (totals) {
        enriched[ID.totalFcfa] = String(totals.totalFcfa)
        enriched[ID.totalLetters] = totals.totalLetters
      }

      const params = new URLSearchParams(window.location.search)
      const result = await client.submissions.submit({
        slug,
        sessionId,
        answers: enriched,
        honeypot: honeypot || undefined,
        metadata: {
          utmSource: params.get('utm_source') ?? defaultUtmSource,
          utmMedium: params.get('utm_medium') ?? 'web',
          utmCampaign: params.get('utm_campaign') ?? undefined,
          referrer: document.referrer || undefined,
          userAgent: navigator.userAgent,
        },
      })
      await client.analytics.track({
        formId,
        sessionId,
        eventType: 'form_completed',
      })
      // Next fill must not collide with session-level idempotency.
      setSessionId(rotateSessionId())
      setDone({ thankYou: result.thankYouMessage, submissionId: result.submissionId })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'envoi")
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <Panel className="ipo-form-panel w-full max-w-none rounded-[2rem]">
        <PanelBody className="space-y-5 py-14 text-center">
          <div className="ipo-form-success-mark" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12.5 9.5 17 19 7.5"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold tracking-[-0.03em] text-night-80">
            Bulletin enregistré
          </h2>
          <p className="mx-auto max-w-md text-base leading-relaxed text-text-secondary">
            {done.thankYou}
          </p>
          <p className="mx-auto max-w-md text-sm leading-7 text-text-secondary">
            Un conseiller vous recontacte pour finaliser le règlement. Le bulletin signé est
            disponible côté admin.
          </p>
          <div className="flex flex-col items-center gap-3 pt-2">
            <Button
              type="button"
              variant="everest"
              size="sm"
              onClick={startOver}
            >
              Remplir un autre bulletin
            </Button>
            {campaignContact?.whatsappUrl ? (
              <a
                href={campaignContact.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-ui="button"
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
              >
                Ouvrir WhatsApp
              </a>
            ) : null}
            <a
              href="#top"
              className="text-sm font-medium text-everest-green no-underline hover:text-gold"
            >
              ← Retour en haut de page
            </a>
          </div>
        </PanelBody>
      </Panel>
    )
  }

  return (
    <Panel className="ipo-form-panel relative w-full max-w-none rounded-[2rem]">
      <PanelHeader className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium tabular-nums text-text-secondary">
            {stepIndex + 1} / {steps.length}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">
            Bulletin de souscription
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-everest-green-10">
          <div
            className="h-full rounded-full bg-linear-to-r from-everest-green via-everest-green to-gold transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <h1 className="text-[1.75rem] font-bold tracking-[-0.03em] text-night-80 sm:text-[2rem]">
          {step.title}
        </h1>
        {step.id === 'subscription' && totals ? (
          <p className="text-sm text-text-secondary">
            Prix unitaire {formatFcfa(SHARE_PRICE_FCFA)} FCFA · Total{' '}
            <span className="font-semibold text-everest-green">
              {formatFcfa(totals.totalFcfa)} FCFA
            </span>
          </p>
        ) : null}
      </PanelHeader>

      <PanelBody className="space-y-6">
        <div
          aria-hidden="true"
          className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden opacity-0"
        >
          <label htmlFor={HONEYPOT_FIELD_ID}>Company website</label>
          <input
            id={HONEYPOT_FIELD_ID}
            name={HONEYPOT_FIELD_ID}
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </div>

        {step.id === 'type' ? (
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">
              Vous souscrivez en tant que <span className="text-gold">*</span>
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {SUBSCRIBER_TYPES.map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={type === 'Personne physique' ? 'default' : 'everest'}
                  size="lg"
                  className={cn(
                    'h-auto w-full justify-center px-5 py-4 text-base',
                    type === 'Personne physique' && 'ipo-cta-gold',
                  )}
                  onClick={() => selectSubscriberType(type)}
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>
        ) : null}

        {step.id === 'identity' ? (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nom(s)" required>
                <Input
                  value={answers[ID.lastName] ?? ''}
                  onChange={(e) => set(ID.lastName, e.target.value)}
                  placeholder="Nom de famille"
                />
              </Field>
              <Field label="Prénom(s)" required>
                <Input
                  value={answers[ID.firstName] ?? ''}
                  onChange={(e) => set(ID.firstName, e.target.value)}
                  placeholder="Prénoms"
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date de naissance" required>
                <Input
                  type="date"
                  value={answers[ID.birthDate] ?? ''}
                  onChange={(e) => set(ID.birthDate, e.target.value)}
                />
              </Field>
              <Field label="Lieu de naissance" required>
                <Input
                  value={answers[ID.birthPlace] ?? ''}
                  onChange={(e) => set(ID.birthPlace, e.target.value)}
                  placeholder="Ville, pays"
                />
              </Field>
            </div>
            <Field label="Nationalité" required>
              <SelectField
                id={ID.nationality}
                value={answers[ID.nationality] ?? ''}
                options={NATIONALITY_OPTIONS}
                onChange={(v) => set(ID.nationality, v)}
              />
            </Field>
            <Field label="Pays de résidence" required>
              <SelectField
                id={ID.residence}
                value={answers[ID.residence] ?? ''}
                options={RESIDENCE_OPTIONS}
                onChange={(v) => set(ID.residence, v)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Lieu de souscription" required>
                <SelectField
                  id={ID.subscriptionPlace}
                  value={answers[ID.subscriptionPlace] ?? ''}
                  options={SUBSCRIPTION_PLACE_OPTIONS}
                  onChange={(v) => set(ID.subscriptionPlace, v)}
                />
              </Field>
              <Field label="Sexe" required>
                <SelectField
                  id={ID.gender}
                  value={answers[ID.gender] ?? ''}
                  options={GENDER_OPTIONS}
                  onChange={(v) => set(ID.gender, v)}
                />
              </Field>
            </div>
            <Field label="Pièce d'identité" required>
              <SelectField
                id={ID.idType}
                value={answers[ID.idType] ?? ''}
                options={ID_TYPE_OPTIONS}
                onChange={(v) => set(ID.idType, v)}
              />
            </Field>
            <Field label="Numéro pièce d'identité" required>
              <Input
                value={answers[ID.idNumber] ?? ''}
                onChange={(e) => set(ID.idNumber, e.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Délivrée le">
                <Input
                  type="date"
                  value={answers[ID.idIssuedOn] ?? ''}
                  onChange={(e) => set(ID.idIssuedOn, e.target.value)}
                />
              </Field>
              <Field label="Par">
                <Input
                  value={answers[ID.idIssuedBy] ?? ''}
                  onChange={(e) => set(ID.idIssuedBy, e.target.value)}
                  placeholder="Autorité / lieu"
                />
              </Field>
            </div>
            <Field label="Adresse postale" required>
              <Textarea
                rows={2}
                value={answers[ID.address] ?? ''}
                onChange={(e) => set(ID.address, e.target.value)}
              />
            </Field>
            <Field label="Localité" required>
              <Input
                value={answers[ID.locality] ?? ''}
                onChange={(e) => set(ID.locality, e.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Téléphone" required>
                <Input
                  type="tel"
                  value={answers[ID.phone] ?? ''}
                  onChange={(e) => set(ID.phone, e.target.value)}
                  placeholder="+225 …"
                />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  value={answers[ID.email] ?? ''}
                  onChange={(e) => set(ID.email, e.target.value)}
                />
              </Field>
            </div>
            <Field label="Fax">
              <Input
                value={answers[ID.fax] ?? ''}
                onChange={(e) => set(ID.fax, e.target.value)}
              />
            </Field>
          </div>
        ) : null}

        {step.id === 'physique' ? (
          <div className="space-y-5">
            <Field label="Catégorie professionnelle" required>
              <SelectField
                id={ID.occupation}
                value={answers[ID.occupation] ?? ''}
                options={OCCUPATION_OPTIONS}
                onChange={(v) => set(ID.occupation, v)}
              />
            </Field>
            {answers[ID.occupation] === 'Autre' ? (
              <Field label="Précisez" required>
                <Input
                  value={answers[ID.occupationOther] ?? ''}
                  onChange={(e) => set(ID.occupationOther, e.target.value)}
                />
              </Field>
            ) : null}
            <Field label="Désignation de l'employeur">
              <Input
                value={answers[ID.employerName] ?? ''}
                onChange={(e) => set(ID.employerName, e.target.value)}
              />
            </Field>
            <Field label="Adresse de l'employeur">
              <Textarea
                rows={2}
                value={answers[ID.employerAddress] ?? ''}
                onChange={(e) => set(ID.employerAddress, e.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Téléphone employeur">
                <Input
                  type="tel"
                  value={answers[ID.employerPhone] ?? ''}
                  onChange={(e) => set(ID.employerPhone, e.target.value)}
                />
              </Field>
              <Field label="Email employeur">
                <Input
                  type="email"
                  value={answers[ID.employerEmail] ?? ''}
                  onChange={(e) => set(ID.employerEmail, e.target.value)}
                />
              </Field>
            </div>
          </div>
        ) : null}

        {step.id === 'morale' ? (
          <div className="space-y-5">
            <Field label="Type d'organisation" required>
              <SelectField
                id={ID.orgType}
                value={answers[ID.orgType] ?? ''}
                options={ORG_TYPE_OPTIONS}
                onChange={(v) => set(ID.orgType, v)}
              />
            </Field>
            {answers[ID.orgType] === 'Autres' ? (
              <Field label="Précisez" required>
                <Input
                  value={answers[ID.orgTypeOther] ?? ''}
                  onChange={(e) => set(ID.orgTypeOther, e.target.value)}
                />
              </Field>
            ) : null}
            <Field label="Agissant en qualité de" required>
              <Input
                value={answers[ID.actingAs] ?? ''}
                onChange={(e) => set(ID.actingAs, e.target.value)}
                placeholder="Président, DG, Mandataire…"
              />
            </Field>
            <Field label="Dénomination" required>
              <Input
                value={answers[ID.companyName] ?? ''}
                onChange={(e) => set(ID.companyName, e.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Forme juridique">
                <Input
                  value={answers[ID.legalForm] ?? ''}
                  onChange={(e) => set(ID.legalForm, e.target.value)}
                  placeholder="SA, SARL…"
                />
              </Field>
              <Field label="Capital social (FCFA)">
                <Input
                  type="number"
                  min={0}
                  value={answers[ID.shareCapital] ?? ''}
                  onChange={(e) => set(ID.shareCapital, e.target.value)}
                />
              </Field>
            </div>
            <Field label="Adresse postale">
              <Textarea
                rows={2}
                value={answers[ID.orgAddress] ?? ''}
                onChange={(e) => set(ID.orgAddress, e.target.value)}
              />
            </Field>
            <Field label="Localité">
              <Input
                value={answers[ID.orgLocality] ?? ''}
                onChange={(e) => set(ID.orgLocality, e.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Téléphone">
                <Input
                  type="tel"
                  value={answers[ID.orgPhone] ?? ''}
                  onChange={(e) => set(ID.orgPhone, e.target.value)}
                />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  value={answers[ID.orgEmail] ?? ''}
                  onChange={(e) => set(ID.orgEmail, e.target.value)}
                />
              </Field>
            </div>
          </div>
        ) : null}

        {step.id === 'subscription' ? (
          <div className="space-y-5">
            <Field label="Nombre d'actions" required>
              <Input
                type="number"
                min={1}
                step={1}
                value={answers[ID.shareCount] ?? ''}
                onChange={(e) => set(ID.shareCount, e.target.value)}
              />
            </Field>
            {totals ? (
              <div className="rounded-xl border border-everest-green/15 bg-everest-green-05 px-4 py-3 text-sm text-night-80">
                <p>
                  Total : <strong>{formatFcfa(totals.totalFcfa)} FCFA</strong>
                </p>
                <p className="mt-1 text-text-secondary capitalize">{totals.totalLetters}</p>
              </div>
            ) : null}
            <Field label="SGI / BTCC de domiciliation">
              <Input
                value={answers[ID.sgiBtcc] ?? ''}
                onChange={(e) => set(ID.sgiBtcc, e.target.value)}
              />
            </Field>
            <Field label="Moyen de paiement" required>
              <SelectField
                id={ID.paymentMethod}
                value={answers[ID.paymentMethod] ?? ''}
                options={PAYMENT_OPTIONS}
                onChange={(v) => set(ID.paymentMethod, v)}
              />
            </Field>
            {answers[ID.paymentMethod] === 'Chèque' ? (
              <Field label="Chèque n°" required>
                <Input
                  value={answers[ID.chequeNumber] ?? ''}
                  onChange={(e) => set(ID.chequeNumber, e.target.value)}
                />
              </Field>
            ) : null}
            <Field label="Banque / établissement financier">
              <Input
                value={answers[ID.bankName] ?? ''}
                onChange={(e) => set(ID.bankName, e.target.value)}
              />
            </Field>
            <Field label="N° de compte à débiter">
              <Input
                value={answers[ID.accountNumber] ?? ''}
                onChange={(e) => set(ID.accountNumber, e.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Lieu" required>
                <Input
                  value={answers[ID.place] ?? ''}
                  onChange={(e) => set(ID.place, e.target.value)}
                  placeholder="Abidjan, Dakar…"
                />
              </Field>
              <Field label="Date" required>
                <Input
                  type="date"
                  value={answers[ID.date] ?? ''}
                  onChange={(e) => set(ID.date, e.target.value)}
                />
              </Field>
            </div>
            <Field label="Signature du souscripteur" required>
              <SignaturePad
                key={formKey}
                value={answers[ID.signature] ?? ''}
                onChange={(value) => set(ID.signature, value)}
              />
            </Field>
            <label className="flex items-start gap-3 rounded-xl border border-everest-green/15 px-4 py-3 text-sm text-night-80">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-everest-green"
                checked={answers[ID.certify] === 'true'}
                onChange={(e) => set(ID.certify, e.target.checked ? 'true' : 'false')}
              />
              <span>
                J&apos;ai pris connaissance des spécificités de l&apos;offre et je certifie
                l&apos;exactitude des informations fournies. *
              </span>
            </label>
          </div>
        ) : null}

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {step.id !== 'type' ? (
          <div className="flex items-center justify-between gap-3 border-t border-everest-green/8 pt-6">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => {
                setError(null)
                setStepIndex((i) => Math.max(0, i - 1))
              }}
              className="border-everest-green/25 text-everest-green"
            >
              Retour
            </Button>
            <Button
              variant={isLast ? 'default' : 'everest'}
              showArrow={isLast}
              disabled={loading}
              onClick={() => void goNext()}
              className={cn(isLast && 'ipo-cta-gold')}
            >
              {loading ? 'Envoi…' : isLast ? 'Enregistrer mon bulletin' : 'Continuer'}
            </Button>
          </div>
        ) : null}
      </PanelBody>
    </Panel>
  )
}
