/**
 * Structured content for the IPO subscription guide (PDF + web).
 * This is a practical investor document — not a mirror of the landing page.
 */

export const IPO_GUIDE_META = {
  title: 'Guide pratique de souscription',
  subtitle: "Offre publique d'actions — Bridge Bank Group Côte d'Ivoire",
  publisher: 'Everest Finance',
  publisherRole: 'Société de Gestion et d\'Intermédiation (SGI) agréée AMF-UMOA',
  version: '1.0',
  publishedAt: 'Juillet 2026',
  disclaimerShort:
    "Document d'information opérationnelle. Ne constitue pas un conseil en investissement ni la notice officielle de l'émetteur.",
} as const

export const IPO_GUIDE_OFFER_SUMMARY = {
  issuer: "Bridge Bank Group Côte d'Ivoire",
  offerType: 'Introduction en Bourse (IPO) — marché régional BRVM',
  sharePrice: '6 750 FCFA par action',
  capitalOffered: '20 % du capital social',
  subscriptionWindow: '20 juillet 2026 — 6 août 2026',
  settlementDate: '21 août 2026 (règlement-livraison)',
  listingTarget: 'Septembre 2026 (cotation BRVM)',
  intermediary: 'Everest Finance',
} as const

export const IPO_GUIDE_TOC = [
  { id: '1', label: 'Objet de ce guide' },
  { id: '2', label: "L'offre en synthèse" },
  { id: '3', label: 'Calendrier opérationnel' },
  { id: '4', label: 'Procédure de souscription en 5 étapes' },
  { id: '5', label: 'Constitution du dossier' },
  { id: '6', label: 'Après votre demande' },
  { id: '7', label: 'Questions fréquentes' },
  { id: '8', label: 'Nous contacter' },
] as const

