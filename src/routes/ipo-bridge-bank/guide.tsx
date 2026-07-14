import { createFileRoute } from '@tanstack/react-router'

import { IpoSubscriptionGuide } from '#/components/ipo/ipo-subscription-guide'
import { IPO_CAMPAIGN } from '#/lib/ipo-campaign'

export const Route = createFileRoute('/ipo-bridge-bank/guide')({
  component: IpoSubscriptionGuidePage,
  head: () => ({
    meta: [
      {
        title: `Guide de souscription IPO ${IPO_CAMPAIGN.bankShort} · ${IPO_CAMPAIGN.intermediary}`,
      },
      {
        name: 'description',
        content: `Comment souscrire en 5 étapes à l'IPO ${IPO_CAMPAIGN.bankShort} via Everest Finance.`,
      },
      { name: 'theme-color', content: '#012d2a' },
    ],
  }),
})

function IpoSubscriptionGuidePage() {
  return <IpoSubscriptionGuide />
}
