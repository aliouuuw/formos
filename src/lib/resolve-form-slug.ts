import { and, eq } from 'drizzle-orm'

import { db } from '#/db/index'
import { formSlugRedirects, forms } from '#/db/schema'

/** Resolve a public URL slug to a published form (direct match or legacy redirect). */
export async function resolvePublishedFormBySlug(slug: string) {
  const direct = await db.query.forms.findFirst({
    where: and(eq(forms.slug, slug), eq(forms.status, 'published')),
  })
  if (direct) return direct

  const redirect = await db.query.formSlugRedirects.findFirst({
    where: eq(formSlugRedirects.slug, slug),
  })
  if (!redirect) return null

  return db.query.forms.findFirst({
    where: and(eq(forms.id, redirect.formId), eq(forms.status, 'published')),
  })
}
