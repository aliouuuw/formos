import { ORPCError } from '@orpc/server'
import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '#/db/index'
import { analyticsEvents, forms } from '#/db/schema'
import { analyticsEventTypeSchema } from '#/lib/form-types'
import { authedContext, publicContext } from '#/orpc/context'

export const trackEvent = publicContext
  .input(
    z.object({
      formId: z.string(),
      sessionId: z.string().min(1),
      eventType: analyticsEventTypeSchema,
      fieldId: z.string().optional(),
      pageId: z.string().optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    }),
  )
  .handler(async ({ input }) => {
    const form = await db.query.forms.findFirst({
      where: and(eq(forms.id, input.formId), eq(forms.status, 'published')),
    })

    if (!form) {
      throw new ORPCError('NOT_FOUND', { message: 'Form not found' })
    }

    await db.insert(analyticsEvents).values({
      id: crypto.randomUUID(),
      formId: input.formId,
      sessionId: input.sessionId,
      eventType: input.eventType,
      fieldId: input.fieldId,
      pageId: input.pageId,
      metadata: input.metadata,
    })

    return { ok: true }
  })

export const getFormAnalytics = authedContext
  .input(z.object({ formId: z.string() }))
  .handler(async ({ context, input }) => {
    const form = await db.query.forms.findFirst({
      where: and(eq(forms.id, input.formId), eq(forms.createdBy, context.user.id)),
    })

    if (!form) {
      throw new ORPCError('NOT_FOUND', { message: 'Form not found' })
    }

    const funnel = await db
      .select({
        eventType: analyticsEvents.eventType,
        count: sql<number>`count(*)::int`,
      })
      .from(analyticsEvents)
      .where(eq(analyticsEvents.formId, input.formId))
      .groupBy(analyticsEvents.eventType)

    const fieldDropoff = await db
      .select({
        fieldId: analyticsEvents.fieldId,
        views: sql<number>`count(*) filter (where ${analyticsEvents.eventType} = 'field_viewed')::int`,
        answers: sql<number>`count(*) filter (where ${analyticsEvents.eventType} = 'field_answered')::int`,
      })
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.formId, input.formId),
          sql`${analyticsEvents.fieldId} is not null`,
        ),
      )
      .groupBy(analyticsEvents.fieldId)

    return { funnel, fieldDropoff }
  })
