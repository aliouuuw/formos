const EVENT_LABELS: Record<string, string> = {
  form_viewed: 'Formulaire vu',
  form_started: 'Formulaire démarré',
  form_completed: 'Formulaire complété',
  page_viewed: 'Page vue',
  field_viewed: 'Question vue',
  field_answered: 'Question répondue',
  field_skipped: 'Question ignorée',
}

export function formatAnalyticsEvent(eventType: string): string {
  return EVENT_LABELS[eventType] ?? eventType.replace(/_/g, ' ')
}
