/**
 * Système de traduction Nouchi/Français
 * Basé sur le lexique et les parcours utilisateurs MGX
 */

export type Language = 'fr' | 'nouchi';

export interface Translations {
  // Navigation et actions principales
  dashboard: string;
  sell: string;
  stock: string;
  money: string;
  help: string;
  
  // Argent et valeurs
  wallet: string;
  balance: string;
  totalBalance: string;
  todaySales: string;
  profit: string;
  
  // Commerce
  sale: string;
  sales: string;
  product: string;
  products: string;
  quantity: string;
  price: string;
  total: string;
  
  // Actions
  validate: string;
  cancel: string;
  pay: string;
  confirm: string;
  
  // Statuts
  success: string;
  error: string;
  loading: string;
  
  // Messages de succès
  loginSuccess: string;
  saleSuccess: string;
  saleRecorded: string;
  paymentSuccess: string;
  stockUpdated: string;
  
  // Messages d'erreur
  paymentError: string;
  saleError: string;
  emptyCart: string;
  insufficientBalance: string;
  stockLow: string;
  stockEmpty: string;
  
  // Caisse
  cashRegister: string;
  addToCart: string;
  cart: string;
  emptyCartMessage: string;
  
  // Stock
  stockManagement: string;
  lowStock: string;
  outOfStock: string;
  
  // Paiement
  cash: string;
  mobileMoney: string;
  paymentMethod: string;
  
  // Montants (Franc CFA)
  fcfa: string;
  amount: string;
}

export const translations: Record<Language, Translations> = {
  fr: {
    // Navigation et actions principales
    dashboard: 'Tableau de bord',
    sell: 'Vendre',
    stock: 'Stock',
    money: 'Argent',
    help: 'Aide',
    
    // Argent et valeurs
    wallet: 'Portefeuille',
    balance: 'Solde',
    totalBalance: 'Solde total',
    todaySales: 'Ventes du jour',
    profit: 'Bénéfice',
    
    // Commerce
    sale: 'Vente',
    sales: 'Ventes',
    product: 'Produit',
    products: 'Produits',
    quantity: 'Quantité',
    price: 'Prix',
    total: 'Total',
    
    // Actions
    validate: 'Valider',
    cancel: 'Annuler',
    pay: 'Payer',
    confirm: 'Confirmer',
    
    // Statuts
    success: 'Succès',
    error: 'Erreur',
    loading: 'Chargement...',
    
    // Messages de succès
    loginSuccess: 'Connexion réussie !',
    saleSuccess: 'Vente enregistrée avec succès !',
    saleRecorded: 'Vente enregistrée',
    paymentSuccess: 'Paiement effectué avec succès',
    stockUpdated: 'Stock mis à jour',
    
    // Messages d'erreur
    paymentError: 'Erreur de paiement, veuillez réessayer',
    saleError: 'Erreur lors de l\'enregistrement de la vente',
    emptyCart: 'Votre panier est vide',
    insufficientBalance: 'Solde insuffisant',
    stockLow: 'Stock faible',
    stockEmpty: 'Stock épuisé',
    
    // Caisse
    cashRegister: 'Caisse',
    addToCart: 'Ajouter au panier',
    cart: 'Panier',
    emptyCartMessage: 'Votre panier est vide',
    
    // Stock
    stockManagement: 'Gestion du stock',
    lowStock: 'Stock bas',
    outOfStock: 'Rupture de stock',
    
    // Paiement
    cash: 'Espèces',
    mobileMoney: 'Mobile Money',
    paymentMethod: 'Mode de paiement',
    
    // Montants
    fcfa: 'FCFA',
    amount: 'Montant',
  },
  
  nouchi: {
    // Navigation et actions principales
    dashboard: 'Mon Bédou',
    sell: 'Fata',
    stock: 'Mes Bagages',
    money: 'Le Djê',
    help: 'Soutra',
    
    // Argent et valeurs
    wallet: 'Bédou',
    balance: 'Mon Djê',
    totalBalance: 'Tout le Djê',
    todaySales: 'Le Jet du Jour',
    profit: 'Le Bénef',
    
    // Commerce
    sale: 'Fata',
    sales: 'Mes Fata',
    product: 'Bagages',
    products: 'Les Bagages',
    quantity: 'Combien',
    price: 'Le Prix',
    total: 'Tout',
    
    // Actions
    validate: 'Dja ça',
    cancel: 'Laisse tomber',
    pay: 'Donner le djê',
    confirm: 'C\'est bon',
    
    // Statuts
    success: 'C\'est dja !',
    error: 'Y\'a un blé',
    loading: 'Patiente un peu, ça arrive…',
    
    // Messages de succès
    loginSuccess: 'C\'est bon, tu es dans le mouvement !',
    saleSuccess: 'C\'est dja ! Vente enregistrée',
    saleRecorded: 'C\'est géré !',
    paymentSuccess: 'Le djê est passé, c\'est bon !',
    stockUpdated: 'Les bagages sont à jour',
    
    // Messages d'erreur
    paymentError: 'Le djê n\'est pas passé, re-essaie.',
    saleError: 'Aïe, tu as tapé poto sur la vente.',
    emptyCart: 'Ton panier est vide, faut chercher bagages dedans.',
    insufficientBalance: 'Ton bédou est trop léger pour ça.',
    stockLow: 'Les bagages sont presque finis',
    stockEmpty: 'Y\'a plus de bagages',
    
    // Caisse
    cashRegister: 'Le Djossi',
    addToCart: 'Mettre dedans',
    cart: 'Le Panier',
    emptyCartMessage: 'Ton panier est vide, faut chercher bagages dedans.',
    
    // Stock
    stockManagement: 'Gérer les Bagages',
    lowStock: 'Bagages presque finis',
    outOfStock: 'Y\'a plus',
    
    // Paiement
    cash: 'Le Braisé',
    mobileMoney: 'Mo-Mo',
    paymentMethod: 'Comment tu payes',
    
    // Montants
    fcfa: 'Francs',
    amount: 'Combien',
  },
};

/**
 * Convertit un montant FCFA en terme Nouchi
 */
export function formatAmountNouchi(amount: number): string {
  if (amount >= 100000) {
    return `${(amount / 100000).toFixed(0)} Togo`;
  }
  if (amount >= 5000) {
    return `${(amount / 5000).toFixed(0)} Gbonhon`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)} Barre`;
  }
  if (amount >= 500) {
    return `${(amount / 500).toFixed(0)} Gbêss`;
  }
  if (amount >= 100) {
    return `${(amount / 100).toFixed(0)} Plomb`;
  }
  return `${amount} Francs`;
}

/**
 * Messages de confirmation de vente avec montants en Nouchi
 */
export function getSaleConfirmationMessage(amount: number, lang: Language): string {
  if (lang === 'nouchi') {
    const nouchiAmount = formatAmountNouchi(amount);
    return `C'est dja ! ${nouchiAmount} dans le bédou`;
  }
  return `Vente enregistrée de ${amount.toLocaleString('fr-FR')} FCFA`;
}
