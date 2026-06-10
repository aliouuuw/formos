import { ORPCError } from '@orpc/server'
import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '#/db/index'
import { analyticsEvents, forms } from '#/db/schema'
import { analyticsEventTypeSchema } from '#/lib/form-types'
import { ANALYTICS_RATE_LIMIT, MAX_JSON_BYTES } from '#/lib/limits'
import { checkRateLimit, getClientIp } from '#/lib/rate-limit'
import { assertJsonPayloadSize } from '#/lib/validate-answers'
import { authedContext, publicContext } from '#/orpc/context'

export const trackEvent = publicContext
  .input(
    z.object({
      formId: z.string(),
      sessionId: z.string().min(1).max(64),
      eventType: analyticsEventTypeSchema,
      fieldId: z.string().max(64).optional(),
      pageId: z.string().max(64).optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    const clientIp = getClientIp(context.headers)
    const rate = checkRateLimit(
      `analytics:${clientIp}:${input.formId}`,
      ANALYTICS_RATE_LIMIT.limit,
      ANALYTICS_RATE_LIMIT.windowMs,
    )

    if (!rate.allowed) {
      throw new ORPCError('TOO_MANY_REQUESTS', {
        message: `Too many events. Try again in ${rate.retryAfterSec}s.`,
      })
    }

    try {
      assertJsonPayloadSize(input.metadata, MAX_JSON_BYTES, 'Metadata')
    } catch (error) {
      throw new ORPCError('BAD_REQUEST', {
        message: error instanceof Error ? error.message : 'Metadata too large',
      })
    }

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
