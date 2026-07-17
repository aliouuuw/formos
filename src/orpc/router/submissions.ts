import { ORPCError } from '@orpc/server'
import { and, asc, desc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '#/db/index'
import { formDefinitionSnapshots, formSubmissions, forms, leads } from '#/db/schema'
import { inngest } from '#/inngest/client'
import {
  BULLETIN_FIELD_IDS,
  bulletinDisplayName,
  isBulletinFormSlug,
  parseSignature,
} from '#/lib/ipo-bulletin'
import { extractLeadFields, classifySubmission } from '#/lib/leads'
import { MAX_JSON_BYTES, SUBMIT_RATE_LIMIT } from '#/lib/limits'
import { fillBulletinPdf, bulletinPdfFilename } from '#/lib/pdf/fill-bulletin'
import { checkRateLimit, getClientIp } from '#/lib/rate-limit'
import { resolvePublishedFormBySlug } from '#/lib/resolve-form-slug'
import {
  isHoneypotTriggered,
  normalizeLeadEmail,
  phoneMatchKey,
  type DuplicateLeadMatch,
} from '#/lib/submission-hygiene'
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

async function findPriorDuplicateLead(input: {
  campaignId?: string
  formId: string
  email: string | null
  phoneKey: string | null
}): Promise<DuplicateLeadMatch | null> {
  const scope = input.campaignId
    ? eq(leads.campaignId, input.campaignId)
    : eq(leads.formId, input.formId)

  if (input.email) {
    const byEmail = await db.query.leads.findFirst({
      where: and(scope, sql`lower(trim(${leads.email})) = ${input.email}`),
      orderBy: [asc(leads.createdAt)],
      columns: { id: true },
    })
    if (byEmail) return { id: byEmail.id, match: 'email' }
  }

  if (input.phoneKey) {
    const byPhone = await db.query.leads.findFirst({
      where: and(
        scope,
        sql`right(regexp_replace(coalesce(${leads.phone}, ''), '[^0-9]', '', 'g'), 9) = ${input.phoneKey}`,
      ),
      orderBy: [asc(leads.createdAt)],
      columns: { id: true },
    })
    if (byPhone) return { id: byPhone.id, match: 'phone' }
  }

  return null
}

export const submitForm = publicContext
  .input(
    z.object({
      slug: z.string().min(1).max(64),
      sessionId: z.string().min(1).max(64),
      answers: z.record(z.string(), z.unknown()),
      metadata: submissionMetadataSchema,
      /** Bots fill this; humans never see it. Non-empty → silent fake success. */
      honeypot: z.string().max(200).optional(),
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

    const thankYouMessage =
      form.definition.theme?.thankYouMessage ?? 'Thanks for your submission!'

    // Spam honeypot: pretend success, do not persist.
    if (isHoneypotTriggered(input.honeypot)) {
      return {
        submissionId: crypto.randomUUID(),
        leadId: crypto.randomUUID(),
        thankYouMessage,
      }
    }

    // Idempotent retry / double-click: one submission per browser session.
    // The client rotates the session id after a successful submit so a new
    // bulletin fill creates a new lead.
    const existingSubmission = await db.query.formSubmissions.findFirst({
      where: and(
        eq(formSubmissions.formId, form.id),
        eq(formSubmissions.sessionId, input.sessionId),
      ),
      with: { lead: { columns: { id: true } } },
      orderBy: [desc(formSubmissions.createdAt)],
    })
    if (existingSubmission) {
      return {
        submissionId: existingSubmission.id,
        leadId: existingSubmission.lead?.id ?? existingSubmission.id,
        thankYouMessage,
      }
    }

    const validation = validateSubmissionAnswers(form.definition, input.answers)
    if (!validation.ok) {
      throw new ORPCError('BAD_REQUEST', { message: validation.message })
    }
    if (
      isBulletinFormSlug(form.slug) &&
      !parseSignature(validation.answers[BULLETIN_FIELD_IDS.signature])
    ) {
      throw new ORPCError('BAD_REQUEST', { message: 'Signature du souscripteur invalide' })
    }

    const submissionId = crypto.randomUUID()
    const leadId = crypto.randomUUID()
    const leadFields = extractLeadFields(form.definition, validation.answers)
    if (isBulletinFormSlug(form.slug)) {
      const fullName = bulletinDisplayName(validation.answers)
      if (fullName) leadFields.name = fullName
      const total = validation.answers[BULLETIN_FIELD_IDS.totalFcfa]
      if (total) {
        leadFields.amountRange = `${Number(total).toLocaleString('fr-FR')} FCFA`
      }
    }
    const classification = classifySubmission({
      formSlug: form.slug,
      formCampaignId: form.campaignId,
    })

    const email = normalizeLeadEmail(leadFields.email)
    const phoneKey = phoneMatchKey(leadFields.phone)
    const prior = await findPriorDuplicateLead({
      campaignId: classification.campaignId,
      formId: form.id,
      email,
      phoneKey,
    })

    const insights = {
      ...leadFields.insights,
      campaignId: classification.campaignId,
      classifiedAt: new Date().toISOString(),
      ...(prior
        ? {
            duplicateOfLeadId: prior.id,
            duplicateMatch: prior.match,
          }
        : {}),
    }

    try {
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

        await tx
          .insert(formDefinitionSnapshots)
          .values({
            id: crypto.randomUUID(),
            formId: form.id,
            version: form.version,
            definition: form.definition,
          })
          .onConflictDoNothing()

        await tx.insert(leads).values({
          id: leadId,
          formId: form.id,
          submissionId,
          campaignId: classification.campaignId,
          email: email ?? leadFields.email ?? null,
          name: leadFields.name,
          phone: leadFields.phone,
          status: 'new',
          intent: classification.intent,
          amountRange: leadFields.amountRange,
          preferredChannel: leadFields.preferredChannel,
          insights,
          utmSource: input.metadata?.utmSource,
          utmMedium: input.metadata?.utmMedium,
          utmCampaign: input.metadata?.utmCampaign,
        })
      })
    } catch (error) {
      // Concurrent retry raced past the pre-check — return the winner.
      const raced = await db.query.formSubmissions.findFirst({
        where: and(
          eq(formSubmissions.formId, form.id),
          eq(formSubmissions.sessionId, input.sessionId),
        ),
        with: { lead: { columns: { id: true } } },
      })
      if (raced) {
        return {
          submissionId: raced.id,
          leadId: raced.lead?.id ?? raced.id,
          thankYouMessage,
        }
      }

      console.error('[submissions.submit] Database transaction failed', {
        slug: input.slug,
        formId: form.id,
        error: error instanceof Error ? error.message : error,
      })
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Unable to save submission. Please try again shortly.',
      })
    }

    try {
      await inngest.send({
        name: 'form/submission.completed',
        data: {
          formId: form.id,
          submissionId,
          leadId,
          email: email ?? leadFields.email,
          duplicateOfLeadId: prior?.id,
        },
      })
    } catch (error) {
      console.error('[submissions.submit] Inngest event failed (submission saved)', {
        submissionId,
        leadId,
        error: error instanceof Error ? error.message : error,
      })
    }

    return {
      submissionId,
      leadId,
      thankYouMessage,
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

export const generateBulletinPdf = authedContext
  .input(z.object({ formId: z.string(), submissionId: z.string() }))
  .handler(async ({ context, input }) => {
    const form = await db.query.forms.findFirst({
      where: and(eq(forms.id, input.formId), eq(forms.createdBy, context.user.id)),
    })

    if (!form) {
      throw new ORPCError('NOT_FOUND', { message: 'Form not found' })
    }

    if (!isBulletinFormSlug(form.slug)) {
      throw new ORPCError('BAD_REQUEST', {
        message: 'This form does not support bulletin PDF generation',
      })
    }

    const submission = await db.query.formSubmissions.findFirst({
      where: and(
        eq(formSubmissions.id, input.submissionId),
        eq(formSubmissions.formId, input.formId),
      ),
    })

    if (!submission) {
      throw new ORPCError('NOT_FOUND', { message: 'Submission not found' })
    }

    const answers = submission.answers as Record<string, string>
    const pdfBytes = await fillBulletinPdf(answers)
    const base64 = Buffer.from(pdfBytes).toString('base64')

    return {
      base64,
      filename: bulletinPdfFilename(answers),
      contentType: 'application/pdf' as const,
    }
  })
