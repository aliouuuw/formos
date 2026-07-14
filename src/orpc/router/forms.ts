import { ORPCError } from '@orpc/server'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '#/db/index'
import { analyticsEvents, formDefinitionSnapshots, formSubmissions, forms, leads } from '#/db/schema'
import {
  createDefaultFormDefinition,
  formDefinitionSchema,
  slugify,
} from '#/lib/form-types'
import { resolvePublishedFormBySlug } from '#/lib/resolve-form-slug'
import { applySlugChange, assertSlugAvailable } from '#/lib/slug-redirects'
import { authedContext, publicContext } from '#/orpc/context'

export const listForms = authedContext
  .input(
    z.object({
      /** `active` = brouillon + publié, `archived` = archivés seulement */
      view: z.enum(['active', 'archived', 'all']).optional().default('active'),
    }),
  )
  .handler(async ({ context, input }) => {
    const conditions = [eq(forms.createdBy, context.user.id)]

    if (input.view === 'active') {
      conditions.push(inArray(forms.status, ['draft', 'published']))
    } else if (input.view === 'archived') {
      conditions.push(eq(forms.status, 'archived'))
    }

    return db.query.forms.findMany({
      where: and(...conditions),
      orderBy: [desc(forms.updatedAt)],
    })
  })

export const getFormById = authedContext
  .input(z.object({ id: z.string() }))
  .handler(async ({ context, input }) => {
    const form = await db.query.forms.findFirst({
      where: and(eq(forms.id, input.id), eq(forms.createdBy, context.user.id)),
    })

    if (!form) {
      throw new ORPCError('NOT_FOUND', { message: 'Form not found' })
    }

    return form
  })

export const getFormBySlug = publicContext
  .input(z.object({ slug: z.string() }))
  .handler(async ({ input }) => {
    const form = await resolvePublishedFormBySlug(input.slug)

    if (!form) {
      throw new ORPCError('NOT_FOUND', { message: 'Form not found' })
    }

    return {
      id: form.id,
      title: form.title,
      slug: form.slug,
      version: form.version,
      definition: form.definition,
    }
  })

export const createForm = authedContext
  .input(
    z.object({
      title: z.string().min(1).max(120),
      slug: z.string().min(1).max(64).optional(),
    }),
  )
  .handler(async ({ context, input }) => {
    const slug = input.slug ? slugify(input.slug) : slugify(input.title)
    await assertSlugAvailable(slug)

    const [form] = await db
      .insert(forms)
      .values({
        id: crypto.randomUUID(),
        title: input.title,
        slug,
        status: 'draft',
        definition: createDefaultFormDefinition(input.title),
        version: 1,
        createdBy: context.user.id,
      })
      .returning()

    return form
  })

export const updateForm = authedContext
  .input(
    z.object({
      id: z.string(),
      title: z.string().min(1).max(120).optional(),
      slug: z.string().min(1).max(64).optional(),
      definition: formDefinitionSchema.optional(),
    }),
  )
  .handler(async ({ context, input }) => {
    const existing = await db.query.forms.findFirst({
      where: and(eq(forms.id, input.id), eq(forms.createdBy, context.user.id)),
    })

    if (!existing) {
      throw new ORPCError('NOT_FOUND', { message: 'Form not found' })
    }

    if (existing.status === 'archived') {
      throw new ORPCError('BAD_REQUEST', {
        message: 'Restaurez le formulaire avant de le modifier.',
      })
    }

    const nextSlug = input.slug ? slugify(input.slug) : existing.slug
    if (nextSlug !== existing.slug) {
      await assertSlugAvailable(nextSlug, input.id)
    }

    const newVersion = input.definition ? existing.version + 1 : existing.version
    const newDefinition = input.definition ?? existing.definition

    let updated: typeof existing

    if (input.definition) {
      const result = await db.transaction(async (tx) => {
        const [row] = await tx
          .update(forms)
          .set({
            title: input.title ?? existing.title,
            slug: nextSlug,
            definition: newDefinition,
            version: newVersion,
            updatedAt: new Date(),
          })
          .where(eq(forms.id, input.id))
          .returning()

        await tx.insert(formDefinitionSnapshots).values({
          id: crypto.randomUUID(),
          formId: input.id,
          version: newVersion,
          definition: newDefinition,
        }).onConflictDoNothing()

        if (nextSlug !== existing.slug) {
          await applySlugChange(tx, input.id, existing.slug, nextSlug)
        }

        return row!
      })
      updated = result
    } else {
      const result = await db.transaction(async (tx) => {
        const [row] = await tx
          .update(forms)
          .set({
            title: input.title ?? existing.title,
            slug: nextSlug,
            updatedAt: new Date(),
          })
          .where(eq(forms.id, input.id))
          .returning()

        if (nextSlug !== existing.slug) {
          await applySlugChange(tx, input.id, existing.slug, nextSlug)
        }

        return row!
      })
      updated = result!
    }

    return updated
  })

