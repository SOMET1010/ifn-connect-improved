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
  
  // Messages vocaux (Text-to-Speech)
  saleRecorded: string;
  francsCFA: string;
  tryAgain: string;
  attention: string;
  offlineMode: string;
  willSyncAutomatically: string;
  saleSavedLocally: string;
  yourCNPSExpiresIn: string;
  yourCMUExpiresIn: string;
  days: string;
  congratulations: string;
  youUnlockedBadge: string;
  soundEnabled: string;
  soundDisabled: string;
  voiceAnnouncementsEnabled: string;
  languageChanged: string;
  
  // Navigation
  previous: string;
  next: string;
  finish: string;
  skipTutorial: string;
  
  // Onboarding
  onboardingWelcomeTitle: string;
  onboardingWelcomeDesc: string;
  onboardingCashRegisterTitle: string;
  onboardingCashRegisterDesc: string;
  onboardingSoundTitle: string;
  onboardingSoundDesc: string;
  onboardingLanguageTitle: string;
  onboardingLanguageDesc: string;
  onboardingProfileTitle: string;
  onboardingProfileDesc: string;
  onboardingCongratulationsTitle: string;
  onboardingCongratulationsDesc: string;
  
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
    
    // Messages vocaux (Text-to-Speech)
    saleRecorded: 'Vente enregistrée',
    francsCFA: 'francs CFA',
    tryAgain: 'Réessayez',
    attention: 'Attention',
    offlineMode: 'Mode hors ligne',
    willSyncAutomatically: 'La vente sera synchronisée automatiquement',
    saleSavedLocally: 'Vente sauvegardée localement',
    yourCNPSExpiresIn: 'Votre CNPS expire dans',
    yourCMUExpiresIn: 'Votre CMU expire dans',
    days: 'jours',
    congratulations: 'Félicitations',
    youUnlockedBadge: 'Vous avez débloqué le badge',
    soundEnabled: 'Son activé',
    soundDisabled: 'Son désactivé',
    voiceAnnouncementsEnabled: 'Annonces vocales activées',
    languageChanged: 'Langue changée',
    
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
    
    // Navigation
    previous: 'Précédent',
    next: 'Suivant',
    finish: 'Terminer',
    skipTutorial: 'Passer le tutoriel',
    
    // Onboarding
    onboardingWelcomeTitle: 'Bienvenue sur IFN Connect !',
    onboardingWelcomeDesc: 'Je vais vous guider pour découvrir les fonctionnalités principales de la plateforme. Cela ne prendra que quelques minutes.',
    onboardingCashRegisterTitle: 'La Caisse',
    onboardingCashRegisterDesc: 'Cliquez ici pour enregistrer vos ventes rapidement. Vous pouvez ajouter des produits et valider en quelques secondes.',
    onboardingSoundTitle: 'Confirmations Vocales',
    onboardingSoundDesc: 'Activez le son pour entendre une confirmation après chaque vente. Très utile si vous ne pouvez pas regarder l\'écran !',
    onboardingLanguageTitle: 'Choisir votre Langue',
    onboardingLanguageDesc: 'Vous pouvez choisir votre langue préférée : Français, Dioula, Baoulé, Bété, Sénoufo ou Malinké. Les confirmations vocales utiliseront votre langue.',
    onboardingProfileTitle: 'Votre Profil',
    onboardingProfileDesc: 'Ici vous trouverez votre code marchand MRC, vos badges, votre niveau, et votre couverture sociale CNPS/CMU.',
    onboardingCongratulationsTitle: 'Félicitations !',
    onboardingCongratulationsDesc: 'Vous êtes prêt à utiliser IFN Connect ! N\'hésitez pas à explorer toutes les fonctionnalités. Bonne vente !',
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
    
    // Messages vocaux (Text-to-Speech)
    saleRecorded: 'Feereli kɛra',
    francsCFA: 'francs CFA',
    tryAgain: 'Aw ye a lajɛ kokura',
    attention: 'Aw ye aw janto',
    offlineMode: 'Internet tɛ',
    willSyncAutomatically: 'Feereli bɛna Kɛ yɔrɔ la a yɛrɛma',
    saleSavedLocally: 'Feereli marabɔra yan',
    yourCNPSExpiresIn: 'I ka CNPS bɛna Ban',
    yourCMUExpiresIn: 'I ka CMU bɛna Ban',
    days: 'tile',
    congratulations: 'Nse',
    youUnlockedBadge: 'I ye badge in sɔrɔ',
    soundEnabled: 'Kan dalen',
    soundDisabled: 'Kan dabɔra',
    voiceAnnouncementsEnabled: 'Kan fɔcogo dalen',
    languageChanged: 'Kan yɛlɛmara',
    
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
    
    // Navigation
    previous: 'Kɔrɔ',
    next: 'Nata',
    finish: 'A ban',
    skipTutorial: 'Kɔ kɔnɔ',
    
    // Onboarding
    onboardingWelcomeTitle: 'I ni ce IFN Connect !',
    onboardingWelcomeDesc: 'N bɛna i kɔlɔsi ka baara in kɔnɔw ye. A tɛ taa miniti damadɔ dɔrɔn.',
    onboardingCashRegisterTitle: 'Feereli yɔrɔ',
    onboardingCashRegisterDesc: 'Yan na ka i ka feereli sɛbɛnnì. I bɛ se ka fɛn farala a kan ani ka a lajɛ joona.',
    onboardingSoundTitle: 'Kan fɔcogo',
    onboardingSoundDesc: 'Kan dalen walasa ka kan mɛn feereli kɛra kɔ. Nafa ka bon ni i tɛ se ka écran filɛ !',
    onboardingLanguageTitle: 'I ka kan sugandi',
    onboardingLanguageDesc: 'I bɛ se ka i ka kan sugandi : Faransi, Jula, Baule, Bete, Senoufo walima Malinke. Kan fɔcogo bɛna baara kɛ ni i ka kan ye.',
    onboardingProfileTitle: 'I ka profil',
    onboardingProfileDesc: 'Yan i bɛna i ka code marchand MRC, i ka badges, i ka niveau ani i ka CNPS/CMU sɔrɔ.',
    onboardingCongratulationsTitle: 'Nse !',
    onboardingCongratulationsDesc: 'I labɛnna ka baara kɛ ni IFN Connect ye ! Aw ye aw jija ka fɛn bɛɛ lajɛ. Feereli ɲuman !',
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
    
    // Messages vocaux (Text-to-Speech) - Base française pour Baoulé
    saleRecorded: 'Vente enregistrée',
    francsCFA: 'francs CFA',
    tryAgain: 'Réessayez',
    attention: 'Attention',
    offlineMode: 'Mode hors ligne',
    willSyncAutomatically: 'Synchronisation automatique',
    saleSavedLocally: 'Vente sauvegardée',
    yourCNPSExpiresIn: 'CNPS expire dans',
    yourCMUExpiresIn: 'CMU expire dans',
    days: 'jours',
    congratulations: 'Félicitations',
    youUnlockedBadge: 'Badge débloqué',
    soundEnabled: 'Son activé',
    soundDisabled: 'Son désactivé',
    voiceAnnouncementsEnabled: 'Annonces activées',
    languageChanged: 'Langue changée',
    
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
  
    // Navigation
    previous: 'Précédent',
    next: 'Suivant',
    finish: 'Terminer',
    skipTutorial: 'Passer le tutoriel',
    
    // Onboarding
    onboardingWelcomeTitle: 'Bienvenue sur IFN Connect !',
    onboardingWelcomeDesc: 'Je vais vous guider pour découvrir les fonctionnalités principales. Cela ne prendra que quelques minutes.',
    onboardingCashRegisterTitle: 'La Caisse',
    onboardingCashRegisterDesc: 'Cliquez ici pour enregistrer vos ventes rapidement.',
    onboardingSoundTitle: 'Confirmations Vocales',
    onboardingSoundDesc: 'Activez le son pour entendre une confirmation après chaque vente.',
    onboardingLanguageTitle: 'Choisir votre Langue',
    onboardingLanguageDesc: 'Vous pouvez choisir votre langue préférée pour les confirmations vocales.',
    onboardingProfileTitle: 'Votre Profil',
    onboardingProfileDesc: 'Ici vous trouverez votre code MRC, vos badges et votre couverture sociale.',
    onboardingCongratulationsTitle: 'Félicitations !',
    onboardingCongratulationsDesc: 'Vous êtes prêt à utiliser IFN Connect ! Bonne vente !',
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
    saleRecorded: 'Vente enregistrée',
    francsCFA: 'francs CFA',
    tryAgain: 'Réessayez',
    attention: 'Attention',
    offlineMode: 'Mode hors ligne',
    willSyncAutomatically: 'Synchronisation automatique',
    saleSavedLocally: 'Vente sauvegardée',
    yourCNPSExpiresIn: 'CNPS expire dans',
    yourCMUExpiresIn: 'CMU expire dans',
    days: 'jours',
    congratulations: 'Félicitations',
    youUnlockedBadge: 'Badge débloqué',
    soundEnabled: 'Son activé',
    soundDisabled: 'Son désactivé',
    voiceAnnouncementsEnabled: 'Annonces activées',
    languageChanged: 'Langue changée',
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
  
    // Navigation
    previous: 'Précédent',
    next: 'Suivant',
    finish: 'Terminer',
    skipTutorial: 'Passer le tutoriel',
    
    // Onboarding
    onboardingWelcomeTitle: 'Bienvenue sur IFN Connect !',
    onboardingWelcomeDesc: 'Je vais vous guider pour découvrir les fonctionnalités principales. Cela ne prendra que quelques minutes.',
    onboardingCashRegisterTitle: 'La Caisse',
    onboardingCashRegisterDesc: 'Cliquez ici pour enregistrer vos ventes rapidement.',
    onboardingSoundTitle: 'Confirmations Vocales',
    onboardingSoundDesc: 'Activez le son pour entendre une confirmation après chaque vente.',
    onboardingLanguageTitle: 'Choisir votre Langue',
    onboardingLanguageDesc: 'Vous pouvez choisir votre langue préférée pour les confirmations vocales.',
    onboardingProfileTitle: 'Votre Profil',
    onboardingProfileDesc: 'Ici vous trouverez votre code MRC, vos badges et votre couverture sociale.',
    onboardingCongratulationsTitle: 'Félicitations !',
    onboardingCongratulationsDesc: 'Vous êtes prêt à utiliser IFN Connect ! Bonne vente !',
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
    saleRecorded: 'Vente enregistrée',
    francsCFA: 'francs CFA',
    tryAgain: 'Réessayez',
    attention: 'Attention',
    offlineMode: 'Mode hors ligne',
    willSyncAutomatically: 'Synchronisation automatique',
    saleSavedLocally: 'Vente sauvegardée',
    yourCNPSExpiresIn: 'CNPS expire dans',
    yourCMUExpiresIn: 'CMU expire dans',
    days: 'jours',
    congratulations: 'Félicitations',
    youUnlockedBadge: 'Badge débloqué',
    soundEnabled: 'Son activé',
    soundDisabled: 'Son désactivé',
    voiceAnnouncementsEnabled: 'Annonces activées',
    languageChanged: 'Langue changée',
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
  
    // Navigation
    previous: 'Précédent',
    next: 'Suivant',
    finish: 'Terminer',
    skipTutorial: 'Passer le tutoriel',
    
    // Onboarding
    onboardingWelcomeTitle: 'Bienvenue sur IFN Connect !',
    onboardingWelcomeDesc: 'Je vais vous guider pour découvrir les fonctionnalités principales. Cela ne prendra que quelques minutes.',
    onboardingCashRegisterTitle: 'La Caisse',
    onboardingCashRegisterDesc: 'Cliquez ici pour enregistrer vos ventes rapidement.',
    onboardingSoundTitle: 'Confirmations Vocales',
    onboardingSoundDesc: 'Activez le son pour entendre une confirmation après chaque vente.',
    onboardingLanguageTitle: 'Choisir votre Langue',
    onboardingLanguageDesc: 'Vous pouvez choisir votre langue préférée pour les confirmations vocales.',
    onboardingProfileTitle: 'Votre Profil',
    onboardingProfileDesc: 'Ici vous trouverez votre code MRC, vos badges et votre couverture sociale.',
    onboardingCongratulationsTitle: 'Félicitations !',
    onboardingCongratulationsDesc: 'Vous êtes prêt à utiliser IFN Connect ! Bonne vente !',
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
    saleRecorded: 'Vente enregistrée',
    francsCFA: 'francs CFA',
    tryAgain: 'Réessayez',
    attention: 'Attention',
    offlineMode: 'Mode hors ligne',
    willSyncAutomatically: 'Synchronisation automatique',
    saleSavedLocally: 'Vente sauvegardée',
    yourCNPSExpiresIn: 'CNPS expire dans',
    yourCMUExpiresIn: 'CMU expire dans',
    days: 'jours',
    congratulations: 'Félicitations',
    youUnlockedBadge: 'Badge débloqué',
    soundEnabled: 'Son activé',
    soundDisabled: 'Son désactivé',
    voiceAnnouncementsEnabled: 'Annonces activées',
    languageChanged: 'Langue changée',
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
  
    // Navigation
    previous: 'Précédent',
    next: 'Suivant',
    finish: 'Terminer',
    skipTutorial: 'Passer le tutoriel',
    
    // Onboarding
    onboardingWelcomeTitle: 'Bienvenue sur IFN Connect !',
    onboardingWelcomeDesc: 'Je vais vous guider pour découvrir les fonctionnalités principales. Cela ne prendra que quelques minutes.',
    onboardingCashRegisterTitle: 'La Caisse',
    onboardingCashRegisterDesc: 'Cliquez ici pour enregistrer vos ventes rapidement.',
    onboardingSoundTitle: 'Confirmations Vocales',
    onboardingSoundDesc: 'Activez le son pour entendre une confirmation après chaque vente.',
    onboardingLanguageTitle: 'Choisir votre Langue',
    onboardingLanguageDesc: 'Vous pouvez choisir votre langue préférée pour les confirmations vocales.',
    onboardingProfileTitle: 'Votre Profil',
    onboardingProfileDesc: 'Ici vous trouverez votre code MRC, vos badges et votre couverture sociale.',
    onboardingCongratulationsTitle: 'Félicitations !',
    onboardingCongratulationsDesc: 'Vous êtes prêt à utiliser IFN Connect ! Bonne vente !',
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
