
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Loader2 } from "lucide-react";
import { loadPDFModel, savePDFModel, DEFAULT_MODEL } from "@/utils/pdfModelUtils";
import PDFModelCompanyInfo from "./PDFModelCompanyInfo";
import PDFTemplateWithFields from "./PDFTemplateWithFields";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { PDFModel } from "@/utils/pdfModelUtils";

const PDFModelManager = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [model, setModel] = useState<PDFModel | null>(null);
  const [activeTab, setActiveTab] = useState("company");
  const [error, setError] = useState<string | null>(null);
  
  // Chargement du modèle au montage du composant
  useEffect(() => {
    loadModelData();
  }, []);

  // Fonction pour charger le modèle
  const loadModelData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Chargement du modèle PDF...");
      const data = await loadPDFModel();
      
      if (data) {
        console.log("Modèle chargé avec succès:", data);
        setModel(data);
        toast.success("Modèle chargé avec succès");
      } else {
        console.log("Aucun modèle trouvé, utilisation du modèle par défaut");
        setModel(DEFAULT_MODEL);
      }
    } catch (err) {
      console.error("Erreur lors du chargement du modèle:", err);
      setError("Erreur lors du chargement du modèle");
      toast.error("Erreur lors du chargement du modèle");
      // En cas d'erreur, définir quand même un modèle par défaut
      setModel(DEFAULT_MODEL);
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour sauvegarder le modèle
  const handleSaveModel = async (updatedModel: PDFModel) => {
    setSaving(true);
    setError(null);
    
    try {
      console.log("Sauvegarde du modèle:", updatedModel);
      await savePDFModel(updatedModel);
      
      setModel(updatedModel);
      toast.success("Modèle sauvegardé avec succès");
    } catch (err) {
      console.error("Erreur lors de la sauvegarde du modèle:", err);
      setError("Erreur lors de la sauvegarde du modèle");
      toast.error("Erreur lors de la sauvegarde du modèle");
    } finally {
      setSaving(false);
    }
  };
  
  // Gestion de la mise à jour des informations de l'entreprise
  const handleCompanyInfoUpdate = (companyInfo: Partial<PDFModel>) => {
    if (model) {
      const updatedModel = {
        ...model,
        ...companyInfo
      };
      
      handleSaveModel(updatedModel);
    }
  };
  
  // Gestion de la mise à jour du modèle complet
  const handleModelUpdate = (updatedModel: PDFModel) => {
    handleSaveModel(updatedModel);
  };

  return (
    <Card className="w-full mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gestionnaire de modèles PDF</CardTitle>
        <Button 
          variant="default" 
          size="sm" 
          onClick={() => model && handleSaveModel(model)}
          disabled={saving || loading || !model}
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sauvegarde...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Sauvegarder
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              Chargement du modèle...
            </p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="company">Informations de l'entreprise</TabsTrigger>
              <TabsTrigger value="design">Conception du modèle</TabsTrigger>
            </TabsList>
            
            <TabsContent value="company" className="mt-6">
              {model && (
                <PDFModelCompanyInfo 
                  model={model} 
                  onSave={handleCompanyInfoUpdate} 
                  loading={saving}
                />
              )}
            </TabsContent>
            
            <TabsContent value="design" className="mt-6">
              {model && (
                <PDFTemplateWithFields 
                  template={model}
                  onSave={handleModelUpdate}
                />
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default PDFModelManager;
