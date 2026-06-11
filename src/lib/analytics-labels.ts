const EVENT_LABELS: Record<string, string> = {
  form_viewed: 'Form viewed',
  form_started: 'Form started',
  form_completed: 'Form completed',
  page_viewed: 'Page viewed',
  field_viewed: 'Field viewed',
  field_answered: 'Field answered',
  field_skipped: 'Field skipped',
}

export function formatAnalyticsEvent(eventType: string): string {
  return EVENT_LABELS[eventType] ?? eventType.replace(/_/g, ' ')
}
