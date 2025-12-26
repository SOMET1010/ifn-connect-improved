import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ExportButtonProps {
  onExport: () => Promise<{ filename: string; data: string; count?: number }>;
  label?: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
}

/**
 * Bouton d'export Excel générique
 * Télécharge automatiquement le fichier Excel généré
 */
export default function ExportButton({ 
  onExport, 
  label = 'Exporter Excel',
  variant = 'outline',
  size = 'default'
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Appeler la fonction d'export
      const result = await onExport();

      // Convertir le base64 en blob
      const binaryString = atob(result.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Notification de succès
      toast.success(
        result.count !== undefined
          ? `Export réussi ! ${result.count} ligne(s) exportée(s)`
          : 'Export réussi !'
      );
    } catch (error: any) {
      console.error('Erreur lors de l\'export:', error);
      toast.error('Erreur lors de l\'export Excel');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={isExporting}
    >
      {isExporting ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Export en cours...
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-2" />
          {label}
        </>
      )}
    </Button>
  );
}
