import { ORPCError } from '@orpc/server'
import { and, eq, gt, isNull, ne, or } from 'drizzle-orm'

import { db } from '#/db/index'
import { formSlugRedirects, forms } from '#/db/schema'
import { slugRedirectExpiresAt } from '#/lib/slug-redirect-config'

type RedirectWriter = Pick<typeof db, 'insert' | 'delete'>

async function findActiveRedirect(slug: string) {
  return db.query.formSlugRedirects.findFirst({
    where: and(
      eq(formSlugRedirects.slug, slug),
      or(isNull(formSlugRedirects.expiresAt), gt(formSlugRedirects.expiresAt, new Date())),
    ),
  })
}

export async function assertSlugAvailable(slug: string, formId?: string) {
  const formConflict = await db.query.forms.findFirst({
    where: formId
      ? and(eq(forms.slug, slug), ne(forms.id, formId))
      : eq(forms.slug, slug),
  })
  if (formConflict) {
    throw new ORPCError('CONFLICT', { message: 'Slug already in use' })
  }

  const redirect = await findActiveRedirect(slug)
  if (redirect && redirect.formId !== formId) {
    throw new ORPCError('CONFLICT', {
      message: 'This slug belongs to a previous form URL and still redirects elsewhere',
    })
  }
}

export async function applySlugChange(
  tx: RedirectWriter,
  formId: string,
  oldSlug: string,
  newSlug: string,
) {
  if (oldSlug === newSlug) return

  const expiresAt = slugRedirectExpiresAt()

  await tx
    .delete(formSlugRedirects)
    .where(and(eq(formSlugRedirects.slug, newSlug), eq(formSlugRedirects.formId, formId)))

  await tx
    .insert(formSlugRedirects)
    .values({
      id: crypto.randomUUID(),
      formId,
      slug: oldSlug,
      expiresAt,
    })
    .onConflictDoUpdate({
      target: formSlugRedirects.slug,
      set: {
        formId,
        expiresAt,
        createdAt: new Date(),
      },
    })
}
