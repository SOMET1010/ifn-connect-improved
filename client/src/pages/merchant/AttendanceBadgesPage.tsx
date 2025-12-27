import { AttendanceBadges } from "@/components/AttendanceBadges";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function AttendanceBadgesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/merchant/sessions-history">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'historique
            </Button>
          </Link>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent">
            Badges d'Assiduité
          </h1>
          <p className="text-gray-600 mt-2">
            Débloquez des badges en travaillant régulièrement et en ouvrant votre journée chaque jour.
          </p>
        </div>

        {/* Badges */}
        <AttendanceBadges />
      </div>
    </div>
  );
}
