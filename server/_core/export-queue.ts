/**
 * PNAVIM-CI - Export Queue System
 * 
 * Gestion asynchrone des exports lourds (Excel, PDF) pour éviter les timeouts
 * et améliorer l'expérience utilisateur.
 * 
 * Architecture :
 * 1. L'utilisateur demande un export → Job ajouté à la queue
 * 2. Worker traite le job en arrière-plan
 * 3. Fichier généré et uploadé vers S3
 * 4. Notification envoyée à l'utilisateur avec lien de téléchargement
 */

import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { storagePut } from '../storage';
import { sendEmail } from './email';

/**
 * Configuration Redis
 * 
 * Note : Pour la production, utiliser un serveur Redis dédié.
 * Pour le développement, utiliser un Redis local ou Docker.
 * 
 * Docker : docker run -d -p 6379:6379 redis:alpine
 */
const redisConnection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null, // Requis pour BullMQ
  enableReadyCheck: false,
  retryStrategy: (times: number) => {
    // Retry avec backoff exponentiel
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

/**
 * Types de jobs d'export
 */
export enum ExportType {
  MERCHANTS = 'merchants',
  SALES = 'sales',
  TRANSACTIONS = 'transactions',
  COOPERATIVE_REPORT = 'cooperative_report',
  ADMIN_DASHBOARD = 'admin_dashboard',
}

/**
 * Données d'un job d'export
 */
export interface ExportJobData {
  type: ExportType;
  userId: string;
  userEmail?: string;
  filters?: Record<string, any>;
  format: 'excel' | 'pdf';
  requestedAt: Date;
}

/**
 * Résultat d'un job d'export
 */
export interface ExportJobResult {
  success: boolean;
  fileUrl?: string;
  fileKey?: string;
  error?: string;
  generatedAt: Date;
  rowCount?: number;
}

/**
 * Queue pour les exports
 */
export const exportQueue = new Queue<ExportJobData, ExportJobResult>('exports', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, // 3 tentatives en cas d'échec
    backoff: {
      type: 'exponential',
      delay: 5000, // Délai initial de 5 secondes
    },
    removeOnComplete: {
      age: 24 * 3600, // Garder les jobs complétés pendant 24h
      count: 1000, // Maximum 1000 jobs complétés
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Garder les jobs échoués pendant 7 jours
    },
  },
});

/**
 * Ajouter un job d'export à la queue
 */
export async function queueExport(data: ExportJobData): Promise<Job<ExportJobData, ExportJobResult>> {
  const job = await exportQueue.add(`export-${data.type}`, data, {
    jobId: `${data.type}-${data.userId}-${Date.now()}`,
  });
  
  console.log(`[EXPORT_QUEUE] Job ${job.id} ajouté : ${data.type} pour ${data.userId}`);
  
  return job;
}

/**
 * Obtenir le statut d'un job d'export
 */
export async function getExportStatus(jobId: string): Promise<{
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'unknown';
  progress?: number;
  result?: ExportJobResult;
  error?: string;
}> {
  const job = await exportQueue.getJob(jobId);
  
  if (!job) {
    return { status: 'unknown' };
  }
  
  const state = await job.getState();
  const progress = job.progress as number | undefined;
  
  if (state === 'completed') {
    return {
      status: 'completed',
      result: job.returnvalue,
    };
  }
  
  if (state === 'failed') {
    return {
      status: 'failed',
      error: job.failedReason,
    };
  }
  
  return {
    status: state as 'waiting' | 'active',
    progress,
  };
}

/**
 * Worker pour traiter les jobs d'export
 */
