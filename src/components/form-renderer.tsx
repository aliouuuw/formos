import { useEffect, useMemo, useState } from 'react'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
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
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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

  useEffect(() => {
    void client.analytics.track({
      formId,
      sessionId,
      eventType: pageIndex === 0 ? 'form_viewed' : 'page_viewed',
      pageId: page?.id,
    })
    if (pageIndex === 0) {
      void client.analytics.track({
        formId,
        sessionId,
        eventType: 'form_started',
      })
    }
  }, [formId, page?.id, pageIndex, sessionId])

  async function handleNext() {
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
      <div className="mx-auto max-w-xl rounded-2xl border bg-[var(--surface-strong)] p-10 text-center shadow-sm">
        <h2 className="font-[Fraunces] text-3xl font-bold">Thank you</h2>
        <p className="mt-3 text-[var(--sea-ink-soft)]">{submitted}</p>
      </div>
    )
  }

  if (!page) return null

  return (
    <div className="mx-auto max-w-xl rounded-2xl border bg-[var(--surface-strong)] p-8 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kicker)]">
        {title}
      </p>
      <h1 className="mt-2 font-[Fraunces] text-3xl font-bold">
        {page.title ?? `Step ${pageIndex + 1}`}
      </h1>
      <div className="mt-8 space-y-6">
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
      </div>
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      <div className="mt-8 flex items-center justify-between">
        <p className="text-sm text-[var(--sea-ink-soft)]">
          Page {pageIndex + 1} of {definition.pages.length}
        </p>
        <Button onClick={() => void handleNext()} disabled={loading}>
          {loading ? 'Saving...' : isLastPage ? 'Submit' : 'Continue'}
        </Button>
      </div>
    </div>
  )
}
