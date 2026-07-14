import type { FormStatus } from '#/lib/form-types'

export const FORM_STATUS_LABELS: Record<FormStatus, string> = {
  draft: 'Brouillon',
  published: 'Publié',
  archived: 'Archivé',
}

export const FORM_STATUS_VARIANTS = {
  draft: 'mauve',
  published: 'everest',
  archived: 'outline',
} as const satisfies Record<FormStatus, 'mauve' | 'everest' | 'outline'>