export function startExportWorker() {
  const worker = new Worker<ExportJobData, ExportJobResult>(
    'exports',
    async (job: Job<ExportJobData, ExportJobResult>) => {
      console.log(`[EXPORT_WORKER] Traitement du job ${job.id} : ${job.data.type}`);
      
      try {
        // Mettre à jour la progression
        await job.updateProgress(10);
        
        // Générer le fichier selon le type
        let fileBuffer: Buffer;
        let filename: string;
        let mimeType: string;
        let rowCount = 0;
        
        switch (job.data.type) {
          case ExportType.MERCHANTS:
            ({ buffer: fileBuffer, filename, mimeType, rowCount } = await generateMerchantsExport(job.data));
            break;
          
          case ExportType.SALES:
            ({ buffer: fileBuffer, filename, mimeType, rowCount } = await generateSalesExport(job.data));
            break;
          
          case ExportType.TRANSACTIONS:
            ({ buffer: fileBuffer, filename, mimeType, rowCount } = await generateTransactionsExport(job.data));
            break;
          
          case ExportType.COOPERATIVE_REPORT:
            ({ buffer: fileBuffer, filename, mimeType, rowCount } = await generateCooperativeReport(job.data));
            break;
          
          case ExportType.ADMIN_DASHBOARD:
            ({ buffer: fileBuffer, filename, mimeType, rowCount } = await generateAdminDashboard(job.data));
            break;
          
          default:
            throw new Error(`Type d'export non supporté : ${job.data.type}`);
        }
        
        await job.updateProgress(60);
        
        // Uploader vers S3
        const s3Key = `exports/${job.data.userId}/${filename}`;
        const { url, key } = await storagePut(s3Key, fileBuffer, mimeType);
        
        await job.updateProgress(90);
        
        // Envoyer une notification par email (si disponible)
        if (job.data.userEmail) {
          await sendEmail({
            to: job.data.userEmail,
            subject: `Votre export ${job.data.type} est prêt`,
            html: `
              <h2>Export terminé</h2>
              <p>Votre export <strong>${job.data.type}</strong> est prêt.</p>
              <p><strong>Nombre de lignes :</strong> ${rowCount}</p>
              <p><a href="${url}">Télécharger le fichier</a></p>
              <p><em>Ce lien expire dans 7 jours.</em></p>
            `,
          });
        }
        
        await job.updateProgress(100);
        
        console.log(`[EXPORT_WORKER] Job ${job.id} terminé : ${url}`);
        
        return {
          success: true,
          fileUrl: url,
          fileKey: key,
          generatedAt: new Date(),
          rowCount,
        };
      } catch (error: any) {
        console.error(`[EXPORT_WORKER] Erreur job ${job.id}:`, error);
        
        return {
          success: false,
          error: error.message,
          generatedAt: new Date(),
        };
      }
    },
    {
      connection: redisConnection,
      concurrency: 3, // Traiter 3 exports en parallèle maximum
      limiter: {
        max: 10, // Maximum 10 jobs par minute
        duration: 60000,
      },
    }
  );
  
  // Événements du worker
  worker.on('completed', (job) => {
    console.log(`[EXPORT_WORKER] ✅ Job ${job.id} complété`);
  });
  
  worker.on('failed', (job, err) => {
    console.error(`[EXPORT_WORKER] ❌ Job ${job?.id} échoué:`, err);
  });
  
  worker.on('error', (err) => {
    console.error('[EXPORT_WORKER] Erreur worker:', err);
  });
  
  console.log('[EXPORT_WORKER] Worker démarré (concurrency: 3)');
  
  return worker;
}

/**
 * Fonctions de génération d'exports (à implémenter)
 */

async function generateMerchantsExport(data: ExportJobData): Promise<{
  buffer: Buffer;
  filename: string;
  mimeType: string;
  rowCount: number;
}> {
  // TODO: Implémenter la génération Excel/PDF des marchands
  // Utiliser exceljs pour Excel, pdfkit pour PDF
  
  throw new Error('generateMerchantsExport not implemented yet');
}

async function generateSalesExport(data: ExportJobData): Promise<{
  buffer: Buffer;
  filename: string;
  mimeType: string;
  rowCount: number;
}> {
  // TODO: Implémenter la génération Excel/PDF des ventes
  
  throw new Error('generateSalesExport not implemented yet');
}

async function generateTransactionsExport(data: ExportJobData): Promise<{
  buffer: Buffer;
  filename: string;
  mimeType: string;
  rowCount: number;
}> {
  // TODO: Implémenter la génération Excel/PDF des transactions
  
  throw new Error('generateTransactionsExport not implemented yet');
}

async function generateCooperativeReport(data: ExportJobData): Promise<{
  buffer: Buffer;
  filename: string;
  mimeType: string;
  rowCount: number;
}> {
  // TODO: Implémenter la génération du rapport coopérative
  
  throw new Error('generateCooperativeReport not implemented yet');
}

async function generateAdminDashboard(data: ExportJobData): Promise<{
  buffer: Buffer;
  filename: string;
  mimeType: string;
  rowCount: number;
}> {
  // TODO: Implémenter la génération du dashboard admin
  
  throw new Error('generateAdminDashboard not implemented yet');
}

/**
 * Instructions d'installation Redis (Docker)
 * 
 * 1. Créer un fichier docker-compose.yml :
 * 
 * version: '3.8'
 * services:
 *   redis:
 *     image: redis:alpine
 *     ports:
 *       - "6379:6379"
 *     volumes:
 *       - redis-data:/data
 *     command: redis-server --appendonly yes
 * volumes:
 *   redis-data:
 * 
 * 2. Démarrer Redis :
 *    docker-compose up -d
 * 
 * 3. Vérifier que Redis fonctionne :
 *    redis-cli ping
 *    → PONG
 * 
 * 4. Démarrer le worker dans server/_core/index.ts :
 *    import { startExportWorker } from './export-queue';
 *    startExportWorker();
 */
