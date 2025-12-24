/**
 * Parser intelligent pour extraire les informations de vente depuis une commande vocale
 * Support Français et quelques expressions Dioula courantes
 */

export interface ParsedVoiceCommand {
  productName: string | null;
  quantity: number | null;
  unitPrice: number | null;
  totalAmount: number | null;
  confidence: 'high' | 'medium' | 'low';
  rawTranscript: string;
}

// Mapping des noms de produits (variations linguistiques)
const PRODUCT_MAPPINGS: Record<string, string[]> = {
  'Tomate fraîche': ['tomate', 'tomates', 'timate', 'timat'],
  'Oignon': ['oignon', 'oignons', 'jaba', 'djaba'],
  'Piment': ['piment', 'piments', 'piman', 'foronto'],
  'Aubergine': ['aubergine', 'aubergines', 'djaxatu'],
  'Gombo': ['gombo', 'gombos', 'kàn kàn'],
  'Carotte': ['carotte', 'carottes', 'karot'],
  'Chou': ['chou', 'choux', 'shu'],
  'Salade': ['salade', 'salades', 'salad'],
  'Banane plantain': ['banane', 'bananes', 'plantain', 'bananku'],
  'Manioc': ['manioc', 'maniocs', 'bàgà'],
  'Igname': ['igname', 'ignames', 'nyami', 'bàlà'],
  'Patate douce': ['patate', 'patates', 'patate douce'],
  'Arachide': ['arachide', 'arachides', 'cacahuète', 'cacahuètes', 'tiga'],
  'Maïs': ['maïs', 'mais', 'kaba'],
  'Riz': ['riz', 'malo'],
  'Mil': ['mil', 'sanio'],
  'Poisson fumé': ['poisson', 'poissons', 'poisson fumé', 'jɛgɛ'],
  'Viande de bœuf': ['viande', 'boeuf', 'bœuf', 'misogo'],
  'Poulet': ['poulet', 'poulets', 'sùgù'],
  'Œufs': ['oeuf', 'oeufs', 'œuf', 'œufs', 'kɔnɔ'],
  'Lait': ['lait', 'nɔnɔ'],
  'Huile de palme': ['huile', 'huile de palme', 'tulu'],
  'Arachide (huile)': ['huile d\'arachide', 'huile arachide'],
  'Sel': ['sel', 'kɔgɔ'],
  'Sucre': ['sucre', 'sukaro'],
  'Cube Maggi': ['maggi', 'cube', 'cubes', 'soumbala'],
  'Pâte de tomate': ['pate de tomate', 'pâte de tomate', 'concentré'],
  'Farine de blé': ['farine', 'farine de blé'],
  'Semoule': ['semoule', 'semoul'],
  'Haricot': ['haricot', 'haricots', 'sɔsɔ'],
  'Pois': ['pois', 'pwa'],
  'Papaye': ['papaye', 'papayes', 'papay'],
  'Mangue': ['mangue', 'mangues', 'mango'],
  'Orange': ['orange', 'oranges', 'oranj'],
  'Citron': ['citron', 'citrons', 'limon'],
};

// Mots-clés pour détecter les quantités
const QUANTITY_KEYWORDS = ['tas', 'kilo', 'kg', 'gramme', 'g', 'litre', 'l', 'pièce', 'pièces', 'unité', 'unités', 'sac', 'sacs'];

// Mots-clés pour détecter les prix
const PRICE_KEYWORDS = ['franc', 'francs', 'fcfa', 'f', 'cfa', 'wari'];

// Nombres en français (pour parsing)
const FRENCH_NUMBERS: Record<string, number> = {
  'un': 1, 'une': 1, 'deux': 2, 'trois': 3, 'quatre': 4, 'cinq': 5,
  'six': 6, 'sept': 7, 'huit': 8, 'neuf': 9, 'dix': 10,
  'onze': 11, 'douze': 12, 'treize': 13, 'quatorze': 14, 'quinze': 15,
  'seize': 16, 'vingt': 20, 'trente': 30, 'quarante': 40, 'cinquante': 50,
  'soixante': 60, 'cent': 100, 'mille': 1000,
};

/**
 * Normaliser le texte pour faciliter le parsing
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
    .replace(/['']/g, ' ') // Remplacer apostrophes
    .trim();
}

/**
 * Extraire le nom du produit depuis la transcription
 */
