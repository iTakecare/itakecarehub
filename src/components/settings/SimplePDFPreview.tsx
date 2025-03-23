import React, { useRef, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, ArrowLeft, ArrowRight, Save } from "lucide-react";
import { generateOfferPdf } from "@/utils/pdfGenerator";
import { toast } from "sonner";
import PDFFieldDisplay from "./PDFFieldDisplay";

interface SimplePDFPreviewProps {
  template: any;
  onSave: (updatedTemplate: any) => void;
}

const SimplePDFPreview: React.FC<SimplePDFPreviewProps> = ({ template, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const previewRef = useRef<HTMLDivElement>(null);
  const [isDraggable, setIsDraggable] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null);
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [localTemplate, setLocalTemplate] = useState(template);

  useEffect(() => {
    setLocalTemplate(template);
    setHasUnsavedChanges(false);
  }, [template]);

  useEffect(() => {
    setPageLoaded(false);
  }, [currentPage]);
  
  const SAMPLE_DATA = {
    id: "OF-2023-456",
    client_name: "Société Démo",
    client_email: "contact@demo-company.com",
    clients: {
      company: "Société Démo SA",
      name: "Jean Exemple",
      email: "jean@demo-company.com",
      address: "123 Avenue de l'Exemple, 1050 Bruxelles",
      phone: "+32 470 123 456"
    },
    equipment_description: JSON.stringify([
      {
        title: "MacBook Pro 14\" M3 Pro",
        purchasePrice: 2199,
        quantity: 2,
        margin: 18
      },
      {
        title: "Écran Dell UltraSharp 32\" 4K",
        purchasePrice: 899,
        quantity: 2,
        margin: 22
      },
      {
        title: "Station d'accueil Thunderbolt 4",
        purchasePrice: 249,
        quantity: 2,
        margin: 25
      },
      {
        title: "Souris et clavier sans fil",
        purchasePrice: 129,
        quantity: 2,
        margin: 30
      }
    ]),
    amount: 7854,
    monthly_payment: 218.17,
    coefficient: 1.07,
    created_at: new Date().toISOString(),
    workflow_status: "approved",
    commission: 392.70,
    equipment_total: 7854,
    type: "Leasing Matériel Informatique",
    remarks: "Offre pour renouvellement complet du parc informatique avec extension de garantie 3 ans",
    user: {
      name: "Gianni Sergi",
      email: "gianni@itakecare.be",
      phone: "+32 471 511 121",
      company: "iTakeCare"
    },
    contract: {
      number: "CT-2023-456",
      start_date: new Date().toISOString(),
      duration: 36,
      payment_frequency: "Mensuel"
    },
    leaser: {
      name: "FinanceIT Solutions",
      contact: "Sophie Lejeune",
      email: "contact@financeit.be",
      phone: "+32 2 123 45 67"
    }
  };

  const handleGeneratePreview = async () => {
    try {
      setLoading(true);
      
      const offerWithTemplate = {
        ...SAMPLE_DATA,
        __template: localTemplate
      };
      
      const pdfFilename = await generateOfferPdf(offerWithTemplate);
      
      toast.success(`PDF généré avec succès : ${pdfFilename}`);
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error);
      toast.error("Erreur lors de la génération du PDF");
    } finally {
      setLoading(false);
    }
  };

  const totalPages = localTemplate?.templateImages?.length || 1;
  
  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const getPageBackground = () => {
    if (localTemplate?.templateImages?.length > 0) {
      const pageImage = localTemplate.templateImages.find(
        (img: any) => img.page === currentPage
      );
      
      if (pageImage) {
        if (pageImage.url) {
          return `${pageImage.url}?t=${new Date().getTime()}`;
        } else if (pageImage.data) {
          return pageImage.data;
        }
      }
    }
    return null;
  };

  const getCurrentPageFields = () => {
    console.log("Template fields:", localTemplate?.fields);
    console.log("Current page:", currentPage);
    
    const fields = localTemplate?.fields?.filter((f: any) => {
      const isForCurrentPage = f.page === currentPage || (currentPage === 0 && f.page === undefined);
      const isVisible = f.isVisible !== false;
      console.log(`Field ${f.id}: page=${f.page}, isVisible=${f.isVisible}, willShow=${isForCurrentPage && isVisible}`);
      return isForCurrentPage && isVisible;
    }) || [];
    
    console.log("Fields for current page:", fields);
    return fields;
  };

  const hasTemplateImages = localTemplate?.templateImages && 
                           Array.isArray(localTemplate.templateImages) && 
                           localTemplate.templateImages.length > 0;
  
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error("Erreur de chargement de l'image:", e.currentTarget.src);
    e.currentTarget.src = "/placeholder.svg";
  };
  
  const handleImageLoad = () => {
    console.log("Image chargée avec succès");
    setPageLoaded(true);
  };
  
  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2));
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleDragStart = (fieldId: string, offsetX: number, offsetY: number) => {
    if (!isDraggable) return;
    setIsDragging(true);
    setDraggedFieldId(fieldId);
    setDragOffsetX(offsetX);
    setDragOffsetY(offsetY);
  };

  const handleDrag = (clientX: number, clientY: number) => {
    if (!isDragging || !draggedFieldId || !previewRef.current) return;

    const rect = previewRef.current.getBoundingClientRect();
    
    const x = (clientX - rect.left - dragOffsetX) / (3.7795275591 * zoomLevel);
    const y = (clientY - rect.top - dragOffsetY) / (3.7795275591 * zoomLevel);

    const updatedFields = localTemplate.fields.map((field: any) => {
      if (field.id === draggedFieldId && (field.page === currentPage || (currentPage === 0 && field.page === undefined))) {
        return {
          ...field,
          position: {
            x: Math.max(0, x),
            y: Math.max(0, y)
          }
        };
      }
      return field;
    });

    setLocalTemplate({
      ...localTemplate,
      fields: updatedFields
    });
    
    setHasUnsavedChanges(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedFieldId(null);
  };

  const toggleDragMode = () => {
    setIsDraggable(!isDraggable);
    if (isDraggable && hasUnsavedChanges) {
      toast.info("N'oubliez pas de sauvegarder vos modifications");
    }
  };

  const handleSaveChanges = () => {
    if (onSave && hasUnsavedChanges) {
      onSave(localTemplate);
      setHasUnsavedChanges(false);
      toast.success("Positions des champs sauvegardées avec succès");
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Aperçu du modèle de PDF</h3>
        <div className="flex gap-2">
          <div className="flex items-center border rounded-md mr-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={zoomOut}
              disabled={zoomLevel <= 0.5}
              className="h-8 px-2"
            >
              -
            </Button>
            <span className="text-xs px-2">{Math.round(zoomLevel * 100)}%</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={zoomIn}
              disabled={zoomLevel >= 2}
              className="h-8 px-2"
            >
              +
            </Button>
          </div>
          <Button
            variant={isDraggable ? "default" : "outline"}
            size="sm"
            onClick={toggleDragMode}
            className="h-8"
          >
            {isDraggable ? "Terminer le positionnement" : "Positionner les champs"}
          </Button>
          {hasUnsavedChanges && (
            <Button
              variant="default"
              size="sm"
              onClick={handleSaveChanges}
              className="h-8"
            >
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder les positions
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleGeneratePreview}
            disabled={loading}
          >
            <FileDown className="h-4 w-4 mr-2" />
            Générer un PDF d'exemple
          </Button>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0 overflow-hidden">
          <div 
            ref={previewRef}
            className="bg-gray-100 p-4 flex justify-center min-h-[800px] overflow-auto"
          >
            <div className="bg-white shadow-lg relative" style={{ 
              width: `${210 * zoomLevel}mm`, 
              height: `${297 * zoomLevel}mm`,
              maxWidth: "100%"
            }}>
              {totalPages > 1 && (
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={prevPage}
                    disabled={currentPage === 0}
                    className="h-8 w-8 bg-white bg-opacity-75"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <span className="flex items-center justify-center text-sm px-2 bg-white bg-opacity-75 rounded">
                    {currentPage + 1} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={nextPage}
                    disabled={currentPage === totalPages - 1}
                    className="h-8 w-8 bg-white bg-opacity-75"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {hasTemplateImages ? (
                <div className="relative" style={{ height: "100%" }}>
                  {getPageBackground() ? (
                    <img 
                      src={getPageBackground()} 
                      alt={`Template page ${currentPage + 1}`}
                      className="w-full h-full object-contain"
                      onError={handleImageError}
                      onLoad={handleImageLoad}
                      style={{ display: "block" }}
                    />
                  ) : (
                    <div className="w-full h-full bg-white flex items-center justify-center border">
                      <p className="text-gray-400">Pas d'image pour la page {currentPage + 1}</p>
                    </div>
                  )}
                  
                  {pageLoaded && getCurrentPageFields().map((field: any) => (
                    <PDFFieldDisplay 
                      key={field.id}
                      field={field}
                      zoomLevel={zoomLevel}
                      currentPage={currentPage}
                      sampleData={SAMPLE_DATA}
                      isDraggable={isDraggable}
                      onStartDrag={handleDragStart}
                      onDrag={handleDrag}
                      onEndDrag={handleDragEnd}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-6 min-h-[842px]">
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      Aucune image de fond n'est disponible pour ce modèle.
                      <br />
                      Veuillez ajouter des images dans l'onglet "Conception du modèle".
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="text-sm text-muted-foreground">
        <p>Pour positionner les champs sur vos pages:</p>
        <ol className="list-decimal list-inside ml-4 space-y-1 mt-2">
          <li>Cliquez sur "Positionner les champs" pour activer le mode d'édition</li>
          <li>Déplacez les champs en les faisant glisser à l'emplacement souhaité</li>
          <li>Un bouton "Sauvegarder les positions" apparaîtra quand vous aurez fait des modifications</li>
          <li>Cliquez sur "Sauvegarder les positions" pour enregistrer vos changements</li>
          <li>Cliquez sur "Terminer le positionnement" pour quitter le mode d'édition</li>
        </ol>
        <p className="mt-2 font-medium text-blue-600">Note: Les positions des champs ne seront sauvegardées que lorsque vous cliquez sur le bouton "Sauvegarder les positions".</p>
      </div>
    </div>
  );
};

export default SimplePDFPreview;
