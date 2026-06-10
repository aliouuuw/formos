import { ORPCError } from '@orpc/server'
import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '#/db/index'
import { formSubmissions, forms, leads } from '#/db/schema'
import { inngest } from '#/inngest/client'
import { extractLeadFields } from '#/lib/leads'
import { authedContext, publicContext } from '#/orpc/context'

const submissionMetadataSchema = z
  .object({
    utmSource: z.string().optional(),
    utmMedium: z.string().optional(),
    utmCampaign: z.string().optional(),
    referrer: z.string().optional(),
    userAgent: z.string().optional(),
  })
  .optional()

export const submitForm = publicContext
  .input(
    z.object({
      slug: z.string(),
      sessionId: z.string().min(1),
      answers: z.record(z.string(), z.unknown()),
      metadata: submissionMetadataSchema,
    }),
  )
  .handler(async ({ input }) => {
    const form = await db.query.forms.findFirst({
      where: and(eq(forms.slug, input.slug), eq(forms.status, 'published')),
    })

    if (!form) {
      throw new ORPCError('NOT_FOUND', { message: 'Form not found' })
    }

    const submissionId = crypto.randomUUID()
    const leadId = crypto.randomUUID()
    const leadFields = extractLeadFields(form.definition, input.answers)

    await db.insert(formSubmissions).values({
      id: submissionId,
      formId: form.id,
      formVersion: form.version,
      sessionId: input.sessionId,
      answers: input.answers,
      metadata: input.metadata,
      completedAt: new Date(),
    })

    await db.insert(leads).values({
      id: leadId,
      formId: form.id,
      submissionId,
      email: leadFields.email,
      name: leadFields.name,
      phone: leadFields.phone,
      status: 'new',
      utmSource: input.metadata?.utmSource,
      utmMedium: input.metadata?.utmMedium,
      utmCampaign: input.metadata?.utmCampaign,
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
      limit: 100,
    })
  })