export const IPO_GUIDE_SECTIONS = {
  object: {
    title: '1. Objet de ce guide',
    paragraphs: [
      "Ce guide accompagne les investisseurs particuliers et professionnels qui souhaitent souscrire à l'offre publique de Bridge Bank Group Côte d'Ivoire via Everest Finance.",
      "Il décrit les étapes concrètes : préparation du dossier, signature du bulletin, règlement et suivi post-clôture. Il ne remplace pas la notice d'information de l'émetteur ni un conseil personnalisé.",
      "Everest Finance intervient en qualité d'intermédiaire agréé pour recevoir les intentions de souscription, vérifier la complétude des pièces et transmettre les ordres dans les délais de l'offre.",
    ],
  },
  offer: {
    title: "2. L'offre en synthèse",
    rows: [
      ['Émetteur', IPO_GUIDE_OFFER_SUMMARY.issuer],
      ["Type d'opération", IPO_GUIDE_OFFER_SUMMARY.offerType],
      ['Prix de souscription', IPO_GUIDE_OFFER_SUMMARY.sharePrice],
      ['Part du capital offert', IPO_GUIDE_OFFER_SUMMARY.capitalOffered],
      ['Fenêtre de souscription', IPO_GUIDE_OFFER_SUMMARY.subscriptionWindow],
      ['Règlement-livraison', IPO_GUIDE_OFFER_SUMMARY.settlementDate],
      ['Cotation visée', IPO_GUIDE_OFFER_SUMMARY.listingTarget],
      ['Intermédiaire', IPO_GUIDE_OFFER_SUMMARY.intermediary],
    ],
  },
  timeline: {
    title: '3. Calendrier opérationnel',
    events: [
      {
        date: 'Avant le 20 juillet 2026',
        label: 'Préparation',
        detail:
          'Demandez ce guide, préparez vos pièces (identité, RIB, justificatif de domicile) et estimez le montant à investir.',
      },
      {
        date: '20 juillet — 6 août 2026',
        label: 'Période de souscription',
        detail:
          'Dépôt du bulletin signé et règlement des fonds auprès d\'Everest Finance. La clôture anticipée est possible si l\'offre est entièrement souscrite.',
      },
      {
        date: '21 août 2026',
        label: 'Règlement-livraison',
        detail:
          'Attribution des titres selon les modalités de l\'offre. Vous êtes informé du résultat de votre souscription.',
      },
      {
        date: 'Septembre 2026',
        label: 'Cotation BRVM',
        detail:
          'Admission des titres à la cote de la Bourse Régionale des Valeurs Mobilières (sous réserve des conditions de marché).',
      },
    ],
  },
  procedure: {
    title: '4. Procédure de souscription en 5 étapes',
    steps: [
      {
        step: 'Étape 1',
        title: 'Prendre contact avec Everest Finance',
        tasks: [
          'Remplir le formulaire en ligne (nom, téléphone, email, montant envisagé, canal de rappel).',
          'Un conseiller vous contacte sous 24 h ouvrées pour confirmer votre profil et répondre à vos questions.',
        ],
      },
      {
        step: 'Étape 2',
        title: 'Rassembler et transmettre les pièces',
        tasks: [
          'Fournir les documents listés à la section 5 (checklist).',
          'Vérifier que les copies sont lisibles et en cours de validité.',
        ],
      },
      {
        step: 'Étape 3',
        title: 'Définir le montant et le nombre d\'actions',
        tasks: [
          'Indiquer la tranche ou le montant que vous souhaitez investir.',
          'Le conseiller calcule le nombre d\'actions correspondant au prix de 6 750 FCFA l\'unité.',
        ],
      },
      {
        step: 'Étape 4',
        title: 'Signer le bulletin et régler',
        tasks: [
          'Compléter et signer le bulletin de souscription fourni par Everest Finance.',
          'Effectuer le règlement selon les modalités communiquées (virement ou autre moyen accepté).',
          'Conserver une copie du bulletin et la preuve de paiement.',
        ],
      },
      {
        step: 'Étape 5',
        title: 'Suivre l\'allocation',
        tasks: [
          'Après clôture, Everest Finance vous informe du résultat (attribué, partiellement attribué ou non retenu).',
          'Les titres sont crédités sur votre compte titres après règlement-livraison.',
        ],
      },
    ],
  },
  dossier: {
    title: '5. Constitution du dossier',
    intro:
      'Cochez les éléments dont vous disposez. La liste définitive peut varier selon votre statut (particulier, professionnel, personne morale).',
    checklist: [
      'Pièce d\'identité nationale ou passeport en cours de validité',
      'Relevé d\'identité bancaire (RIB) au nom du souscripteur',
      'Justificatif de domicile de moins de 3 mois',
      'Bulletin de souscription complété et signé',
      'Preuve de règlement (reçu de virement ou bordereau)',
      'Pour les personnes morales : RCCM, statuts, pouvoir du signataire',
      'Pour les non-résidents : pièces complémentaires selon profil KYC',
    ],
    note:
      'Everest Finance applique les obligations de connaissance client (KYC) et de lutte contre le blanchiment. Des pièces supplémentaires peuvent être demandées.',
  },
  after: {
    title: '6. Après votre demande',
    paragraphs: [
      'Délai de rappel : sous 24 h ouvrées sur le canal choisi (WhatsApp ou téléphone).',
      'Votre conseiller vous guide jusqu\'à la transmission complète du dossier. Aucune souscription n\'est définitive tant que le bulletin n\'est pas signé et les fonds reçus.',
      'En cas de sursouscription de l\'offre, l\'attribution peut être réduite au prorata ou selon les règles décrites dans la notice d\'information.',
    ],
    channels: [
      ['Formulaire en ligne', 'everestfin.com — campagne IPO Bridge Bank'],
      ['WhatsApp', 'Disponible depuis la page campagne'],
      ['Email', 'contact@everestfin.com'],
    ],
  },
  faq: {
    title: '7. Questions fréquentes',
    items: [
      {
        q: 'Puis-je souscrire sans passer par Everest Finance ?',
        a: "Everest Finance est l'intermédiaire désigné pour accompagner cette campagne. D'autres intermédiaires agréés peuvent être habilités ; vérifiez la notice d'information.",
      },
      {
        q: 'Quel est le montant minimum ?',
        a: "Le prix unitaire est de 6 750 FCFA par action. Le montant minimum dépend du nombre d'actions exigé par l'offre (consultez la notice ou votre conseiller).",
      },
      {
        q: 'Que se passe-t-il si je rate la date de clôture ?',
        a: "Les souscriptions reçues après le 6 août 2026 ne peuvent pas être acceptées. Anticipez votre dossier avant la dernière semaine.",
      },
      {
        q: 'Quand recevrai-je mes titres ?',
        a: "Après le règlement-livraison prévu le 21 août 2026, sous réserve d'attribution. Vous serez notifié par votre conseiller.",
      },
      {
        q: 'Ce guide remplace-t-il la notice d\'information ?',
        a: "Non. Seule la notice d'information officielle fait foi. Ce document est un aide-mémoire opérationnel.",
      },
    ],
  },
  contact: {
    title: '8. Nous contacter',
    lines: [
      'Everest Finance — Marchés de capitaux',
      'Site : everestfin.com',
      'Email : contact@everestfin.com',
      'Campagne : /ipo-bridge-bank',
    ],
    legal:
      "Avertissement : investir en actions comporte un risque de perte en capital. Les performances passées ne préjugent pas des performances futures. Ce document est édité par Everest Finance à titre informatif. Consultez la notice d'information et, si besoin, un conseiller avant toute décision.",
  },
} as const
