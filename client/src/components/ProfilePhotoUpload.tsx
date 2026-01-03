import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, Upload, X, Check } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface ProfilePhotoUploadProps {
  currentPhotoUrl?: string;
  onPhotoUploaded?: (url: string) => void;
}

export default function ProfilePhotoUpload({
  currentPhotoUrl,
  onPhotoUploaded,
}: ProfilePhotoUploadProps) {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useContext();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('La photo doit faire moins de 2 MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', selectedFile);

      const response = await fetch('/api/upload-profile-photo', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'upload');
      }

      const data = await response.json();

      toast.success('Photo de profil mise à jour !');

      if (onPhotoUploaded) {
        onPhotoUploaded(data.url);
      }

      utils.auth.me.invalidate();

      setOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erreur lors de l\'upload de la photo');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setOpen(false);
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          {currentPhotoUrl ? (
            <img
              src={currentPhotoUrl}
              alt="Photo de profil"
              className="w-32 h-32 rounded-full object-cover border-4 border-orange-200"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-4xl font-bold border-4 border-orange-200">
              {getInitials()}
            </div>
          )}
          <Button
            size="icon"
            className="absolute bottom-0 right-0 rounded-full bg-orange-500 hover:bg-orange-600 h-10 w-10"
            onClick={() => setOpen(true)}
          >
            <Camera className="h-5 w-5" />
          </Button>
        </div>
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          className="text-sm"
        >
          <Upload className="h-4 w-4 mr-2" />
          Changer la photo
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Photo de profil</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {!previewUrl ? (
              <div className="space-y-4">
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-orange-500 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 mb-2">
                    Clique pour sélectionner une photo
                  </p>
                  <p className="text-xs text-gray-500">
                    JPG, PNG ou WEBP - Max 2 MB
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <img
                    src={previewUrl}
                    alt="Prévisualisation"
                    className="w-48 h-48 rounded-full object-cover border-4 border-orange-200"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={uploading}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Annuler
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="flex-1 bg-orange-500 hover:bg-orange-600"
                  >
                    {uploading ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Upload...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Confirmer
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
