/**
 * Traductions multilingues pour IFN Connect
 * Support de 6 langues : Français + 5 langues locales de Côte d'Ivoire
 */

import { SupportedLanguage } from './audioManager';

export interface Translations {
  // Navigation et actions principales
  home: string;
  sell: string;
  stock: string;
  money: string;
  help: string;
  profile: string;
  logout: string;
  
  // Marchands
  dashboard: string;
  todaySales: string;
  totalAmount: string;
  lowStock: string;
  orders: string;
  transactions: string;
  
  // Ventes
  newSale: string;
  product: string;
  quantity: string;
  price: string;
  total: string;
  save: string;
  cancel: string;
  
  // Stock
  currentStock: string;
  addStock: string;
  lowStockAlert: string;
  outOfStock: string;
  
  // Argent
  balance: string;
  sendMoney: string;
  receiveMoney: string;
  mobileMoney: string;
  paymentHistory: string;
  
  // Protection sociale
  socialProtection: string;
  cnps: string;
  cmu: string;
  status: string;
  active: string;
  inactive: string;
  
  // Marché
  marketplace: string;
  orderNow: string;
  cart: string;
  checkout: string;
  
  // Agents
  enrollment: string;
  merchantInfo: string;
  documents: string;
  location: string;
  takePhoto: string;
  
  // Coopérative
  cooperative: string;
  members: string;
  groupOrders: string;
  centralStock: string;
  
  // Général
  loading: string;
  error: string;
  success: string;
  confirm: string;
  yes: string;
  no: string;
  search: string;
  filter: string;
  date: string;
  amount: string;
  
  // Messages
  welcome: string;
  welcomeBack: string;
  operationSuccess: string;
  operationError: string;
  confirmAction: string;
}