export const publishForm = authedContext
  .input(z.object({ id: z.string() }))
  .handler(async ({ context, input }) => {
    const existing = await db.query.forms.findFirst({
      where: and(eq(forms.id, input.id), eq(forms.createdBy, context.user.id)),
    })

    if (!existing) {
      throw new ORPCError('NOT_FOUND', { message: 'Form not found' })
    }

    if (existing.status === 'archived') {
      throw new ORPCError('BAD_REQUEST', {
        message: 'Restaurez le formulaire avant de le publier.',
      })
    }

    const [updated] = await db
      .update(forms)
      .set({
        status: 'published',
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(forms.id, input.id))
      .returning()

    return updated
  })

export const archiveForm = authedContext
  .input(z.object({ id: z.string() }))
  .handler(async ({ context, input }) => {
    const existing = await db.query.forms.findFirst({
      where: and(eq(forms.id, input.id), eq(forms.createdBy, context.user.id)),
    })

    if (!existing) {
      throw new ORPCError('NOT_FOUND', { message: 'Form not found' })
    }

    const [updated] = await db
      .update(forms)
      .set({
        status: 'archived',
        updatedAt: new Date(),
      })
      .where(eq(forms.id, input.id))
      .returning()

    return updated
  })

export const restoreForm = authedContext
  .input(z.object({ id: z.string() }))
  .handler(async ({ context, input }) => {
    const existing = await db.query.forms.findFirst({
      where: and(eq(forms.id, input.id), eq(forms.createdBy, context.user.id)),
    })

    if (!existing) {
      throw new ORPCError('NOT_FOUND', { message: 'Form not found' })
    }

    if (existing.status !== 'archived') {
      throw new ORPCError('BAD_REQUEST', { message: 'Seuls les formulaires archivés peuvent être restaurés.' })
    }

    const [updated] = await db
      .update(forms)
      .set({
        status: 'draft',
        updatedAt: new Date(),
      })
      .where(eq(forms.id, input.id))
      .returning()

    return updated
  })

export const deleteForm = authedContext
  .input(
    z.object({
      id: z.string(),
      /** Required when the form has submissions or leads */
      force: z.boolean().optional(),
    }),
  )
  .handler(async ({ context, input }) => {
    const existing = await db.query.forms.findFirst({
      where: and(eq(forms.id, input.id), eq(forms.createdBy, context.user.id)),
    })

    if (!existing) {
      throw new ORPCError('NOT_FOUND', { message: 'Form not found' })
    }

    const [submissionRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(formSubmissions)
      .where(eq(formSubmissions.formId, input.id))

    const [leadRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(leads)
      .where(eq(leads.formId, input.id))

    const submissionCount = submissionRow?.count ?? 0
    const leadCount = leadRow?.count ?? 0

    if ((submissionCount > 0 || leadCount > 0) && !input.force) {
      throw new ORPCError('BAD_REQUEST', {
        message:
          submissionCount > 0
            ? `Ce formulaire a ${submissionCount} réponse(s). Archivez-le ou confirmez la suppression définitive.`
            : `Ce formulaire a ${leadCount} lead(s). Archivez-le ou confirmez la suppression définitive.`,
      })
    }

    await db.delete(forms).where(eq(forms.id, input.id))

    return { ok: true as const, deletedId: input.id }
  })

export const getFormStats = authedContext
  .input(z.object({ id: z.string() }))
  .handler(async ({ context, input }) => {
    const form = await db.query.forms.findFirst({
      where: and(eq(forms.id, input.id), eq(forms.createdBy, context.user.id)),
    })

    if (!form) {
      throw new ORPCError('NOT_FOUND', { message: 'Form not found' })
    }

    const [eventCounts, submissionCount, leadCount] = await Promise.all([
      db
        .select({
          eventType: analyticsEvents.eventType,
          count: sql<number>`count(*)::int`,
        })
        .from(analyticsEvents)
        .where(eq(analyticsEvents.formId, input.id))
        .groupBy(analyticsEvents.eventType),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(formSubmissions)
        .where(eq(formSubmissions.formId, input.id)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(leads)
        .where(eq(leads.formId, input.id)),
    ])

    const countByEvent = new Map(
      eventCounts.map((row) => [row.eventType, row.count]),
    )
    const views = countByEvent.get('form_viewed') ?? 0
    const starts = countByEvent.get('form_started') ?? 0
    const completions = countByEvent.get('form_completed') ?? 0
    const completionRate = starts > 0 ? Math.round((completions / starts) * 100) : 0

    return {
      views,
      starts,
      completions,
      completionRate,
      submissions: submissionCount[0]?.count ?? 0,
      leads: leadCount[0]?.count ?? 0,
    }
  })
