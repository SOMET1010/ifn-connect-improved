/**
 * Configuration des badges sociaux pour la gamification E-Learning
 * Chaque badge est associé à un cours et un seuil de score
 */

export interface Badge {
  id: string;
  name: string;
  icon: string; // Emoji
  description: string;
  courseId: number;
  minScore: number; // Score minimum pour obtenir le badge (0-100)
  color: string; // Couleur du badge pour l'affichage
}

export const BADGES: Record<string, Badge> = {
  // Gestion de Stock (Cours 1, 2, 5)
  MAITRE_STOCK: {
    id: 'maitre_stock',
    name: 'Maître du Stock',
    icon: '📦',
    description: 'Expert en gestion de stock et inventaire',
    courseId: 1,
    minScore: 80,
    color: '#10b981', // green-500
  },
  PRO_INVENTAIRE: {
    id: 'pro_inventaire',
    name: 'Pro Inventaire',
    icon: '📋',
    description: 'Spécialiste de l\'inventaire mensuel',
    courseId: 5,
    minScore: 80,
    color: '#10b981',
  },

  // Marketing (Cours 3, 4)
  EXPERT_MARKETING: {
    id: 'expert_marketing',
    name: 'Expert Marketing',
    icon: '📢',
    description: 'Champion du marketing pour petit commerce',
    courseId: 4,
    minScore: 80,
    color: '#f59e0b', // amber-500
  },
  SOCIAL_MEDIA_PRO: {
    id: 'social_media_pro',
    name: 'Pro Réseaux Sociaux',
    icon: '📱',
    description: 'Maître des réseaux sociaux pour le commerce',
    courseId: 3,
    minScore: 80,
    color: '#f59e0b',
  },

  // Protection Sociale (Cours 30001, 30002)
  PRO_CNPS: {
    id: 'pro_cnps',
    name: 'Pro CNPS',
    icon: '🛡️',
    description: 'Expert de la retraite CNPS',
    courseId: 30001,
    minScore: 80,
    color: '#3b82f6', // blue-500
  },
  EXPERT_CMU: {
    id: 'expert_cmu',
    name: 'Expert CMU',
    icon: '🏥',
    description: 'Spécialiste de la couverture maladie',
    courseId: 30002,
    minScore: 80,
    color: '#3b82f6',
  },

  // Paiements Mobiles (Cours 30003, 30004, 30005)
  CHAMPION_ORANGE_MONEY: {
    id: 'champion_orange_money',
    name: 'Champion Orange Money',
    icon: '🟠',
    description: 'Maître d\'Orange Money',
    courseId: 30003,
    minScore: 80,
    color: '#f97316', // orange-500
  },
  PRO_MOBILE_MONEY: {
    id: 'pro_mobile_money',
    name: 'Pro Mobile Money',
    icon: '💰',
    description: 'Expert des paiements mobiles',
    courseId: 30005,
    minScore: 80,
    color: '#f97316',
  },

  // Badges spéciaux (tous cours)
  PERFECTIONNISTE: {
    id: 'perfectionniste',
    name: 'Perfectionniste',
    icon: '🏆',
    description: 'Score parfait de 100% sur un quiz',
    courseId: 0, // Tous les cours
    minScore: 100,
    color: '#eab308', // yellow-500
  },
  APPRENANT_ASSIDU: {
    id: 'apprenant_assidu',
    name: 'Apprenant Assidu',
    icon: '⭐',
    description: 'Terminé 5 cours avec succès',
    courseId: 0, // Tous les cours
    minScore: 70,
    color: '#eab308',
  },
};

/**
 * Obtenir le badge correspondant à un cours et un score
 */
export function getBadgeForCourse(courseId: number, score: number): Badge | null {
  const badge = Object.values(BADGES).find(
    (b) => b.courseId === courseId && score >= b.minScore
  );
  return badge || null;
}

/**
 * Vérifier si l'utilisateur mérite le badge "Perfectionniste"
 */
export function checkPerfectionistBadge(score: number): Badge | null {
  if (score === 100) {
    return BADGES.PERFECTIONNISTE;
  }
  return null;
}

/**
 * Vérifier si l'utilisateur mérite le badge "Apprenant Assidu"
 */
export function checkAssiduousBadge(completedCoursesCount: number): Badge | null {
  if (completedCoursesCount >= 5) {
    return BADGES.APPRENANT_ASSIDU;
  }
  return null;
}