export const translations: Record<SupportedLanguage, Translations> = {
  fr: {
    // Navigation et actions principales
    home: 'Accueil',
    sell: 'Vendre',
    stock: 'Stock',
    money: 'Argent',
    help: 'Aide',
    profile: 'Profil',
    logout: 'Déconnexion',
    
    // Marchands
    dashboard: 'Tableau de bord',
    todaySales: 'Ventes du jour',
    totalAmount: 'Montant total',
    lowStock: 'Stock faible',
    orders: 'Commandes',
    transactions: 'Transactions',
    
    // Ventes
    newSale: 'Nouvelle vente',
    product: 'Produit',
    quantity: 'Quantité',
    price: 'Prix',
    total: 'Total',
    save: 'Enregistrer',
    cancel: 'Annuler',
    
    // Stock
    currentStock: 'Stock actuel',
    addStock: 'Ajouter au stock',
    lowStockAlert: 'Alerte stock faible',
    outOfStock: 'Rupture de stock',
    
    // Argent
    balance: 'Solde',
    sendMoney: 'Envoyer de l\'argent',
    receiveMoney: 'Recevoir de l\'argent',
    mobileMoney: 'Mobile Money',
    paymentHistory: 'Historique des paiements',
    
    // Protection sociale
    socialProtection: 'Protection sociale',
    cnps: 'CNPS (Retraite)',
    cmu: 'CMU (Santé)',
    status: 'Statut',
    active: 'Actif',
    inactive: 'Inactif',
    
    // Marché
    marketplace: 'Marché virtuel',
    orderNow: 'Commander maintenant',
    cart: 'Panier',
    checkout: 'Valider la commande',
    
    // Agents
    enrollment: 'Enrôlement',
    merchantInfo: 'Informations marchand',
    documents: 'Documents',
    location: 'Localisation',
    takePhoto: 'Prendre une photo',
    
    // Coopérative
    cooperative: 'Coopérative',
    members: 'Membres',
    groupOrders: 'Commandes groupées',
    centralStock: 'Stock centralisé',
    
    // Général
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    confirm: 'Confirmer',
    yes: 'Oui',
    no: 'Non',
    search: 'Rechercher',
    filter: 'Filtrer',
    date: 'Date',
    amount: 'Montant',
    
    // Messages
    welcome: 'Bienvenue sur IFN Connect',
    welcomeBack: 'Bon retour',
    operationSuccess: 'Opération réussie !',
    operationError: 'Une erreur est survenue. Veuillez réessayer.',
    confirmAction: 'Êtes-vous sûr de vouloir continuer ?',
  },
  
  dioula: {
    // Navigation et actions principales
    home: 'Accueil',
    sell: 'Vendre',
    stock: 'Stock',
    money: 'Wari',
    help: 'Aide',
    profile: 'Profil',
    logout: 'Sortir',
    
    // Marchands
    dashboard: 'Tableau',
    todaySales: 'Ventes du jour',
    totalAmount: 'Total wari',
    lowStock: 'Stock faible',
    orders: 'Commandes',
    transactions: 'Transactions',
    
    // Ventes
    newSale: 'Nouvelle vente',
    product: 'Produit',
    quantity: 'Quantité',
    price: 'Prix',
    total: 'Total',
    save: 'Enregistrer',
    cancel: 'Annuler',
    
    // Stock
    currentStock: 'Stock actuel',
    addStock: 'Ajouter stock',
    lowStockAlert: 'Alerte stock',
    outOfStock: 'Rupture',
    
    // Argent
    balance: 'Solde',
    sendMoney: 'Envoyer wari',
    receiveMoney: 'Recevoir wari',
    mobileMoney: 'Mobile Money',
    paymentHistory: 'Historique',
    
    // Protection sociale
    socialProtection: 'Protection sociale',
    cnps: 'CNPS (Retraite)',
    cmu: 'CMU (Santé)',
    status: 'Statut',
    active: 'Actif',
    inactive: 'Inactif',
    
    // Marché
    marketplace: 'Marché',
    orderNow: 'Commander',
    cart: 'Panier',
    checkout: 'Valider',
    
    // Agents
    enrollment: 'Enrôlement',
    merchantInfo: 'Info marchand',
    documents: 'Documents',
    location: 'Localisation',
    takePhoto: 'Photo',
    
    // Coopérative
    cooperative: 'Coopérative',
    members: 'Membres',
    groupOrders: 'Commandes groupées',
    centralStock: 'Stock central',
    
    // Général
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    confirm: 'Confirmer',
    yes: 'Oui',
    no: 'Non',
    search: 'Chercher',
    filter: 'Filtrer',
    date: 'Date',
    amount: 'Montant',
    
    // Messages
    welcome: 'I ni ce IFN Connect',
    welcomeBack: 'I ni ce',
    operationSuccess: 'Opération réussie !',
    operationError: 'Erreur. Réessayez.',
    confirmAction: 'Continuer ?',
  },
  
  baule: {
    // Navigation et actions principales
    home: 'Accueil',
    sell: 'Vendre',
    stock: 'Stock',
    money: 'Argent',
    help: 'Aide',
    profile: 'Profil',
    logout: 'Sortir',
    
    // Marchands
    dashboard: 'Tableau',
    todaySales: 'Ventes jour',
    totalAmount: 'Total',
    lowStock: 'Stock faible',
    orders: 'Commandes',
    transactions: 'Transactions',
    
    // Ventes
    newSale: 'Nouvelle vente',
    product: 'Produit',
    quantity: 'Quantité',
    price: 'Prix',
    total: 'Total',
    save: 'Enregistrer',
    cancel: 'Annuler',
    
    // Stock
    currentStock: 'Stock actuel',
    addStock: 'Ajouter',
    lowStockAlert: 'Alerte',
    outOfStock: 'Rupture',
    
    // Argent
    balance: 'Solde',
    sendMoney: 'Envoyer',
    receiveMoney: 'Recevoir',
    mobileMoney: 'Mobile Money',
    paymentHistory: 'Historique',
    
    // Protection sociale
    socialProtection: 'Protection',
    cnps: 'CNPS',
    cmu: 'CMU',
    status: 'Statut',
    active: 'Actif',
    inactive: 'Inactif',
    
    // Marché
    marketplace: 'Marché',
    orderNow: 'Commander',
    cart: 'Panier',
    checkout: 'Valider',
    
    // Agents
    enrollment: 'Enrôlement',
    merchantInfo: 'Info',
    documents: 'Documents',
    location: 'Lieu',
    takePhoto: 'Photo',
    
    // Coopérative
    cooperative: 'Coopérative',
    members: 'Membres',
    groupOrders: 'Commandes',
    centralStock: 'Stock',
    
    // Général
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    confirm: 'Confirmer',
    yes: 'Oui',
    no: 'Non',
    search: 'Chercher',
    filter: 'Filtrer',
    date: 'Date',
    amount: 'Montant',
    
    // Messages
    welcome: 'Akwaba IFN Connect',
    welcomeBack: 'Akwaba',
    operationSuccess: 'Succès !',
    operationError: 'Erreur.',
    confirmAction: 'Continuer ?',
  },
  
  bete: {
    // Utilise le français comme base pour le Bété
    // À personnaliser avec des expressions Bété authentiques
    home: 'Accueil',
    sell: 'Vendre',
    stock: 'Stock',
    money: 'Argent',
    help: 'Aide',
    profile: 'Profil',
    logout: 'Sortir',
    dashboard: 'Tableau',
    todaySales: 'Ventes jour',
    totalAmount: 'Total',
    lowStock: 'Stock faible',
    orders: 'Commandes',
    transactions: 'Transactions',
    newSale: 'Nouvelle vente',
    product: 'Produit',
    quantity: 'Quantité',
    price: 'Prix',
    total: 'Total',
    save: 'Enregistrer',
    cancel: 'Annuler',
    currentStock: 'Stock actuel',
    addStock: 'Ajouter',
    lowStockAlert: 'Alerte',
    outOfStock: 'Rupture',
    balance: 'Solde',
    sendMoney: 'Envoyer',
    receiveMoney: 'Recevoir',
    mobileMoney: 'Mobile Money',
    paymentHistory: 'Historique',
    socialProtection: 'Protection',
    cnps: 'CNPS',
    cmu: 'CMU',
    status: 'Statut',
    active: 'Actif',
    inactive: 'Inactif',
    marketplace: 'Marché',
    orderNow: 'Commander',
    cart: 'Panier',
    checkout: 'Valider',
    enrollment: 'Enrôlement',
    merchantInfo: 'Info',
    documents: 'Documents',
    location: 'Lieu',
    takePhoto: 'Photo',
    cooperative: 'Coopérative',
    members: 'Membres',
    groupOrders: 'Commandes',
    centralStock: 'Stock',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    confirm: 'Confirmer',
    yes: 'Oui',
    no: 'Non',
    search: 'Chercher',
    filter: 'Filtrer',
    date: 'Date',
    amount: 'Montant',
    welcome: 'Bienvenue IFN Connect',
    welcomeBack: 'Bienvenue',
    operationSuccess: 'Succès !',
    operationError: 'Erreur.',
    confirmAction: 'Continuer ?',
  },
  
  senoufo: {
    // Utilise le français comme base pour le Sénoufo
    // À personnaliser avec des expressions Sénoufo authentiques
    home: 'Accueil',
    sell: 'Vendre',
    stock: 'Stock',
    money: 'Argent',
    help: 'Aide',
    profile: 'Profil',
    logout: 'Sortir',
    dashboard: 'Tableau',
    todaySales: 'Ventes jour',
    totalAmount: 'Total',
    lowStock: 'Stock faible',
    orders: 'Commandes',
    transactions: 'Transactions',
    newSale: 'Nouvelle vente',
    product: 'Produit',
    quantity: 'Quantité',
    price: 'Prix',
    total: 'Total',
    save: 'Enregistrer',
    cancel: 'Annuler',
    currentStock: 'Stock actuel',
    addStock: 'Ajouter',
    lowStockAlert: 'Alerte',
    outOfStock: 'Rupture',
    balance: 'Solde',
    sendMoney: 'Envoyer',
    receiveMoney: 'Recevoir',
    mobileMoney: 'Mobile Money',
    paymentHistory: 'Historique',
    socialProtection: 'Protection',
    cnps: 'CNPS',
    cmu: 'CMU',
    status: 'Statut',
    active: 'Actif',
    inactive: 'Inactif',
    marketplace: 'Marché',
    orderNow: 'Commander',
    cart: 'Panier',
    checkout: 'Valider',
    enrollment: 'Enrôlement',
    merchantInfo: 'Info',
    documents: 'Documents',
    location: 'Lieu',
    takePhoto: 'Photo',
    cooperative: 'Coopérative',
    members: 'Membres',
    groupOrders: 'Commandes',
    centralStock: 'Stock',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    confirm: 'Confirmer',
    yes: 'Oui',
    no: 'Non',
    search: 'Chercher',
    filter: 'Filtrer',
    date: 'Date',
    amount: 'Montant',
    welcome: 'Bienvenue IFN Connect',
    welcomeBack: 'Bienvenue',
    operationSuccess: 'Succès !',
    operationError: 'Erreur.',
    confirmAction: 'Continuer ?',
  },
  
  malinke: {
    // Utilise le français comme base pour le Malinké
    // À personnaliser avec des expressions Malinké authentiques
    home: 'Accueil',
    sell: 'Vendre',
    stock: 'Stock',
    money: 'Argent',
    help: 'Aide',
    profile: 'Profil',
    logout: 'Sortir',
    dashboard: 'Tableau',
    todaySales: 'Ventes jour',
    totalAmount: 'Total',
    lowStock: 'Stock faible',
    orders: 'Commandes',
    transactions: 'Transactions',
    newSale: 'Nouvelle vente',
    product: 'Produit',
    quantity: 'Quantité',
    price: 'Prix',
    total: 'Total',
    save: 'Enregistrer',
    cancel: 'Annuler',
    currentStock: 'Stock actuel',
    addStock: 'Ajouter',
    lowStockAlert: 'Alerte',
    outOfStock: 'Rupture',
    balance: 'Solde',
    sendMoney: 'Envoyer',
    receiveMoney: 'Recevoir',
    mobileMoney: 'Mobile Money',
    paymentHistory: 'Historique',
    socialProtection: 'Protection',
    cnps: 'CNPS',
    cmu: 'CMU',
    status: 'Statut',
    active: 'Actif',
    inactive: 'Inactif',
    marketplace: 'Marché',
    orderNow: 'Commander',
    cart: 'Panier',
    checkout: 'Valider',
    enrollment: 'Enrôlement',
    merchantInfo: 'Info',
    documents: 'Documents',
    location: 'Lieu',
    takePhoto: 'Photo',
    cooperative: 'Coopérative',
    members: 'Membres',
    groupOrders: 'Commandes',
    centralStock: 'Stock',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    confirm: 'Confirmer',
    yes: 'Oui',
    no: 'Non',
    search: 'Chercher',
    filter: 'Filtrer',
    date: 'Date',
    amount: 'Montant',
    welcome: 'Bienvenue IFN Connect',
    welcomeBack: 'Bienvenue',
    operationSuccess: 'Succès !',
    operationError: 'Erreur.',
    confirmAction: 'Continuer ?',
  },
};

/**
 * Hook pour obtenir les traductions selon la langue courante
 */
export function useTranslations(language: SupportedLanguage): Translations {
  return translations[language] || translations.fr;
}

/**
 * Obtenir une traduction spécifique
 */
export function t(key: keyof Translations, language: SupportedLanguage): string {
  return translations[language]?.[key] || translations.fr[key] || key;
}
