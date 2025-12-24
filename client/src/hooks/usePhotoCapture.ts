import { useState, useRef } from 'react';
import { toast } from 'sonner';

interface PhotoCaptureOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export function usePhotoCapture(options: PhotoCaptureOptions = {}) {
  const {
    maxWidth = 1024,
    maxHeight = 1024,
    quality = 0.8,
  } = options;

  const [photo, setPhoto] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculer les nouvelles dimensions en conservant le ratio
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Impossible de créer le contexte canvas'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Convertir en base64
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };

        img.onerror = () => reject(new Error('Erreur lors du chargement de l\'image'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
      reader.readAsDataURL(file);
    });
  };

  const capturePhoto = async () => {
    try {
      setIsCapturing(true);

      // Déclencher le sélecteur de fichier
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    } catch (error) {
      console.error('Erreur lors de la capture:', error);
      toast.error('Erreur lors de la capture photo');
      setIsCapturing(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setIsCapturing(false);
      return;
    }

    try {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        toast.error('Veuillez sélectionner une image');
        setIsCapturing(false);
        return;
      }

      // Vérifier la taille (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('L\'image est trop volumineuse (max 10MB)');
        setIsCapturing(false);
        return;
      }

      // Compresser l'image
      const compressedDataUrl = await compressImage(file);
      setPhoto(compressedDataUrl);
      toast.success('Photo capturée avec succès');
    } catch (error) {
      console.error('Erreur lors du traitement de l\'image:', error);
      toast.error('Erreur lors du traitement de l\'image');
    } finally {
      setIsCapturing(false);
      // Réinitialiser l'input pour permettre de sélectionner la même image
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const clearPhoto = () => {
    setPhoto(null);
  };

  return {
    photo,
    isCapturing,
    capturePhoto,
    clearPhoto,
    fileInputRef,
    handleFileChange,
  };
}
