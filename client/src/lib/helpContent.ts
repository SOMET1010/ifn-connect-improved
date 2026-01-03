export interface HelpSection {
  title: string;
  icon?: string;
  content: string[];
}

export interface HelpContent {
  title: string;
  description: string;
  sections: HelpSection[];
  tips?: string[];
  shortcuts?: { key: string; description: string }[];
}

export const helpContent: Record<string, HelpContent> = {
  'merchant-dashboard': {
    title: 'Tableau de bord Marchand',
    description: 'Vue d\'ensemble de ton activité commerciale',
    sections: [
      {
        title: 'Comprendre ton tableau de bord',
        icon: '📊',
        content: [
          'Le tableau de bord te montre un résumé de tes performances commerciales.',
          'Tu peux voir tes ventes du jour, ton chiffre d\'affaires, ton épargne et ton stock.',
        ],
      },
      {
        title: 'Actions rapides',
        icon: '⚡',
        content: [
          'Enregistrer une vente : Clique sur "Caisse" pour enregistrer rapidement une transaction.',
          'Consulter ton stock : Vérifie quels produits sont disponibles.',
          'Voir ton épargne : Consulte combien tu as économisé ce mois-ci.',
        ],
      },
    ],
    tips: [
      'Consulte ton tableau de bord chaque matin pour voir tes objectifs du jour',
      'Active le briefing matinal dans les paramètres pour recevoir un résumé',
      'Les badges se débloquent automatiquement quand tu atteins des objectifs',
    ],
    shortcuts: [
      { key: 'F1', description: 'Ouvrir l\'aide' },
      { key: '?', description: 'Ouvrir l\'aide' },
    ],
  },

  'cash-register': {
    title: 'Caisse Enregistreuse',
    description: 'Enregistre tes ventes rapidement et facilement',
    sections: [
      {
        title: 'Comment enregistrer une vente',
        icon: '🛒',
        content: [
          '1. Sélectionne les produits vendus en cliquant dessus ou en utilisant la recherche.',
          '2. Ajuste les quantités si nécessaire.',
          '3. Vérifie le montant total.',
          '4. Clique sur "Confirmer la vente" pour enregistrer.',
        ],
      },
      {
        title: 'Modes de paiement',
        icon: '💰',
        content: [
          'Tu peux accepter les paiements en espèces ou par mobile money (Orange, MTN, Moov, Wave).',
          'Le système calcule automatiquement la monnaie à rendre pour les paiements en espèces.',
        ],
      },
      {
        title: 'Ventes vocales',
        icon: '🎤',
        content: [
          'Active le micro et dicte ta vente : "2 kilos de riz et 3 tomates".',
          'SUTA comprend le français et le nouchi !',
        ],
      },
    ],
    tips: [
      'Utilise la recherche pour trouver rapidement un produit',
      'La vente vocale est idéale quand tu as les mains occupées',
      'Vérifie toujours le montant avant de confirmer',
    ],
  },

  'stock': {
    title: 'Gestion du Stock',
    description: 'Gère ton inventaire et évite les ruptures',
    sections: [
      {
        title: 'Ajouter des produits',
        icon: '📦',
        content: [
          'Clique sur "Ajouter au stock" pour enregistrer un nouvel arrivage.',
          'Indique la quantité et le prix d\'achat.',
        ],
      },
      {
        title: 'Alertes de stock',
        icon: '🔔',
        content: [
          'Tu reçois une alerte quand un produit est presque épuisé.',
          'Configure le seuil d\'alerte pour chaque produit dans les paramètres.',
        ],
      },
      {
        title: 'Historique des mouvements',
        icon: '📋',
        content: [
          'Consulte l\'historique pour voir tous les ajouts et les ventes.',
          'Cela t\'aide à comprendre quels produits se vendent le mieux.',
        ],
      },
    ],
    tips: [
      'Mets à jour ton stock régulièrement pour des statistiques précises',
      'Profite des commandes groupées pour économiser sur les achats',
    ],
  },

  'virtual-market': {
    title: 'Marché Virtuel',
    description: 'Commande tes produits directement auprès des grossistes',
    sections: [
      {
        title: 'Comment commander',
        icon: '🛒',
        content: [
          '1. Parcours le catalogue de produits disponibles.',
          '2. Ajoute les produits souhaités à ton panier.',
          '3. Vérifie ton panier et le montant total.',
          '4. Choisis ton mode de paiement (Mobile Money).',
          '5. Confirme ta commande.',
        ],
      },
      {
        title: 'Livraison',
        icon: '🚚',
        content: [
          'Les commandes sont livrées sous 24-48h selon ta localisation.',
          'Tu reçois une notification quand ta commande est en route.',
        ],
      },
      {
        title: 'Commandes groupées',
        icon: '👥',
        content: [
          'Rejoins d\'autres marchands pour commander ensemble et économiser.',
          'Les opportunités de commandes groupées apparaissent dans tes notifications.',
        ],
      },
    ],
    tips: [
      'Commande en gros pour obtenir de meilleurs prix',
      'Active les notifications de commandes groupées dans les paramètres',
      'Vérifie les délais de livraison avant de commander',
    ],
  },

  'savings': {
    title: 'Épargne et Tontine',
    description: 'Économise et atteins tes objectifs financiers',
    sections: [
      {
        title: 'Comment épargner',
        icon: '🐷',
        content: [
          'SUTA te propose automatiquement d\'épargner après une grosse vente.',
          'Tu peux aussi épargner manuellement depuis la page Épargne.',
          'Définis des objectifs d\'épargne pour te motiver.',
        ],
      },
      {
        title: 'La tontine digitale',
        icon: '🤝',
        content: [
          'Rejoins un groupe de tontine pour épargner ensemble.',
          'Chaque membre cotise régulièrement.',
          'À tour de rôle, un membre reçoit la cagnotte complète.',
        ],
      },
      {
        title: 'Retrait',
        icon: '💸',
        content: [
          'Tu peux retirer ton épargne à tout moment vers ton mobile money.',
          'Certains objectifs donnent des bonus si tu ne retires pas avant la fin.',
        ],
      },
    ],
    tips: [
      'Commence petit : même 500 FCFA par jour font 15.000 FCFA par mois',
      'Les objectifs d\'épargne débloquent des badges spéciaux',
      'La régularité est plus importante que le montant',
    ],
  },

  'social-protection': {
    title: 'Protection Sociale',
    description: 'Gère ta couverture CNPS et CMU',
    sections: [
      {
        title: 'Vérifier ta couverture',
        icon: '🏥',
        content: [
          'Consulte l\'état de ta couverture CNPS (retraite) et CMU (santé).',
          'Tu reçois des alertes avant l\'expiration de ta couverture.',
        ],
      },
      {
        title: 'Renouvellement',
        icon: '🔄',
        content: [
          'Clique sur "Renouveler" pour faire une demande.',
          'Un agent de la DGE/ANSUT te contactera pour finaliser.',
          'Tu peux aussi payer directement via Mobile Money si activé.',
        ],
      },
      {
        title: 'Documents',
        icon: '📄',
        content: [
          'Télécharge tes attestations de couverture.',
          'Consulte l\'historique de tes cotisations.',
        ],
      },
    ],
    tips: [
      'Ne laisse jamais ta couverture expirer',
      'Renouvelle au moins 2 semaines avant la date d\'expiration',
      'Garde tes attestations à jour sur ton téléphone',
    ],
  },

  'agent-dashboard': {
    title: 'Tableau de bord Agent',
    description: 'Gère tes enrôlements et ton suivi',
    sections: [
      {
        title: 'Tes tâches du jour',
        icon: '✅',
        content: [
          'Consulte la liste des marchands à contacter aujourd\'hui.',
          'Priorise les marchands dont la couverture sociale expire bientôt.',
          'Marque les tâches comme complétées au fur et à mesure.',
        ],
      },
      {
        title: 'Enrôler un nouveau marchand',
        icon: '👤',
        content: [
          'Clique sur "Nouvel enrôlement".',
          'Remplis le formulaire étape par étape.',
          'Prends une photo de la carte d\'identité du marchand.',
          'Valide et finalise l\'enrôlement.',
        ],
      },
      {
        title: 'Statistiques',
        icon: '📊',
        content: [
          'Consulte tes performances : nombre d\'enrôlements, taux de succès.',
          'Compare-toi aux autres agents dans le leaderboard.',
        ],
      },
    ],
    tips: [
      'Visite chaque marchand au moins une fois par mois',
      'Les enrôlements de qualité débloquent des badges',
      'Utilise la carte pour planifier tes déplacements efficacement',
    ],
  },

  'enrollment-wizard': {
    title: 'Assistant d\'Enrôlement',
    description: 'Enrôle un nouveau marchand en quelques étapes',
    sections: [
      {
        title: 'Étape 1 : Informations personnelles',
        icon: '1️⃣',
        content: [
          'Collecte le nom, prénom, date de naissance.',
          'Prends une photo de la carte d\'identité.',
          'Vérifie que les informations sont lisibles.',
        ],
      },
      {
        title: 'Étape 2 : Localisation',
        icon: '2️⃣',
        content: [
          'Sélectionne le marché où le marchand exerce.',
          'Note l\'emplacement exact (allée, rangée).',
          'Active la géolocalisation si disponible.',
        ],
      },
      {
        title: 'Étape 3 : Activité commerciale',
        icon: '3️⃣',
        content: [
          'Indique le type de commerce (fruits, légumes, poisson, etc.).',
          'Estime le chiffre d\'affaires mensuel.',
          'Note les jours et heures d\'ouverture habituels.',
        ],
      },
      {
        title: 'Étape 4 : Validation',
        icon: '4️⃣',
        content: [
          'Relis toutes les informations avec le marchand.',
          'Fais-lui signer électroniquement sur l\'écran.',
          'Confirme l\'enrôlement.',
        ],
      },
    ],
    tips: [
      'Prends le temps d\'expliquer SUTA au marchand',
      'Assure-toi que toutes les informations sont exactes',
      'Programme une visite de suivi dans 7 jours',
    ],
  },

  'admin-dashboard': {
    title: 'Tableau de bord Administrateur',
    description: 'Pilote le programme et analyse les performances',
    sections: [
      {
        title: 'Vue d\'ensemble',
        icon: '🎯',
        content: [
          'Consulte les KPIs globaux : nombre de marchands actifs, transactions, épargne totale.',
          'Analyse les tendances sur les 12 derniers mois.',
          'Identifie les marchés les plus performants.',
        ],
      },
      {
        title: 'Gestion des utilisateurs',
        icon: '👥',
        content: [
          'Ajoute, modifie ou supprime des agents.',
          'Consulte les performances individuelles.',
          'Attribue des rôles et permissions.',
        ],
      },
      {
        title: 'Exports et rapports',
        icon: '📊',
        content: [
          'Exporte les données en Excel pour reporting.',
          'Génère des rapports personnalisés par marché ou période.',
          'Consulte les logs d\'audit pour la traçabilité.',
        ],
      },
    ],
    tips: [
      'Exporte les données chaque fin de mois pour les rapports',
      'Surveille les alertes de sécurité dans les logs d\'audit',
      'Contacte les agents dont les performances baissent',
    ],
  },

  'cooperative-dashboard': {
    title: 'Tableau de bord Coopérative',
    description: 'Gère ta coopérative et organise des achats groupés',
    sections: [
      {
        title: 'Membres de la coopérative',
        icon: '👥',
        content: [
          'Consulte la liste de tous les membres.',
          'Invite de nouveaux marchands à rejoindre.',
          'Gère les adhésions et les cotisations.',
        ],
      },
      {
        title: 'Commandes groupées',
        icon: '📦',
        content: [
          'Crée une nouvelle opportunité d\'achat groupé.',
          'Définis le produit, le prix négocié, et la quantité minimum.',
          'Les membres reçoivent une notification et peuvent participer.',
          'Lance la commande quand le quota est atteint.',
        ],
      },
      {
        title: 'Tontine collective',
        icon: '💰',
        content: [
          'Organise des cycles de tontine pour les membres.',
          'Gère les cotisations et les distributions.',
          'Consulte l\'historique des cycles passés.',
        ],
      },
    ],
    tips: [
      'Négocie avec plusieurs grossistes pour obtenir les meilleurs prix',
      'Communique régulièrement avec les membres pour maintenir l\'engagement',
      'Organise des réunions mensuelles pour discuter des opportunités',
    ],
  },

  'learning': {
    title: 'Formation et Apprentissage',
    description: 'Développe tes compétences commerciales',
    sections: [
      {
        title: 'Cours disponibles',
        icon: '📚',
        content: [
          'Parcours les différents modules de formation.',
          'Chaque cours contient des vidéos, du texte et des quiz.',
          'Progresse à ton rythme.',
        ],
      },
      {
        title: 'Quiz et certification',
        icon: '🎓',
        content: [
          'Réponds aux quiz à la fin de chaque module.',
          'Tu dois obtenir au moins 70% pour valider.',
          'Obtiens des certificats pour chaque cours complété.',
        ],
      },
      {
        title: 'Badges d\'apprentissage',
        icon: '🏆',
        content: [
          'Débloque des badges spéciaux en complétant les cours.',
          'Certains badges donnent accès à des fonctionnalités premium.',
        ],
      },
    ],
    tips: [
      'Fais au moins un cours par semaine',
      'N\'hésite pas à refaire les quiz si tu échoues',
      'Applique ce que tu apprends dans ton commerce',
    ],
  },

  'badges': {
    title: 'Badges et Récompenses',
    description: 'Collectionne des badges en atteignant des objectifs',
    sections: [
      {
        title: 'Types de badges',
        icon: '🏆',
        content: [
          'Badges de vente : En fonction de ton chiffre d\'affaires.',
          'Badges d\'épargne : Pour atteindre tes objectifs financiers.',
          'Badges d\'apprentissage : En complétant des cours.',
          'Badges sociaux : Pour la participation communautaire.',
        ],
      },
      {
        title: 'Comment les obtenir',
        icon: '⚡',
        content: [
          'Les badges se débloquent automatiquement quand tu atteins les critères.',
          'Tu reçois une notification à chaque nouveau badge.',
          'Consulte les conditions de chaque badge pour savoir comment l\'obtenir.',
        ],
      },
    ],
    tips: [
      'Certains badges sont secrets : découvre-les en explorant',
      'Les badges rares débloquent des récompenses spéciales',
      'Partage tes badges avec d\'autres marchands pour les motiver',
    ],
  },

  'challenges': {
    title: 'Défis et Compétitions',
    description: 'Participe à des défis pour gagner des prix',
    sections: [
      {
        title: 'Défis disponibles',
        icon: '🎯',
        content: [
          'Consulte les défis actifs et à venir.',
          'Lis les règles et les récompenses de chaque défi.',
          'Inscris-toi avant la date limite.',
        ],
      },
      {
        title: 'Participation',
        icon: '🏁',
        content: [
          'Une fois inscrit, accomplis les objectifs du défi.',
          'Ton progrès est suivi automatiquement.',
          'Consulte le classement pour voir ta position.',
        ],
      },
      {
        title: 'Récompenses',
        icon: '🎁',
        content: [
          'Les gagnants reçoivent des prix : argent, stock gratuit, badges exclusifs.',
          'Même sans gagner, la participation te fait progresser.',
        ],
      },
    ],
    tips: [
      'Les défis d\'équipe sont plus faciles à gagner',
      'Planifie ta stratégie avant de commencer un défi',
      'Les défis réguliers te permettent de rester motivé',
    ],
  },

  'leaderboard': {
    title: 'Classement',
    description: 'Compare-toi aux autres marchands',
    sections: [
      {
        title: 'Types de classement',
        icon: '🏅',
        content: [
          'Classement par ventes : Qui a le meilleur chiffre d\'affaires.',
          'Classement par épargne : Qui a le plus économisé.',
          'Classement par badges : Qui a collecté le plus de badges.',
          'Classement par marché : Comparaison au sein de ton marché.',
        ],
      },
      {
        title: 'Périodes',
        icon: '📅',
        content: [
          'Consulte les classements hebdomadaires, mensuels et annuels.',
          'Chaque période offre de nouvelles opportunités de figurer en tête.',
        ],
      },
    ],
    tips: [
      'Le classement se met à jour en temps réel',
      'Les 3 premiers de chaque mois reçoivent des récompenses',
      'Utilise le classement comme source de motivation, pas de stress',
    ],
  },

  settings: {
    title: 'Paramètres',
    description: 'Personnalise ton expérience SUTA',
    sections: [
      {
        title: 'Paramètres généraux',
        icon: '⚙️',
        content: [
          'Choisis ta langue préférée (français, nouchi, anglais).',
          'Active ou désactive le mode sombre.',
          'Configure tes préférences de notification.',
        ],
      },
      {
        title: 'Paramètres marchands',
        icon: '🛍️',
        content: [
          'Configure l\'épargne automatique et le montant suggéré.',
          'Active le briefing matinal pour recevoir un résumé chaque jour.',
          'Définis tes heures d\'ouverture et de fermeture préférées.',
        ],
      },
      {
        title: 'Profil',
        icon: '👤',
        content: [
          'Consulte tes informations personnelles.',
          'Pour modifier des informations, contacte le support SUTA.',
        ],
      },
    ],
    tips: [
      'Explore tous les paramètres pour optimiser ton expérience',
      'Le briefing matinal est très utile pour planifier ta journée',
      'Active les notifications importantes pour ne rien manquer',
    ],
  },

  notifications: {
    title: 'Notifications',
    description: 'Consulte toutes tes alertes et messages',
    sections: [
      {
        title: 'Types de notifications',
        icon: '🔔',
        content: [
          'Alertes de stock : Produits en rupture ou presque épuisés.',
          'Opportunités : Commandes groupées, promotions.',
          'Renouvellements : Rappels pour CNPS/CMU.',
          'Badges : Nouveaux badges débloqués.',
          'Défis : Invitations et résultats de compétitions.',
        ],
      },
      {
        title: 'Gestion',
        icon: '✅',
        content: [
          'Clique sur une notification pour voir les détails ou agir.',
          'Marque les notifications comme lues.',
          'Filtre par type ou par date.',
        ],
      },
    ],
    tips: [
      'Consulte tes notifications chaque jour',
      'Active les notifications push pour les alertes urgentes',
      'Archive les anciennes notifications pour garder une vue claire',
    ],
  },
};
