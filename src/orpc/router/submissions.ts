import { ORPCError } from '@orpc/server'
import { and, asc, desc, eq } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '#/db/index'
import { formDefinitionSnapshots, formSubmissions, forms, leads } from '#/db/schema'
import { inngest } from '#/inngest/client'
import { extractLeadFields, ipoIntentFromSlug } from '#/lib/leads'
import { MAX_JSON_BYTES, SUBMIT_RATE_LIMIT } from '#/lib/limits'
import { checkRateLimit, getClientIp } from '#/lib/rate-limit'
import { resolvePublishedFormBySlug } from '#/lib/resolve-form-slug'
import {
  assertJsonPayloadSize,
  validateSubmissionAnswers,
} from '#/lib/validate-answers'
import { authedContext, publicContext } from '#/orpc/context'

const submissionMetadataSchema = z
  .object({
    utmSource: z.string().max(200).optional(),
    utmMedium: z.string().max(200).optional(),
    utmCampaign: z.string().max(200).optional(),
    referrer: z.string().max(2000).optional(),
    userAgent: z.string().max(500).optional(),
  })
  .optional()

export const submitForm = publicContext
  .input(
    z.object({
      slug: z.string().min(1).max(64),
      sessionId: z.string().min(1).max(64),
      answers: z.record(z.string(), z.unknown()),
      metadata: submissionMetadataSchema,
    }),
  )
  .handler(async ({ input, context }) => {
    const clientIp = getClientIp(context.headers)
    const rate = checkRateLimit(
      `submit:${clientIp}:${input.slug}`,
      SUBMIT_RATE_LIMIT.limit,
      SUBMIT_RATE_LIMIT.windowMs,
    )

    if (!rate.allowed) {
      throw new ORPCError('TOO_MANY_REQUESTS', {
        message: `Too many submissions. Try again in ${rate.retryAfterSec}s.`,
      })
    }

    try {
      assertJsonPayloadSize(input.answers, MAX_JSON_BYTES, 'Answers')
      assertJsonPayloadSize(input.metadata, MAX_JSON_BYTES, 'Metadata')
    } catch (error) {
      throw new ORPCError('BAD_REQUEST', {
        message: error instanceof Error ? error.message : 'Payload too large',
      })
    }

    const form = await resolvePublishedFormBySlug(input.slug)

    if (!form) {
      throw new ORPCError('NOT_FOUND', { message: 'Form not found' })
    }

    const validation = validateSubmissionAnswers(form.definition, input.answers)
    if (!validation.ok) {
      throw new ORPCError('BAD_REQUEST', { message: validation.message })
    }

    const submissionId = crypto.randomUUID()
    const leadId = crypto.randomUUID()
    const leadFields = extractLeadFields(form.definition, validation.answers)
    const intent = ipoIntentFromSlug(input.slug)

    await db.transaction(async (tx) => {
      await tx.insert(formSubmissions).values({
        id: submissionId,
        formId: form.id,
        formVersion: form.version,
        sessionId: input.sessionId,
        answers: validation.answers,
        metadata: input.metadata,
        completedAt: new Date(),
      })

      await tx.insert(formDefinitionSnapshots).values({
        id: crypto.randomUUID(),
        formId: form.id,
        version: form.version,
        definition: form.definition,
      }).onConflictDoNothing()

      await tx.insert(leads).values({
        id: leadId,
        formId: form.id,
        submissionId,
        email: leadFields.email,
        name: leadFields.name,
        phone: leadFields.phone,
        status: 'new',
        intent,
        amountRange: leadFields.amountRange,
        preferredChannel: leadFields.preferredChannel,
        utmSource: input.metadata?.utmSource,
        utmMedium: input.metadata?.utmMedium,
        utmCampaign: input.metadata?.utmCampaign,
      })
    })

    await inngest.send({
      name: 'form/submission.completed',
      data: {
        formId: form.id,
        submissionId,
        leadId,
        email: leadFields.email,
      },
    })

    return {
      submissionId,
      leadId,
      thankYouMessage:
        form.definition.theme?.thankYouMessage ?? 'Thanks for your submission!',
    }
  })

export const listSubmissions = authedContext
  .input(z.object({ formId: z.string() }))
  .handler(async ({ context, input }) => {
    const form = await db.query.forms.findFirst({
      where: and(eq(forms.id, input.formId), eq(forms.createdBy, context.user.id)),
    })

    if (!form) {
      throw new ORPCError('NOT_FOUND', { message: 'Form not found' })
    }

    return db.query.formSubmissions.findMany({
      where: eq(formSubmissions.formId, input.formId),
      orderBy: [desc(formSubmissions.createdAt)],
      limit: 500,
    })
  })

export const getSubmission = authedContext
  .input(z.object({ formId: z.string(), submissionId: z.string() }))
  .handler(async ({ context, input }) => {
    const form = await db.query.forms.findFirst({
      where: and(eq(forms.id, input.formId), eq(forms.createdBy, context.user.id)),
    })

    if (!form) {
      throw new ORPCError('NOT_FOUND', { message: 'Form not found' })
    }

    const submission = await db.query.formSubmissions.findFirst({
      where: and(
        eq(formSubmissions.id, input.submissionId),
        eq(formSubmissions.formId, input.formId),
      ),
      with: { lead: true },
    })

    if (!submission) {
      throw new ORPCError('NOT_FOUND', { message: 'Submission not found' })
    }

    const snapshot = await db.query.formDefinitionSnapshots.findFirst({
      where: and(
        eq(formDefinitionSnapshots.formId, input.formId),
        eq(formDefinitionSnapshots.version, submission.formVersion),
      ),
    })

    const definition = snapshot?.definition ?? form.definition

    return { submission, definition }
  })

export const exportSubmissionsCsv = authedContext
  .input(z.object({ formId: z.string() }))
  .handler(async ({ context, input }) => {
    const form = await db.query.forms.findFirst({
      where: and(eq(forms.id, input.formId), eq(forms.createdBy, context.user.id)),
    })

    if (!form) {
      throw new ORPCError('NOT_FOUND', { message: 'Form not found' })
    }

    const rows = await db.query.formSubmissions.findMany({
      where: eq(formSubmissions.formId, input.formId),
      orderBy: [asc(formSubmissions.createdAt)],
    })

    const fields = form.definition.pages.flatMap((p) => p.fields)

    const header = [
      'submission_id',
      'session_id',
      'submitted_at',
      ...fields.map((f) => f.label),
    ]

    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`

    const lines = rows.map((row) => {
      const answers = row.answers as Record<string, string>
      return [
        escape(row.id),
        escape(row.sessionId),
        escape(row.createdAt.toISOString()),
        ...fields.map((f) => escape(answers[f.id] ?? '')),
      ].join(',')
    })

    return { csv: [header.map(escape).join(','), ...lines].join('\n') }
  })
