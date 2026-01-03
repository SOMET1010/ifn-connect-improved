import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Mic, Library, Sparkles } from "lucide-react";
import { VoiceRecordingWidget } from "@/components/voice-studio/VoiceRecordingWidget";
import { VoiceTransformationPanel } from "@/components/voice-studio/VoiceTransformationPanel";
import { VoiceLibrary } from "@/components/voice-studio/VoiceLibrary";
import DashboardLayout from "@/components/DashboardLayout";

export default function VoiceStudio() {
  const [activeTab, setActiveTab] = useState("record");
  const [selectedRecordingId, setSelectedRecordingId] = useState<string | null>(null);

  const handleRecordingCreated = (recordingId: string) => {
    setSelectedRecordingId(recordingId);
    setActiveTab("transform");
  };

  const handleRecordingSelected = (recordingId: string) => {
    setSelectedRecordingId(recordingId);
    setActiveTab("transform");
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Mini Studio PNAVIM</h1>
          <p className="text-gray-600">
            Enregistrez, transformez et gérez les contenus vocaux pour SUTA et les commerçants
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Studio de Production Vocale</CardTitle>
            <CardDescription>
              Créez et personnalisez les messages vocaux avec les différentes voix de SUTA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="record" className="flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  Enregistrer
                </TabsTrigger>
                <TabsTrigger value="transform" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Transformer
                </TabsTrigger>
                <TabsTrigger value="library" className="flex items-center gap-2">
                  <Library className="w-4 h-4" />
                  Bibliothèque
                </TabsTrigger>
              </TabsList>

              <TabsContent value="record" className="space-y-6">
                <VoiceRecordingWidget onRecordingCreated={handleRecordingCreated} />
              </TabsContent>

              <TabsContent value="transform" className="space-y-6">
                {selectedRecordingId ? (
                  <VoiceTransformationPanel recordingId={selectedRecordingId} />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Sélectionnez un enregistrement dans la bibliothèque ou créez-en un nouveau</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="library" className="space-y-6">
                <VoiceLibrary onRecordingSelected={handleRecordingSelected} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
