import type { AnalyticsEventType } from '#/lib/form-types'
import { getSessionId } from '#/lib/session-id'
import { client } from '#/orpc/client'

type CampaignClickEvent = Extract<AnalyticsEventType, 'whatsapp_click' | 'guide_download'>

function getLandingUtm() {
  if (typeof window === 'undefined') return {}
  const params = new URLSearchParams(window.location.search)
  return {
    utm_source: params.get('utm_source') ?? undefined,
    utm_medium: params.get('utm_medium') ?? undefined,
    utm_campaign: params.get('utm_campaign') ?? undefined,
  }
}

/** Fire-and-forget campaign interaction (WhatsApp, guide PDF, etc.). */
export function trackCampaignEvent(
  formId: string | undefined,
  eventType: CampaignClickEvent,
  metadata: Record<string, unknown> = {},
) {
  if (!formId) return

  void client.analytics.track({
    formId,
    sessionId: getSessionId(),
    eventType,
    metadata: { ...getLandingUtm(), ...metadata },
  })
}
