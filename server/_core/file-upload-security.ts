/**
 * PNAVIM-CI - File Upload Security Middleware
 * 
 * Sécurisation des uploads de fichiers avec :
 * - Validation des types MIME
 * - Limitation de taille
 * - Scan antivirus (simulation pour l'instant)
 * - Nommage sécurisé avec suffixes aléatoires
 */

import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import type { Request } from 'express';

/**
 * Types MIME autorisés pour les uploads
 */
const ALLOWED_MIME_TYPES = {
  images: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  documents: ['application/pdf'],
  all: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'],
};

/**
 * Tailles maximales par type de fichier (en bytes)
 */
const MAX_FILE_SIZES = {
  image: 5 * 1024 * 1024, // 5 MB
  document: 10 * 1024 * 1024, // 10 MB
};

/**
 * Générer un nom de fichier sécurisé avec suffixe aléatoire
 */
function generateSecureFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const basename = path.basename(originalName, ext);
  const randomSuffix = crypto.randomBytes(8).toString('hex');
  const timestamp = Date.now();
  
  // Nettoyer le nom de base (supprimer caractères spéciaux)
  const cleanBasename = basename
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .substring(0, 50); // Limiter à 50 caractères
  
  return `${cleanBasename}-${timestamp}-${randomSuffix}${ext}`;
}

/**
 * Validation du type MIME
 */
function validateMimeType(file: Express.Multer.File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.mimetype);
}

/**
 * Validation de la taille du fichier
 */
function validateFileSize(file: Express.Multer.File, maxSize: number): boolean {
  return file.size <= maxSize;
}

/**
 * Scan antivirus (simulation pour l'instant)
 * 
 * TODO: Intégrer un vrai service antivirus :
 * - Option 1 : ClamAV en local (docker container)
 * - Option 2 : Service cloud (VirusTotal API, MetaDefender)
 * - Option 3 : AWS S3 + Malware Detection
 */
async function scanForMalware(file: Express.Multer.File): Promise<{
  safe: boolean;
  threat?: string;
}> {
  // Simulation : vérifications basiques
  
  // 1. Vérifier que le fichier n'est pas vide
  if (file.size === 0) {
    return { safe: false, threat: 'Empty file' };
  }
  
  // 2. Vérifier que l'extension correspond au type MIME
  const ext = path.extname(file.originalname).toLowerCase();
  const expectedExts: Record<string, string[]> = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
    'application/pdf': ['.pdf'],
  };
  
  const allowedExts = expectedExts[file.mimetype] || [];
  if (!allowedExts.includes(ext)) {
    return { safe: false, threat: 'MIME type mismatch' };
  }
  
  // 3. Vérifier les signatures de fichiers (magic bytes)
  // Pour une vraie implémentation, lire les premiers bytes du fichier
  // et vérifier qu'ils correspondent au type MIME déclaré
  
  // TODO: Intégrer un vrai scan antivirus ici
  // Exemple avec ClamAV :
  // const clamscan = await getClamScanInstance();
  // const { isInfected, viruses } = await clamscan.scanFile(file.path);
  // if (isInfected) {
  //   return { safe: false, threat: viruses.join(', ') };
  // }
  
  // Pour l'instant, on considère le fichier comme sûr
  return { safe: true };
}

/**
 * Configuration Multer pour le stockage en mémoire
 * (avant upload vers S3)
 */
const storage = multer.memoryStorage();

/**
 * Middleware de validation des fichiers
 */
function createFileFilter(allowedTypes: string[]) {
  return (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Vérifier le type MIME
    if (!validateMimeType(file, allowedTypes)) {
      return cb(new Error(`Type de fichier non autorisé. Types acceptés : ${allowedTypes.join(', ')}`));
    }
    
    cb(null, true);
  };
}

/**
 * Middleware Multer pour les images (photos CNI, profil, etc.)
 */
export const uploadImage = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZES.image,
    files: 1, // 1 fichier à la fois
  },
  fileFilter: createFileFilter(ALLOWED_MIME_TYPES.images),
});

/**
 * Middleware Multer pour les documents (PDF)
 */
export const uploadDocument = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZES.document,
    files: 1,
  },
  fileFilter: createFileFilter(ALLOWED_MIME_TYPES.documents),
});

/**
 * Middleware Multer pour les images multiples (enrôlement agent)
 */