function extractProduct(text: string): string | null {
  const normalized = normalizeText(text);
  
  for (const [productName, variations] of Object.entries(PRODUCT_MAPPINGS)) {
    for (const variation of variations) {
      if (normalized.includes(variation)) {
        return productName;
      }
    }
  }
  
  return null;
}

/**
 * Extraire un nombre depuis une chaîne de texte
 */
function extractNumber(text: string): number | null {
  const normalized = normalizeText(text);
  const words = normalized.split(/\s+/);
  
  // Chercher d'abord les nombres écrits en chiffres
  for (const word of words) {
    const num = parseFloat(word.replace(/[^\d.]/g, ''));
    if (!isNaN(num) && num > 0) {
      return num;
    }
  }
  
  // Chercher les nombres écrits en lettres
  for (const word of words) {
    if (FRENCH_NUMBERS[word]) {
      return FRENCH_NUMBERS[word];
    }
  }
  
  return null;
}

/**
 * Extraire la quantité depuis la transcription
 */
function extractQuantity(text: string): number | null {
  const normalized = normalizeText(text);
  
  // Chercher un nombre suivi d'une unité de quantité
  for (const keyword of QUANTITY_KEYWORDS) {
    const regex = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${keyword}`, 'i');
    const match = normalized.match(regex);
    if (match) {
      return parseFloat(match[1]);
    }
  }
  
  // Chercher un nombre en début de phrase (probablement la quantité)
  const firstNumber = extractNumber(normalized.split(/\s+/).slice(0, 3).join(' '));
  if (firstNumber && firstNumber < 1000) {
    return firstNumber;
  }
  
  return null;
}

/**
 * Extraire le prix depuis la transcription
 */
function extractPrice(text: string): number | null {
  const normalized = normalizeText(text);
  
  // Chercher un nombre suivi d'un mot-clé de prix
  for (const keyword of PRICE_KEYWORDS) {
    const regex = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${keyword}`, 'i');
    const match = normalized.match(regex);
    if (match) {
      return parseFloat(match[1]);
    }
  }
  
  // Chercher un grand nombre (probablement le prix)
  const words = normalized.split(/\s+/);
  for (const word of words) {
    const num = parseFloat(word.replace(/[^\d.]/g, ''));
    if (!isNaN(num) && num >= 100) {
      return num;
    }
  }
  
  return null;
}

/**
 * Calculer le niveau de confiance du parsing
 */
function calculateConfidence(result: ParsedVoiceCommand): 'high' | 'medium' | 'low' {
  let score = 0;
  
  if (result.productName) score += 3;
  if (result.quantity) score += 2;
  if (result.unitPrice || result.totalAmount) score += 2;
  
  if (score >= 6) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
}

/**
 * Parser principal pour extraire les informations de vente
 */
export function parseVoiceCommand(transcript: string): ParsedVoiceCommand {
  const productName = extractProduct(transcript);
  const quantity = extractQuantity(transcript);
  const price = extractPrice(transcript);
  
  // Déterminer si c'est un prix unitaire ou total
  let unitPrice: number | null = null;
  let totalAmount: number | null = null;
  
  if (price && quantity) {
    // Si on a les deux, on suppose que c'est le prix total
    // et on calcule le prix unitaire
    if (price > quantity * 100) {
      totalAmount = price;
      unitPrice = Math.round(price / quantity);
    } else {
      unitPrice = price;
      totalAmount = Math.round(price * quantity);
    }
  } else if (price) {
    // Si on a seulement le prix, on suppose que c'est le prix unitaire
    unitPrice = price;
  }
  
  const result: ParsedVoiceCommand = {
    productName,
    quantity,
    unitPrice,
    totalAmount,
    confidence: 'low',
    rawTranscript: transcript,
  };
  
  result.confidence = calculateConfidence(result);
  
  return result;
}

/**
 * Exemples de commandes vocales supportées:
 * - "Vendre 3 tas de tomates à 1000 francs"
 * - "5 kilos d'oignons à 500 francs le kilo"
 * - "Deux poulets à 3000 francs"
 * - "Un sac de riz 25000 francs"
 * - "10 pièces de mangues 2000 francs"
 */
