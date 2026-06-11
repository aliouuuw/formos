import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Panel, PanelBody, PanelHeader } from '#/components/ui/panel'
import { Textarea } from '#/components/ui/textarea'
import { formProgressPercent } from '#/lib/form-progress'
import type { FormDefinition, FormField } from '#/lib/form-types'
import { cn } from '#/lib/utils'
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
  onBlur,
  onFocus,
}: {
  field: FormField
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  onFocus?: () => void
}) {
  const common = {
    id: field.id,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      onChange(e.target.value),
    onBlur,
    onFocus,
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
        onBlur={onBlur}
        onFocus={onFocus}
        required={field.required}
        className="flex h-10 w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-night focus:border-mauve focus:outline-none focus:ring-2 focus:ring-mauve/10"
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

  if (field.type === 'checkbox') {
    return (
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id={field.id}
          checked={value === 'true'}
          onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
          onBlur={onBlur}
          onFocus={onFocus}
          required={field.required}
          className="h-4 w-4 rounded border-mauve/30 accent-mauve"
        />
        <label htmlFor={field.id} className="text-sm text-night-80 select-none">
          {field.label}
        </label>
      </div>
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

export type FormRendererPreviewProps = {
  pageIndex: number
  showEnding: boolean
  selectedFieldId?: string
  onSelectField?: (pageId: string, fieldId: string) => void
  onPageIndexChange?: (index: number) => void
  onShowEnding?: () => void
}

export function FormRenderer({
  formId,
  slug,
  title,
  definition,
  preview,
}: {
  formId: string
  slug: string
  title: string
  definition: FormDefinition
  preview?: FormRendererPreviewProps
}) {
  const isPreview = Boolean(preview)
  const sessionId = useMemo(() => (isPreview ? 'preview' : getSessionId()), [isPreview])
  const [internalPageIndex, setInternalPageIndex] = useState(0)
  const pageIndex = preview ? preview.pageIndex : internalPageIndex
  const setPageIndex = (index: number) => {
    if (preview?.onPageIndexChange) preview.onPageIndexChange(index)
    else setInternalPageIndex(index)
  }
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const page = definition.pages[pageIndex]
  const isLastPage = pageIndex === definition.pages.length - 1
  const progress = formProgressPercent(pageIndex, definition.pages.length, preview?.showEnding ?? false)

  useEffect(() => {
    if (!preview?.showEnding) setSubmitted(null)
  }, [preview?.showEnding])

  const viewedRef = useRef(false)
  const startedRef = useRef(false)
  const viewedFieldsRef = useRef(new Set<string>())

  useEffect(() => {
    if (isPreview) return
    if (viewedRef.current) return
    viewedRef.current = true
    void client.analytics.track({
      formId,
      sessionId,
      eventType: 'form_viewed',
      pageId: definition.pages[0]?.id,
    })
  }, [definition.pages, formId, isPreview, sessionId])

  useEffect(() => {
    if (isPreview) return
    if (pageIndex === 0 || !page?.id) return
    void client.analytics.track({
      formId,
      sessionId,
      eventType: 'page_viewed',
      pageId: page.id,
    })
  }, [formId, isPreview, page?.id, pageIndex, sessionId])

  const trackFieldViewed = useCallback(
    (fieldId: string, pageId: string) => {
      if (viewedFieldsRef.current.has(fieldId)) return
      viewedFieldsRef.current.add(fieldId)
      void client.analytics.track({ formId, sessionId, eventType: 'field_viewed', fieldId, pageId })
    },
    [formId, sessionId],
  )

  const trackFieldAnswered = useCallback(
    (fieldId: string, pageId: string, value: string) => {
      void client.analytics.track({
        formId,
        sessionId,
        eventType: value.trim() ? 'field_answered' : 'field_skipped',
        fieldId,
        pageId,
      })
    },
    [formId, sessionId],
  )

  function validateCurrentPage(): string | null {
    if (!page) return null

    for (const field of page.fields) {
      const value = answers[field.id]?.trim() ?? ''

      if (field.required) {
        if (field.type === 'checkbox' && value !== 'true') {
          return `${field.label} is required`
        }
        if (field.type !== 'checkbox' && !value) {
          return `${field.label} is required`
        }
      }
      if (!value) continue

      if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return `${field.label} must be a valid email`
      }
      if (field.type === 'number' && Number.isNaN(Number(value))) {
        return `${field.label} must be a number`
      }
      if (field.type === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return `${field.label} must be a valid date (YYYY-MM-DD)`
      }
      if (field.type === 'select' && field.options && !field.options.includes(value)) {
        return `${field.label} has an invalid option`
      }
    }

    return null
  }

  async function handleNext() {
    if (!isPreview && !startedRef.current) {
      startedRef.current = true
      void client.analytics.track({ formId, sessionId, eventType: 'form_started' })
    }

    const validationError = validateCurrentPage()
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)

    if (isPreview) {
      if (isLastPage) {
        const message =
          definition.theme?.thankYouMessage?.trim() || 'Thanks for your submission!'
        setSubmitted(message)
        preview?.onShowEnding?.()
      } else {
        setPageIndex(pageIndex + 1)
      }
      return
    }

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
        setPageIndex(pageIndex + 1)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  const thankYouMessage =
    submitted ??
    (preview?.showEnding
      ? definition.theme?.thankYouMessage?.trim() || 'Thanks for your submission!'
      : null)

  if (thankYouMessage) {
    return (
      <Panel className="mx-auto max-w-xl">
        <PanelBody className="space-y-4 py-12 text-center">
          <Badge variant="mauve" className="mx-auto normal-case tracking-[0.18em]">
            Submitted
          </Badge>
          <h2 className="font-display text-3xl text-night-80">Thank you</h2>
          <p className="mx-auto max-w-sm text-base leading-relaxed text-night-60">{thankYouMessage}</p>
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
        {progress !== null ? (
          <div className="h-1.5 overflow-hidden rounded-full bg-mauve-10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-mauve via-everest-green to-gold transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-night-80 sm:text-3xl">
          {page.title ?? `Step ${pageIndex + 1}`}
        </h1>
      </PanelHeader>

      <PanelBody className="space-y-6">
        {page.fields.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-mauve-10 px-6 py-12 text-center">
            <p className="text-sm text-night-60">This step has no fields yet.</p>
          </div>
        ) : (
          page.fields.map((field) => (
            <div
              key={field.id}
              className={cn(
                'space-y-2 rounded-xl transition-colors',
                preview?.selectedFieldId === field.id && 'bg-mauve-05/60 ring-1 ring-mauve-10 p-3 -mx-3',
              )}
            >
              {field.type !== 'checkbox' ? (
                <Label htmlFor={field.id}>
                  {field.label}
                  {field.required ? ' *' : ''}
                </Label>
              ) : null}
              <FieldInput
                field={field}
                value={answers[field.id] ?? ''}
                onChange={(value) => {
                  setAnswers((prev) => ({ ...prev, [field.id]: value }))
                }}
                onFocus={() => {
                  if (preview?.onSelectField && page.id) {
                    preview.onSelectField(page.id, field.id)
                  } else if (page.id) {
                    trackFieldViewed(field.id, page.id)
                  }
                }}
                onBlur={() => {
                  if (!preview && page.id) {
                    trackFieldAnswered(field.id, page.id, answers[field.id] ?? '')
                  }
                }}
              />
            </div>
          ))
        )}

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
            onClick={() => setPageIndex(Math.max(0, pageIndex - 1))}
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
