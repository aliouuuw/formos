import { createFileRoute } from '@tanstack/react-router'

import { IpoBridgeBankLanding } from '#/components/ipo/ipo-bridge-bank-landing'
import { IPO_CAMPAIGN } from '#/lib/ipo-campaign'

export const Route = createFileRoute('/')({
  component: IpoHomePage,
  head: () => ({
    meta: [
      { title: `IPO ${IPO_CAMPAIGN.bankShort} · ${IPO_CAMPAIGN.intermediary}` },
      {
        name: 'description',
        content: `Souscrivez à l'IPO Bridge Bank Group CI à ${IPO_CAMPAIGN.sharePriceFcfa.toLocaleString('fr-FR')} FCFA. Période : ${IPO_CAMPAIGN.subscriptionStart} – ${IPO_CAMPAIGN.subscriptionEnd}.`,
      },
      { name: 'theme-color', content: '#012d2a' },
    ],
  }),
})

function IpoHomePage() {
  return <IpoBridgeBankLanding />
}