export const uploadMultipleImages = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZES.image,
    files: 5, // Maximum 5 images
  },
  fileFilter: createFileFilter(ALLOWED_MIME_TYPES.images),
});

/**
 * Middleware de validation et scan antivirus
 * À utiliser APRÈS multer
 */
export async function validateAndScanFile(
  file: Express.Multer.File | undefined
): Promise<{
  valid: boolean;
  error?: string;
}> {
  if (!file) {
    return { valid: false, error: 'Aucun fichier fourni' };
  }
  
  // 1. Vérifier la taille
  const maxSize = file.mimetype.startsWith('image/') 
    ? MAX_FILE_SIZES.image 
    : MAX_FILE_SIZES.document;
  
  if (!validateFileSize(file, maxSize)) {
    const maxSizeMB = maxSize / (1024 * 1024);
    return { 
      valid: false, 
      error: `Fichier trop volumineux. Taille maximale : ${maxSizeMB} MB` 
    };
  }
  
  // 2. Scanner pour les malwares
  const scanResult = await scanForMalware(file);
  if (!scanResult.safe) {
    console.error(`[SECURITY] Fichier suspect détecté : ${file.originalname}`, scanResult.threat);
    return { 
      valid: false, 
      error: `Fichier suspect détecté : ${scanResult.threat}` 
    };
  }
  
  return { valid: true };
}

/**
 * Fonction utilitaire pour générer une clé S3 sécurisée
 */
export function generateSecureS3Key(
  userId: string,
  category: 'profile' | 'documents' | 'photos',
  originalFilename: string
): string {
  const secureFilename = generateSecureFilename(originalFilename);
  return `${userId}/${category}/${secureFilename}`;
}

/**
 * Fonction pour valider et uploader un fichier vers S3
 */
export async function validateAndUploadToS3(
  file: Express.Multer.File | undefined,
  userId: string,
  category: 'profile' | 'documents' | 'photos',
  storagePut: (key: string, data: Buffer, contentType: string) => Promise<{ key: string; url: string }>
): Promise<{
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}> {
  // 1. Valider et scanner le fichier
  const validation = await validateAndScanFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }
  
  if (!file) {
    return { success: false, error: 'Aucun fichier fourni' };
  }
  
  // 2. Générer une clé S3 sécurisée
  const s3Key = generateSecureS3Key(userId, category, file.originalname);
  
  // 3. Uploader vers S3
  try {
    const result = await storagePut(s3Key, file.buffer, file.mimetype);
    return {
      success: true,
      url: result.url,
      key: result.key,
    };
  } catch (error) {
    console.error('[UPLOAD] Erreur lors de l\'upload vers S3:', error);
    return {
      success: false,
      error: 'Erreur lors de l\'upload du fichier',
    };
  }
}

/**
 * Configuration pour intégrer ClamAV (à décommenter quand prêt)
 */
/*
import NodeClam from 'clamscan';

let clamScanInstance: NodeClam | null = null;

async function getClamScanInstance(): Promise<NodeClam> {
  if (clamScanInstance) {
    return clamScanInstance;
  }
  
  clamScanInstance = await new NodeClam().init({
    removeInfected: true, // Supprimer automatiquement les fichiers infectés
    quarantineInfected: false,
    scanLog: '/var/log/clamav/scan.log',
    debugMode: process.env.NODE_ENV === 'development',
    clamdscan: {
      host: process.env.CLAMAV_HOST || 'localhost',
      port: parseInt(process.env.CLAMAV_PORT || '3310'),
      timeout: 60000,
    },
  });
  
  return clamScanInstance;
}
*/

/**
 * Instructions d'installation ClamAV (Docker)
 * 
 * 1. Créer un fichier docker-compose.yml :
 * 
 * version: '3.8'
 * services:
 *   clamav:
 *     image: clamav/clamav:latest
 *     ports:
 *       - "3310:3310"
 *     volumes:
 *       - clamav-data:/var/lib/clamav
 * volumes:
 *   clamav-data:
 * 
 * 2. Démarrer ClamAV :
 *    docker-compose up -d
 * 
 * 3. Installer le client Node.js :
 *    pnpm add clamscan
 * 
 * 4. Décommenter le code ci-dessus et l'utiliser dans scanForMalware()
 */
