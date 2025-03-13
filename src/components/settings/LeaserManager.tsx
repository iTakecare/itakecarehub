
import React, { useState, useEffect, useRef } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { 
  Building2, 
  Plus, 
  Pencil, 
  Trash2, 
  Image as ImageIcon, 
  Tag,
  Loader2,
  X
} from "lucide-react";
import { Leaser } from "@/types/equipment";
import { defaultLeasers } from "@/data/leasers";
import { getLeasers, addLeaser, updateLeaser, deleteLeaser } from "@/services/leaserService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Range {
  id: string;
  min: number;
  max: number;
  coefficient: number;
}

const LeaserManager = () => {
  const [leasers, setLeasers] = useState<Leaser[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentLeaser, setCurrentLeaser] = useState<Leaser | null>(null);
  const [tempRanges, setTempRanges] = useState<Range[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Charger les leasers au montage du composant
  useEffect(() => {
    fetchLeasers();
  }, []);

  const fetchLeasers = async () => {
    setIsLoading(true);
    try {
      const fetchedLeasers = await getLeasers();
      // Si aucun leaser n'est trouvé, utiliser les leasers par défaut
      setLeasers(fetchedLeasers.length > 0 ? fetchedLeasers : defaultLeasers);
    } catch (error) {
      console.error("Error fetching leasers:", error);
      setLeasers(defaultLeasers);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOpenSheet = (leaser?: Leaser) => {
    if (leaser) {
      setCurrentLeaser(leaser);
      setTempRanges([...leaser.ranges]);
      setIsEditMode(true);
      setPreviewUrl(leaser.logo_url || null);
    } else {
      setCurrentLeaser(null);
      setTempRanges([{ id: crypto.randomUUID(), min: 0, max: 0, coefficient: 0 }]);
      setIsEditMode(false);
      setPreviewUrl(null);
    }
    setIsOpen(true);
  };
  
  const handleCloseSheet = () => {
    setIsOpen(false);
    setCurrentLeaser(null);
    setTempRanges([]);
    setPreviewUrl(null);
  };
  
  const handleRangeChange = (index: number, field: keyof Range, value: number) => {
    const newRanges = [...tempRanges];
    // @ts-ignore - This is safe as we know the field is a valid key of Range
    newRanges[index][field] = value;
    setTempRanges(newRanges);
  };
  
  const handleAddRange = () => {
    const lastRange = tempRanges[tempRanges.length - 1];
    const newRangeId = crypto.randomUUID();
    
    setTempRanges([
      ...tempRanges,
      {
        id: newRangeId,
        min: lastRange.max + 0.01,
        max: lastRange.max + 5000,
        coefficient: lastRange.coefficient
      }
    ]);
  };
  
  const handleRemoveRange = (index: number) => {
    if (tempRanges.length > 1) {
      const newRanges = [...tempRanges];
      newRanges.splice(index, 1);
      setTempRanges(newRanges);
    }
  };

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      toast.error("Veuillez sélectionner une image valide");
      return;
    }

    // Vérifier la taille du fichier (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("L'image est trop volumineuse. Maximum 2MB autorisé");
      return;
    }

    try {
      setIsUploading(true);
      
      // Générer un nom de fichier unique
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      // Télécharger le fichier vers Supabase Storage
      const { data, error } = await supabase.storage
        .from('leaser-logos')
        .upload(filePath, file);
      
      if (error) throw error;
      
      // Obtenir l'URL publique du logo
      const { data: { publicUrl } } = supabase.storage
        .from('leaser-logos')
        .getPublicUrl(filePath);
      
      // Mettre à jour la prévisualisation
      setPreviewUrl(publicUrl);
      
      toast.success("Logo téléchargé avec succès");
    } catch (error: any) {
      console.error("Erreur lors du téléchargement du logo:", error);
      toast.error(`Erreur lors du téléchargement: ${error.message}`);
    } finally {
      setIsUploading(false);
      // Réinitialiser l'input pour permettre de sélectionner le même fichier à nouveau
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = () => {
    setPreviewUrl(null);
  };
  
  const handleSaveLeaser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    try {
      setIsSaving(true);
      
      const newLeaser: Omit<Leaser, "id"> = {
        name: formData.get("name") as string,
        logo_url: previewUrl,
        ranges: tempRanges
      };
      
      if (isEditMode && currentLeaser) {
        // Mise à jour d'un leaser existant
        const success = await updateLeaser(currentLeaser.id, newLeaser);
        if (success) {
          // Rafraîchir la liste des leasers
          await fetchLeasers();
          handleCloseSheet();
        }
      } else {
        // Ajout d'un nouveau leaser
        const addedLeaser = await addLeaser(newLeaser);
        if (addedLeaser) {
          setLeasers([...leasers, addedLeaser]);
          handleCloseSheet();
        }
      }
    } catch (error) {
      console.error("Error saving leaser:", error);
      toast.error("Une erreur est survenue lors de l'enregistrement du leaser");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDeleteLeaser = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce leaser ?")) {
      try {
        const success = await deleteLeaser(id);
        if (success) {
          setLeasers(leasers.filter(leaser => leaser.id !== id));
        }
      } catch (error) {
        console.error("Error deleting leaser:", error);
      }
    }
  };
  
  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <span>Leasers</span>
            </CardTitle>
            <Button onClick={() => handleOpenSheet()} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Ajouter un leaser</span>
            </Button>
          </div>
          <CardDescription>
            Gérez les organismes de financement et leurs tranches de coefficients.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Nom</TableHead>
                  <TableHead>Tranches</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leasers.map((leaser) => (
                  <TableRow key={leaser.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center overflow-hidden">
                          {leaser.logo_url ? (
                            <img 
                              src={leaser.logo_url} 
                              alt={leaser.name} 
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <Building2 className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        {leaser.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {leaser.ranges.map((range) => (
                          <span 
                            key={range.id} 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                          >
                            <Tag className="h-3 w-3 mr-1" />
                            {range.min}€ - {range.max}€ ({range.coefficient}%)
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleOpenSheet(leaser)}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Modifier</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeleteLeaser(leaser.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Supprimer</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {leasers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      Aucun leaser disponible. Ajoutez votre premier leaser.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{isEditMode ? 'Modifier le leaser' : 'Ajouter un leaser'}</SheetTitle>
            <SheetDescription>
              {isEditMode 
                ? 'Modifiez les informations et les tranches du leaser.'
                : 'Ajoutez un nouvel organisme de financement.'}
            </SheetDescription>
          </SheetHeader>
          
          <form onSubmit={handleSaveLeaser} className="mt-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du leaser</Label>
                <Input 
                  id="name" 
                  name="name" 
                  defaultValue={currentLeaser?.name || ""}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="logo_url">Logo du leaser</Label>
                <div className="mt-2">
                  {previewUrl ? (
                    <div className="relative w-full h-32 border rounded-md overflow-hidden mb-2">
                      <img 
                        src={previewUrl} 
                        alt="Logo preview" 
                        className="w-full h-full object-contain"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8"
                        onClick={handleRemoveLogo}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-md p-4 cursor-pointer hover:border-primary transition-colors"
                         onClick={handleLogoClick}>
                      {isUploading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                      ) : (
                        <ImageIcon className="h-10 w-10 text-gray-400 mb-2" />
                      )}
                      <p className="text-sm text-gray-500">
                        {isUploading ? "Téléchargement en cours..." : "Cliquez pour télécharger un logo"}
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </div>
              </div>
              
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <Label>Tranches de coefficients</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={handleAddRange}
                    className="h-8"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Ajouter
                  </Button>
                </div>
                
                <div className="space-y-3 mt-3">
                  {tempRanges.map((range, index) => (
                    <div key={range.id} className="flex gap-2">
                      <div className="flex flex-col space-y-1 w-1/3">
                        <label className="text-xs text-muted-foreground">Min (€)</label>
                        <Input 
                          type="number"
                          value={range.min}
                          onChange={(e) => handleRangeChange(index, 'min', parseFloat(e.target.value))}
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                      <div className="flex flex-col space-y-1 w-1/3">
                        <label className="text-xs text-muted-foreground">Max (€)</label>
                        <Input 
                          type="number"
                          value={range.max}
                          onChange={(e) => handleRangeChange(index, 'max', parseFloat(e.target.value))}
                          min={range.min + 0.01}
                          step="0.01"
                          required
                        />
                      </div>
                      <div className="flex flex-col space-y-1 w-1/3">
                        <label className="text-xs text-muted-foreground">Coefficient</label>
                        <Input 
                          type="number"
                          value={range.coefficient}
                          onChange={(e) => handleRangeChange(index, 'coefficient', parseFloat(e.target.value))}
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleRemoveRange(index)}
                        disabled={tempRanges.length <= 1}
                        className="mt-auto h-10 w-10 flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCloseSheet}
                disabled={isSaving || isUploading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSaving || isUploading}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isEditMode ? 'Enregistrement...' : 'Ajout...'}
                  </>
                ) : (
                  isEditMode ? 'Enregistrer' : 'Ajouter'
                )}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default LeaserManager;
