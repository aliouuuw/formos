import type { LeadStatus } from '#/lib/form-types'

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'Nouveau',
  contacted: 'Contacté',
  rdv: 'RDV planifié',
  souscrit: 'Souscrit',
  qualified: 'Qualifié',
  won: 'Gagné',
  lost: 'Perdu',
  archived: 'Archivé',
}

/** Campaign pipeline order shown in admin filters and status dropdowns. */
export const LEAD_PIPELINE_STATUSES: LeadStatus[] = [
  'new',
  'contacted',
  'rdv',
  'souscrit',
  'qualified',
  'won',
  'lost',
]

export const LEAD_STATUS_VARIANT: Record<
  LeadStatus,
  'mauve' | 'everest' | 'default' | 'secondary' | 'outline'
> = {
  new: 'mauve',
  contacted: 'everest',
  rdv: 'default',
  souscrit: 'everest',
  qualified: 'default',
  won: 'everest',
  lost: 'outline',
  archived: 'secondary',
}
