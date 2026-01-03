import { Express, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getDb } from '../db';
import { users } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

const UPLOAD_DIR = path.join(process.cwd(), 'client', 'public', 'uploads', 'profile-photos');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `profile-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé. Utilisez JPG, PNG ou WEBP.'));
    }
  },
});

export function registerProfilePhotoRoutes(app: Express) {
  app.post('/api/upload-profile-photo', upload.single('photo'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier fourni' });
      }

      const userId = (req as any).userId;
      if (!userId) {
        fs.unlinkSync(req.file.path);
        return res.status(401).json({ error: 'Non authentifié' });
      }

      const photoUrl = `/uploads/profile-photos/${req.file.filename}`;

      const db = await getDb();
      await db
        .update(users)
        .set({ profilePhotoUrl: photoUrl })
        .where(eq(users.id, userId));

      return res.json({
        success: true,
        url: photoUrl,
        message: 'Photo de profil mise à jour',
      });
    } catch (error) {
      console.error('Error uploading profile photo:', error);

      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Error deleting file:', unlinkError);
        }
      }

      return res.status(500).json({ error: 'Erreur lors de l\'upload de la photo' });
    }
  });
}
