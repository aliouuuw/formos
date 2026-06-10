import { useEffect, useMemo, useRef, useState } from 'react'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Panel, PanelBody, PanelHeader } from '#/components/ui/panel'
import { Textarea } from '#/components/ui/textarea'
import type { FormDefinition, FormField } from '#/lib/form-types'
import { client } from '#/orpc/client'

function getSessionId() {
  const key = 'formos_session_id'
  const existing = localStorage.getItem(key)
  if (existing) return existing
  const id = crypto.randomUUID()
  localStorage.setItem(key, id)
  return id
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FormField
  value: string
  onChange: (value: string) => void
}) {
  const common = {
    id: field.id,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      onChange(e.target.value),
    placeholder: field.placeholder,
    required: field.required,
  }

  if (field.type === 'long_text') {
    return <Textarea {...common} rows={4} />
  }

  if (field.type === 'select') {
    return (
      <select
        id={field.id}
        value={value}
        onChange={common.onChange}
        required={field.required}
        className="flex h-10 w-full rounded-xl border border-mauve/15 bg-white px-3 py-2 text-sm text-night focus:border-mauve focus:outline-none focus:ring-2 focus:ring-mauve/10"
      >
        <option value="">Select...</option>
        {field.options?.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    )
  }

  return (
    <Input
      {...common}
      type={
        field.type === 'email'
          ? 'email'
          : field.type === 'number'
            ? 'number'
            : field.type === 'date'
              ? 'date'
              : field.type === 'phone'
                ? 'tel'
                : 'text'
      }
    />
  )
}

export function FormRenderer({
  formId,
  slug,
  title,
  definition,
}: {
  formId: string
  slug: string
  title: string
  definition: FormDefinition
}) {
  const sessionId = useMemo(() => getSessionId(), [])
  const [pageIndex, setPageIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const page = definition.pages[pageIndex]
  const isLastPage = pageIndex === definition.pages.length - 1
  const progress = ((pageIndex + 1) / definition.pages.length) * 100
  const initialTracked = useRef(false)

  useEffect(() => {
    if (initialTracked.current) return
    initialTracked.current = true

    void client.analytics.track({
      formId,
      sessionId,
      eventType: 'form_viewed',
      pageId: definition.pages[0]?.id,
    })
    void client.analytics.track({
      formId,
      sessionId,
      eventType: 'form_started',
    })
  }, [definition.pages, formId, sessionId])

  useEffect(() => {
    if (pageIndex === 0 || !page?.id) return

    void client.analytics.track({
      formId,
      sessionId,
      eventType: 'page_viewed',
      pageId: page.id,
    })
  }, [formId, page?.id, pageIndex, sessionId])

  function validateCurrentPage(): string | null {
    if (!page) return null

    for (const field of page.fields) {
      if (!field.required) continue
      const value = answers[field.id]?.trim() ?? ''
      if (!value) return `${field.label} is required`
    }

    return null
  }

  async function handleNext() {
    const validationError = validateCurrentPage()
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setLoading(true)
    try {
      if (isLastPage) {
        const params = new URLSearchParams(window.location.search)
        const result = await client.submissions.submit({
          slug,
          sessionId,
          answers,
          metadata: {
            utmSource: params.get('utm_source') ?? undefined,
            utmMedium: params.get('utm_medium') ?? undefined,
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
        setSubmitted(result.thankYouMessage)
      } else {
        setPageIndex((i) => i + 1)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <Panel className="mx-auto max-w-xl">
        <PanelBody className="space-y-4 py-12 text-center">
          <Badge variant="mauve" className="mx-auto normal-case tracking-[0.18em]">
            Submitted
          </Badge>
          <h2 className="font-display text-3xl text-night-80">Thank you</h2>
          <p className="mx-auto max-w-sm text-base leading-relaxed text-night-60">{submitted}</p>
        </PanelBody>
      </Panel>
    )
  }

  if (!page) return null

  return (
    <Panel className="mx-auto max-w-xl">
      <PanelHeader className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Badge variant="mauve" className="normal-case tracking-[0.18em]">
            {title}
          </Badge>
          <span className="text-xs font-medium text-night-60">
            {pageIndex + 1} / {definition.pages.length}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-mauve-10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-mauve via-everest-green to-gold transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-night-80 sm:text-3xl">
          {page.title ?? `Step ${pageIndex + 1}`}
        </h1>
      </PanelHeader>

      <PanelBody className="space-y-6">
        {page.fields.map((field) => (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required ? ' *' : ''}
            </Label>
            <FieldInput
              field={field}
              value={answers[field.id] ?? ''}
              onChange={(value) => {
                setAnswers((prev) => ({ ...prev, [field.id]: value }))
                void client.analytics.track({
                  formId,
                  sessionId,
                  eventType: value ? 'field_answered' : 'field_skipped',
                  fieldId: field.id,
                  pageId: page.id,
                })
              }}
            />
          </div>
        ))}

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pageIndex === 0 || loading}
            onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
          >
            Back
          </Button>
          <Button
            variant={isLastPage ? 'mauve' : 'everest'}
            showArrow={isLastPage}
            onClick={() => void handleNext()}
            disabled={loading}
          >
            {loading ? 'Saving...' : isLastPage ? 'Submit' : 'Continue'}
          </Button>
        </div>
      </PanelBody>
    </Panel>
  )
}
