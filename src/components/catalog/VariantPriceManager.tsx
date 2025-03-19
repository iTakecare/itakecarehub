
import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Product, 
  ProductAttributes,
  ProductVariationAttributes,
  VariantCombinationPrice
} from "@/types/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Euro, Trash2, Plus, Package2, Tag, Edit, Grid } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import VariantAttributeSelector from "./VariantAttributeSelector";
import { 
  getVariantCombinationPrices, 
  createVariantCombinationPrice,
  deleteVariantCombinationPrice,
  updateProductVariationAttributes
} from "@/services/variantPriceService";
import { Badge } from "@/components/ui/badge";

interface VariantPriceManagerProps {
  product: Product;
  onPriceAdded?: () => void;
}

const VariantPriceManager: React.FC<VariantPriceManagerProps> = ({ 
  product,
  onPriceAdded
}) => {
  const queryClient = useQueryClient();
  const [selectedAttributes, setSelectedAttributes] = useState<ProductAttributes>({});
  const [price, setPrice] = useState<number | string>("");
  const [purchasePrice, setPurchasePrice] = useState<number | string>("");
  const [monthlyPrice, setMonthlyPrice] = useState<number | string>("");
  const [stock, setStock] = useState<number | string>("");
  const [attributesToDelete, setAttributesToDelete] = useState<ProductAttributes | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Bulk generation dialog state
  const [isBulkGenerationDialogOpen, setIsBulkGenerationDialogOpen] = useState(false);
  const [basePrice, setBasePrice] = useState<number | string>("");
  const [basePurchasePrice, setBasePurchasePrice] = useState<number | string>("");
  const [baseMonthlyPrice, setBaseMonthlyPrice] = useState<number | string>("");
  const [baseStock, setBaseStock] = useState<number | string>("10");
  
  // Attributes editor state
  const [isAttributeDialogOpen, setIsAttributeDialogOpen] = useState(false);
  const [attributeName, setAttributeName] = useState("");
  const [attributeValues, setAttributeValues] = useState<string>("");
  const [existingAttributes, setExistingAttributes] = useState<ProductVariationAttributes>({});
  
  const hasVariationAttributes = 
    product.variation_attributes && 
    Object.keys(product.variation_attributes).length > 0;
  
  // Initialize existing attributes
  useEffect(() => {
    if (product.variation_attributes) {
      setExistingAttributes(product.variation_attributes);
    }
  }, [product.variation_attributes]);
  
  // Get variant prices
  const { data: variantPrices, isLoading } = useQuery({
    queryKey: ["variant-prices", product.id],
    queryFn: () => getVariantCombinationPrices(product.id),
    enabled: !!product.id && product.is_parent === true,
  });
  
  // Add variant price mutation
  const addVariantPriceMutation = useMutation({
    mutationFn: (data: Omit<VariantCombinationPrice, 'id' | 'created_at' | 'updated_at'>) => 
      createVariantCombinationPrice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["variant-prices", product.id] });
      resetForm();
      toast.success("Prix de variante ajouté avec succès");
      if (onPriceAdded) onPriceAdded();
    },
    onError: (error: any) => {
      toast.error(`Erreur lors de l'ajout du prix: ${error.message}`);
    }
  });
  
  // Delete variant price mutation
  const deleteVariantPriceMutation = useMutation({
    mutationFn: (id: string) => deleteVariantCombinationPrice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["variant-prices", product.id] });
      toast.success("Prix de variante supprimé avec succès");
      if (onPriceAdded) onPriceAdded();
    },
    onError: (error: any) => {
      toast.error(`Erreur lors de la suppression du prix: ${error.message}`);
    }
  });
  
  // Update product variation attributes mutation
  const updateAttributesMutation = useMutation({
    mutationFn: (data: { productId: string, attributes: ProductVariationAttributes }) => 
      updateProductVariationAttributes(data.productId, data.attributes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", product.id] });
      toast.success("Attributs de variante mis à jour avec succès");
      if (onPriceAdded) onPriceAdded();
      setIsAttributeDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(`Erreur lors de la mise à jour des attributs: ${error.message}`);
    }
  });
  
  // Helper to check if all required attributes are selected
  const areAllAttributesSelected = (): boolean => {
    if (!product.variation_attributes) return false;
    
    return Object.keys(product.variation_attributes).every(
      attrName => selectedAttributes[attrName] !== undefined
    );
  };
  
  // Reset form values
  const resetForm = () => {
    setSelectedAttributes({});
    setPrice("");
    setPurchasePrice("");
    setMonthlyPrice("");
    setStock("");
  };
  
  // Handle attribute selection
  const handleAttributesChange = (attributes: ProductAttributes) => {
    setSelectedAttributes(attributes);
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!areAllAttributesSelected()) {
      toast.error("Veuillez sélectionner toutes les options d'attributs");
      return;
    }
    
    if (!price) {
      toast.error("Veuillez saisir un prix");
      return;
    }
    
    if (!purchasePrice) {
      toast.error("Veuillez saisir un prix d'achat");
      return;
    }
    
    // Check if this combination already exists
    const combinationExists = variantPrices?.some(variantPrice => {
      const priceAttrs = variantPrice.attributes;
      return Object.keys(selectedAttributes).every(
        key => String(priceAttrs[key]).toLowerCase() === String(selectedAttributes[key]).toLowerCase()
      );
    });
    
    if (combinationExists) {
      toast.error("Cette combinaison d'attributs existe déjà");
      return;
    }
    
    const newVariantPrice = {
      product_id: product.id,
      attributes: selectedAttributes,
      price: Number(price),
      purchase_price: Number(purchasePrice),
      monthly_price: monthlyPrice ? Number(monthlyPrice) : undefined,
      stock: stock ? Number(stock) : undefined
    };
    
    addVariantPriceMutation.mutate(newVariantPrice);
  };
  
  // Prepare for delete
  const confirmDelete = (id: string, attributes: ProductAttributes) => {
    setDeleteId(id);
    setAttributesToDelete(attributes);
    setIsDeleteDialogOpen(true);
  };
  
  // Handle delete
  const handleDelete = () => {
    if (deleteId) {
      deleteVariantPriceMutation.mutate(deleteId);
      setIsDeleteDialogOpen(false);
      setDeleteId(null);
      setAttributesToDelete(null);
    }
  };
  
  // Generate all possible combinations of attributes
  const generateAttributeCombinations = (): ProductAttributes[] => {
    if (!product.variation_attributes || Object.keys(product.variation_attributes).length === 0) {
      return [];
    }
    
    // Start with an array containing one empty object
    let result: ProductAttributes[] = [{}];
    
    // For each attribute (e.g., color, size)
    Object.entries(product.variation_attributes).forEach(([attrName, values]) => {
      // Create a new accumulator array
      const newResult: ProductAttributes[] = [];
      
      // For each existing result so far
      result.forEach(combinationSoFar => {
        // For each value of the current attribute
        values.forEach(value => {
          // Create a new combination by adding the current attribute value
          newResult.push({
            ...combinationSoFar,
            [attrName]: value
          });
        });
      });
      
      // Replace result with the new combinations
      result = newResult;
    });
    
    return result;
  };
  
  // Generate prices for all possible combinations
  const generateAllVariantPrices = () => {
    if (!basePrice || !basePurchasePrice) {
      toast.error("Veuillez saisir un prix de base et un prix d'achat de base");
      return;
    }
    
    const combinations = generateAttributeCombinations();
    
    if (combinations.length === 0) {
      toast.error("Aucune combinaison d'attributs possible");
      return;
    }
    
    // Check which combinations already exist
    const existingCombinations = variantPrices || [];
    
    // Filter out combinations that already exist
    const newCombinations = combinations.filter(combo => {
      return !existingCombinations.some(existing => {
        return Object.keys(combo).every(
          key => String(existing.attributes[key]).toLowerCase() === String(combo[key]).toLowerCase()
        );
      });
    });
    
    if (newCombinations.length === 0) {
      toast.error("Toutes les combinaisons d'attributs existent déjà");
      return;
    }
    
    // Create a price for each combination
    let successCount = 0;
    let errorCount = 0;
    
    // Show a loading toast
    const loadingToast = toast.loading(`Génération de ${newCombinations.length} prix de variantes...`);
    
    // Process each combination sequentially with Promise chaining
    newCombinations.reduce((promise, combination, index) => {
      return promise.then(() => {
        // Add some randomness to prices to simulate realistic differences between variants
        const priceVariation = Math.random() * 50 - 25; // +/- 25
        const purchasePriceVariation = Math.random() * 20 - 10; // +/- 10
        
        const newVariantPrice = {
          product_id: product.id,
          attributes: combination,
          price: Math.max(10, Number(basePrice) + priceVariation),
          purchase_price: Math.max(5, Number(basePurchasePrice) + purchasePriceVariation),
          monthly_price: baseMonthlyPrice ? Math.max(1, Number(baseMonthlyPrice) + priceVariation/10) : undefined,
          stock: baseStock ? Number(baseStock) : undefined
        };
        
        return createVariantCombinationPrice(newVariantPrice)
          .then(() => {
            successCount++;
            // Update loading toast periodically
            if (index % 5 === 0 || index === newCombinations.length - 1) {
              toast.loading(`Génération en cours: ${index + 1}/${newCombinations.length}`, {
                id: loadingToast
              });
            }
          })
          .catch(() => {
            errorCount++;
          });
      });
    }, Promise.resolve())
      .then(() => {
        // Dismiss the loading toast
        toast.dismiss(loadingToast);
        
        // Show the final result
        if (successCount > 0) {
          toast.success(`${successCount} prix de variantes générés avec succès`);
          queryClient.invalidateQueries({ queryKey: ["variant-prices", product.id] });
          if (onPriceAdded) onPriceAdded();
        }
        
        if (errorCount > 0) {
          toast.error(`Échec de la génération de ${errorCount} prix de variantes`);
        }
        
        // Close the dialog
        setIsBulkGenerationDialogOpen(false);
      });
  };
  
  // Add a new attribute
  const handleAddAttribute = () => {
    if (!attributeName.trim()) {
      toast.error("Veuillez saisir un nom d'attribut");
      return;
    }
    
    if (!attributeValues.trim()) {
      toast.error("Veuillez saisir au moins une valeur d'attribut");
      return;
    }
    
    // Parse attribute values into an array, removing duplicates
    const valuesArray = attributeValues
      .split(",")
      .map(val => val.trim())
      .filter(val => val.length > 0)
      .filter((val, index, self) => self.indexOf(val) === index);
    
    if (valuesArray.length === 0) {
      toast.error("Veuillez saisir au moins une valeur d'attribut");
      return;
    }
    
    // Update existing attributes
    const updatedAttributes = {
      ...existingAttributes,
      [attributeName]: valuesArray
    };
    
    setExistingAttributes(updatedAttributes);
    
    // Reset form
    setAttributeName("");
    setAttributeValues("");
  };
  
  // Remove an attribute
  const handleRemoveAttribute = (attrName: string) => {
    const updatedAttributes = { ...existingAttributes };
    delete updatedAttributes[attrName];
    setExistingAttributes(updatedAttributes);
  };
  
  // Save attributes to the product
  const saveAttributes = () => {
    if (Object.keys(existingAttributes).length === 0) {
      toast.error("Veuillez ajouter au moins un attribut");
      return;
    }
    
    updateAttributesMutation.mutate({
      productId: product.id,
      attributes: existingAttributes
    });
  };
  
  // Format attributes for display
  const formatAttributes = (attributes: ProductAttributes): string => {
    return Object.entries(attributes)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");
  };
  
  // If product is not a parent product, show a message
  if (product.is_parent !== true) {
    return (
      <div className="bg-muted p-6 rounded-md text-center">
        <Package2 className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
        <h3 className="text-lg font-medium mb-2">Ce produit n'est pas un produit parent</h3>
        <p className="text-muted-foreground mb-4">
          Vous devez d'abord convertir ce produit en produit parent pour définir des variantes.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <Tag className="h-5 w-5 mr-2" />
              Attributs de variante
            </CardTitle>
            <Button 
              onClick={() => setIsAttributeDialogOpen(true)}
              variant="outline"
              size="sm"
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifier les attributs
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {hasVariationAttributes ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(product.variation_attributes || {}).map(([attrName, values]) => (
                  <div key={attrName} className="border rounded-md p-3">
                    <h4 className="font-medium">{attrName}</h4>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {values.map((value) => (
                        <Badge key={`${attrName}-${value}`} variant="secondary" className="px-2 py-1">
                          {value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={() => setIsBulkGenerationDialogOpen(true)}
                  variant="outline"
                >
                  <Grid className="h-4 w-4 mr-2" />
                  Générer toutes les variantes
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">
                Aucun attribut de variante défini pour ce produit
              </p>
              <Button 
                onClick={() => setIsAttributeDialogOpen(true)}
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Définir des attributs
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {hasVariationAttributes && (
        <>
          {/* IMPORTANT: Changed from form to div to prevent DOM nesting error */}
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Définir un nouveau prix</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Sélectionnez les attributs et définissez le prix pour cette combinaison
                    </p>
                  </div>
                  
                  <VariantAttributeSelector
                    variationAttributes={product.variation_attributes || {}}
                    initialSelectedAttributes={{}}
                    onAttributesChange={handleAttributesChange}
                  />
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Prix de vente (€)</Label>
                      <div className="relative">
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          className="pl-8"
                          placeholder="0.00"
                        />
                        <Euro className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="purchase-price">Prix d'achat (€)</Label>
                      <div className="relative">
                        <Input
                          id="purchase-price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={purchasePrice}
                          onChange={(e) => setPurchasePrice(e.target.value)}
                          className="pl-8"
                          placeholder="0.00"
                        />
                        <Euro className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="monthly-price">Mensualité (€/mois)</Label>
                      <div className="relative">
                        <Input
                          id="monthly-price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={monthlyPrice}
                          onChange={(e) => setMonthlyPrice(e.target.value)}
                          className="pl-8"
                          placeholder="0.00"
                        />
                        <Euro className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="stock">Stock</Label>
                      <Input
                        id="stock"
                        type="number"
                        min="0"
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleSubmit}
                      disabled={!areAllAttributesSelected() || !price || !purchasePrice || addVariantPriceMutation.isPending}
                    >
                      {addVariantPriceMutation.isPending ? (
                        <span className="flex items-center">
                          <span className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent rounded-full"></span>
                          Ajout...
                        </span>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" /> Ajouter ce prix
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Prix des variantes</h3>
            
            {isLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Chargement des prix...</p>
              </div>
            ) : variantPrices && variantPrices.length > 0 ? (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Attributs</TableHead>
                      <TableHead>Prix de vente (€)</TableHead>
                      <TableHead>Prix d'achat (€)</TableHead>
                      <TableHead>Mensualité (€/mois)</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {variantPrices.map((variantPrice) => (
                      <TableRow key={variantPrice.id}>
                        <TableCell className="font-medium">
                          {formatAttributes(variantPrice.attributes)}
                        </TableCell>
                        <TableCell>{variantPrice.price.toFixed(2)} €</TableCell>
                        <TableCell>
                          {variantPrice.purchase_price 
                            ? `${variantPrice.purchase_price.toFixed(2)} €` 
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {variantPrice.monthly_price 
                            ? `${variantPrice.monthly_price.toFixed(2)} €` 
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {variantPrice.stock !== undefined 
                            ? variantPrice.stock 
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => confirmDelete(variantPrice.id, variantPrice.attributes)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 border rounded-md">
                <p className="text-muted-foreground">
                  Aucun prix de variante défini pour ce produit
                </p>
              </div>
            )}
          </div>
        </>
      )}
      
      {/* Attributes Editor Dialog */}
      <Dialog open={isAttributeDialogOpen} onOpenChange={setIsAttributeDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Définir les attributs de variante</DialogTitle>
            <DialogDescription>
              Définissez les attributs qui vont servir à créer les variantes de ce produit.
              Par exemple: Couleur, Taille, Matière, etc.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-3 md:col-span-1">
                <Label htmlFor="attribute-name">Nom de l'attribut</Label>
                <Input
                  id="attribute-name"
                  placeholder="Ex: Couleur, Taille..."
                  value={attributeName}
                  onChange={(e) => setAttributeName(e.target.value)}
                />
              </div>
              <div className="col-span-3 md:col-span-2">
                <Label htmlFor="attribute-values">Valeurs possibles</Label>
                <Input
                  id="attribute-values"
                  placeholder="Ex: Rouge, Bleu, Vert... (séparés par des virgules)"
                  value={attributeValues}
                  onChange={(e) => setAttributeValues(e.target.value)}
                />
              </div>
            </div>
            
            <Button type="button" onClick={handleAddAttribute} variant="outline" className="w-full">
              <Plus className="mr-2 h-4 w-4" /> Ajouter cet attribut
            </Button>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-medium mb-4">Attributs définis</h3>
              
              {Object.keys(existingAttributes).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(existingAttributes).map(([attrName, values]) => (
                    <div key={attrName} className="flex items-start justify-between border rounded-md p-3">
                      <div>
                        <h4 className="font-medium">{attrName}</h4>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {values.map((value) => (
                            <Badge key={`${attrName}-${value}`} variant="secondary" className="px-2 py-1">
                              {value}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveAttribute(attrName)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border rounded-md">
                  <p className="text-muted-foreground">
                    Aucun attribut défini
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAttributeDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button 
              onClick={saveAttributes}
              disabled={Object.keys(existingAttributes).length === 0 || updateAttributesMutation.isPending}
            >
              {updateAttributesMutation.isPending ? (
                <span className="flex items-center">
                  <span className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent rounded-full"></span>
                  Enregistrement...
                </span>
              ) : (
                "Enregistrer les attributs"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Bulk Generation Dialog */}
      <Dialog open={isBulkGenerationDialogOpen} onOpenChange={setIsBulkGenerationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Générer toutes les variantes</DialogTitle>
            <DialogDescription>
              Cette action va créer automatiquement toutes les combinaisons d'attributs possibles
              avec les prix spécifiés ci-dessous.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="base-price">Prix de vente de base (€)</Label>
              <div className="relative">
                <Input
                  id="base-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  className="pl-8"
                  placeholder="0.00"
                />
                <Euro className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                Les prix varieront légèrement autour de cette valeur pour chaque variante.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="base-purchase-price">Prix d'achat de base (€)</Label>
              <div className="relative">
                <Input
                  id="base-purchase-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={basePurchasePrice}
                  onChange={(e) => setBasePurchasePrice(e.target.value)}
                  className="pl-8"
                  placeholder="0.00"
                />
                <Euro className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="base-monthly-price">Mensualité de base (€/mois - optionnel)</Label>
              <div className="relative">
                <Input
                  id="base-monthly-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={baseMonthlyPrice}
                  onChange={(e) => setBaseMonthlyPrice(e.target.value)}
                  className="pl-8"
                  placeholder="0.00"
                />
                <Euro className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="base-stock">Stock initial (optionnel)</Label>
              <Input
                id="base-stock"
                type="number"
                min="0"
                value={baseStock}
                onChange={(e) => setBaseStock(e.target.value)}
                placeholder="10"
              />
            </div>
            
            <div className="mt-2 p-3 bg-muted rounded-md">
              <p className="text-sm font-medium mb-1">Nombre de combinaisons à générer: </p>
              <p className="text-2xl font-bold">
                {generateAttributeCombinations().length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Les combinaisons déjà existantes seront ignorées.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsBulkGenerationDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button 
              onClick={generateAllVariantPrices}
              disabled={!basePrice || !basePurchasePrice}
            >
              Générer toutes les variantes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce prix de variante</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce prix pour la combinaison
              {attributesToDelete && (
                <span className="font-medium block mt-2">
                  {formatAttributes(attributesToDelete)}
                </span>
              )}
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VariantPriceManager;
