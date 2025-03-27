
import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addProduct, uploadProductImage, updateProduct } from "@/services/catalogService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, X, Plus, Image, Euro, Tag, Layers, ArrowRight, Info, ChevronLeft } from "lucide-react";
import { Product, ProductVariationAttributes } from "@/types/catalog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { updateProductVariationAttributes } from "@/services/variantPriceService";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";

const productCategories = [
  "laptop",
  "desktop",
  "tablet",
  "smartphone",
  "accessories",
  "printer",
  "monitor",
  "software",
  "networking",
  "server",
  "storage",
  "other"
];

const categoryTranslations: Record<string, string> = {
  "laptop": "Ordinateur portable",
  "desktop": "Ordinateur de bureau",
  "tablet": "Tablette",
  "smartphone": "Smartphone",
  "accessories": "Accessoires",
  "printer": "Imprimante",
  "monitor": "Écran",
  "software": "Logiciel",
  "networking": "Réseau",
  "server": "Serveur",
  "storage": "Stockage",
  "other": "Autre"
};

const popularBrands = [
  "Apple",
  "Samsung",
  "HP",
  "Dell",
  "Lenovo",
  "Asus",
  "Acer",
  "Microsoft",
  "Sony",
  "LG",
  "Huawei",
  "Canon",
  "Xerox",
  "Logitech",
  "Brother",
  "Autre"
];

interface ProductEditorProps {
  onSuccess?: () => void;
  product?: Product;
  isEditing?: boolean;
}

const ProductEditor: React.FC<ProductEditorProps> = ({ 
  onSuccess,
  product,
  isEditing = false
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("basic");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [variationAttributes, setVariationAttributes] = useState<ProductVariationAttributes>({});
  const [newAttributeName, setNewAttributeName] = useState("");
  const [newAttributeValues, setNewAttributeValues] = useState("");
  const [isParentProduct, setIsParentProduct] = useState(false);

  useEffect(() => {
    if (isEditing && product) {
      setName(product.name || "");
      setCategory(product.category || "");
      setBrand(product.brand || "");
      setPrice(product.price?.toString() || "");
      setMonthlyPrice(product.monthly_price?.toString() || "");
      setDescription(product.description || "");
      setIsParentProduct(product.is_parent || false);
      
      if (product.variation_attributes) {
        setVariationAttributes(product.variation_attributes);
      }
      
      if (product.image_url) {
        setImagePreviews([product.image_url]);
      }
      
      if (product.image_urls && Array.isArray(product.image_urls)) {
        setImagePreviews(prev => [...prev, ...product.image_urls || []]);
      }
    }
  }, [isEditing, product]);

  const resetForm = () => {
    setName("");
    setCategory("");
    setBrand("");
    setPrice("");
    setMonthlyPrice("");
    setDescription("");
    setImageFiles([]);
    setImagePreviews([]);
    setVariationAttributes({});
    setNewAttributeName("");
    setNewAttributeValues("");
    setIsParentProduct(false);
    setActiveTab("basic");
  };

  const handleGoBack = () => {
    navigate("/catalog");
  };

  const addProductMutation = useMutation({
    mutationFn: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => 
      isEditing && product ? 
        updateProduct(product.id, productData) : 
        addProduct(productData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      
      // Fix typings here by properly typing the data
      const productData = data as Product;
      
      if (imageFiles.length > 0 && productData.id) {
        uploadImages(productData.id);
      } else {
        finishProductCreation(productData.id);
      }
    },
    onError: (error) => {
      console.error(`Erreur lors de ${isEditing ? "la modification" : "l'ajout"} du produit:`, error);
      toast.error(`Erreur lors de ${isEditing ? "la modification" : "l'ajout"} du produit`);
      setIsSubmitting(false);
    }
  });

  const uploadImages = async (productId: string) => {
    try {
      console.log(`Starting to upload ${imageFiles.length} images for product ${productId}`);
      
      if (imageFiles.length > 0) {
        console.log(`Uploading main image: ${imageFiles[0].name}`);
        await uploadProductImage(imageFiles[0], productId, true);
      }
      
      for (let i = 1; i < imageFiles.length && i < 5; i++) {
        console.log(`Uploading additional image ${i}: ${imageFiles[i].name}`);
        await uploadProductImage(imageFiles[i], productId, false);
      }
      
      console.log("All images uploaded successfully");
      finishProductCreation(productId);
    } catch (error) {
      console.error("Erreur lors du téléchargement des images:", error);
      toast.error("Le produit a été ajouté mais certaines images n'ont pas pu être téléchargées");
      finishProductCreation(productId);
    }
  };

  const finishProductCreation = async (productId: string) => {
    try {
      if (isParentProduct && Object.keys(variationAttributes).length > 0) {
        try {
          await updateProductVariationAttributes(productId, variationAttributes);
          toast.success("Attributs de variante enregistrés avec succès");
        } catch (error) {
          console.error("Erreur lors de l'enregistrement des attributs de variante:", error);
          toast.error("Erreur lors de l'enregistrement des attributs de variante");
        }
      }
    } catch (error) {
      console.error("Erreur lors de la finalisation de la création du produit:", error);
    } finally {
      setIsSubmitting(false);
      handleSuccess();
    }
  };

  const handleSuccess = () => {
    resetForm();
    if (onSuccess) {
      onSuccess();
    }
    toast.success(`Le produit a été ${isEditing ? "modifié" : "ajouté"} avec succès`);
    navigate("/catalog");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !category || (!isParentProduct && !price)) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setIsSubmitting(true);

    try {
      const productData = {
        name,
        category,
        price: isParentProduct ? 0 : parseFloat(price) || 0,
        monthly_price: isParentProduct ? 0 : (monthlyPrice ? parseFloat(monthlyPrice) : undefined),
        description,
        brand: brand || "",
        imageUrl: product?.image_url || "",
        specifications: product?.specifications || {},
        active: true,
        is_parent: isParentProduct,
        stock: isParentProduct ? 0 : undefined,
        variation_attributes: isParentProduct ? variationAttributes : {}
      };

      addProductMutation.mutate(productData);
    } catch (error) {
      console.error("Erreur lors de la préparation des données:", error);
      toast.error("Erreur lors de la préparation des données du produit");
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    console.log(`Selected ${files.length} new image files`);
    const newFiles = Array.from(files).slice(0, 5 - imageFiles.length);
    if (newFiles.length === 0) return;
    
    const updatedFiles = [...imageFiles, ...newFiles].slice(0, 5);
    setImageFiles(updatedFiles);

    newFiles.forEach(file => {
      console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => {
          const updated = [...prev, reader.result as string].slice(0, 5);
          return updated;
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleAddAttribute = () => {
    if (!newAttributeName || !newAttributeValues) {
      toast.error("Veuillez saisir un nom d'attribut et au moins une valeur");
      return;
    }
    
    const values = newAttributeValues.split(',').map(v => v.trim()).filter(Boolean);
    
    if (values.length === 0) {
      toast.error("Veuillez saisir au moins une valeur pour l'attribut");
      return;
    }
    
    setVariationAttributes(prev => ({
      ...prev,
      [newAttributeName]: values
    }));
    
    setNewAttributeName("");
    setNewAttributeValues("");
  };
  
  const handleRemoveAttribute = (attributeName: string) => {
    setVariationAttributes(prev => {
      const updated = { ...prev };
      delete updated[attributeName];
      return updated;
    });
  };

  return (
    <div className="container py-6 max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={handleGoBack} className="mr-2">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Retour au catalogue
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditing ? "Modifier le produit" : "Créer un nouveau produit"}
        </h1>
      </div>

      <Card className="mb-8">
        <CardHeader className="pb-2">
          <CardTitle>{isEditing ? "Modifier le produit" : "Créer un nouveau produit"}</CardTitle>
          <CardDescription>
            {isEditing 
              ? "Modifiez les caractéristiques de votre produit." 
              : "Ajoutez un nouveau produit au catalogue avec toutes ses caractéristiques."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 w-full mb-6">
              <TabsTrigger value="basic">
                <Info className="h-4 w-4 mr-2" />
                Informations
              </TabsTrigger>
              <TabsTrigger value="images">
                <Image className="h-4 w-4 mr-2" />
                Images
              </TabsTrigger>
              <TabsTrigger value="variants" disabled={!isParentProduct}>
                <Layers className="h-4 w-4 mr-2" />
                Variantes
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-6">
              <TabsContent value="basic" className="space-y-6 mt-0">
                <div className="space-y-2">
                  <Label htmlFor="name" className="required">Nom du produit</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nom du produit"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand">Marque</Label>
                  <Select value={brand} onValueChange={setBrand}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une marque" />
                    </SelectTrigger>
                    <SelectContent>
                      {popularBrands.map((brandName) => (
                        <SelectItem key={brandName} value={brandName}>
                          {brandName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="required">Catégorie</Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {productCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {categoryTranslations[cat] || cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_parent"
                      checked={isParentProduct}
                      onChange={(e) => setIsParentProduct(e.target.checked)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="is_parent">Ce produit a des variantes</Label>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Activez cette option si vous souhaitez créer des variantes (tailles, couleurs, etc.)
                  </p>
                </div>

                {!isParentProduct && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="price" className="required">Prix (€)</Label>
                      <div className="relative">
                        <Input
                          id="price"
                          type="number"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          required
                          className="pl-8"
                        />
                        <Euro className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="monthly_price">Mensualité (€/mois)</Label>
                      <div className="relative">
                        <Input
                          id="monthly_price"
                          type="number"
                          value={monthlyPrice}
                          onChange={(e) => setMonthlyPrice(e.target.value)}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          className="pl-8"
                        />
                        <Euro className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground">Mensualité pour le leasing du produit</p>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description du produit"
                    className="min-h-[150px]"
                  />
                </div>
              </TabsContent>

              <TabsContent value="images" className="space-y-6 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Images du produit</CardTitle>
                    <CardDescription>
                      Ajoutez jusqu'à 5 images pour votre produit. La première sera utilisée comme image principale.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {imagePreviews.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative border rounded-md overflow-hidden aspect-square">
                            <img
                              src={preview}
                              alt={`Aperçu ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/placeholder.svg";
                              }}
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2"
                              onClick={() => removeImage(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            {index === 0 && (
                              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-1">
                                Image principale
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {imagePreviews.length < 5 && (
                          <div 
                            className="border border-dashed rounded-md flex items-center justify-center cursor-pointer aspect-square bg-muted/50" 
                            onClick={() => document.getElementById("image-upload")?.click()}
                          >
                            <div className="text-center space-y-1">
                              <Plus className="mx-auto h-6 w-6 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">Ajouter</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center border border-dashed rounded-md p-6 cursor-pointer" onClick={() => document.getElementById("image-upload")?.click()}>
                        <div className="text-center space-y-2">
                          <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Cliquez pour télécharger des images (max 5)</p>
                        </div>
                      </div>
                    )}
                    
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                      multiple
                    />
                    
                    <p className="text-xs text-muted-foreground mt-2">
                      La première image sera utilisée comme image principale.
                      {imagePreviews.length > 0 && ` ${5 - imagePreviews.length} emplacement(s) restant(s).`}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="variants" className="space-y-6 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Attributs de variantes</CardTitle>
                    <CardDescription>
                      Définissez les attributs et leurs valeurs pour générer des variantes (ex: Couleur: Rouge, Bleu, Vert).
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.keys(variationAttributes).length > 0 ? (
                      <div className="space-y-4">
                        {Object.entries(variationAttributes).map(([attrName, values]) => (
                          <div key={attrName} className="flex flex-col space-y-2 p-3 border rounded-md bg-muted/30">
                            <div className="flex justify-between items-center">
                              <div className="font-medium flex items-center">
                                <Tag className="h-4 w-4 mr-2 text-primary" />
                                {attrName}
                              </div>
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleRemoveAttribute(attrName)}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {values.map((value, idx) => (
                                <span key={idx} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                                  {value}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        Aucun attribut défini. Ajoutez des attributs ci-dessous.
                      </div>
                    )}

                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-medium mb-2">Ajouter un nouvel attribut</h4>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="attributeName">Nom de l'attribut (ex: Couleur, Taille)</Label>
                          <Input
                            id="attributeName"
                            value={newAttributeName}
                            onChange={(e) => setNewAttributeName(e.target.value)}
                            placeholder="Nom de l'attribut"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="attributeValues">Valeurs (séparées par des virgules)</Label>
                          <Input
                            id="attributeValues"
                            value={newAttributeValues}
                            onChange={(e) => setNewAttributeValues(e.target.value)}
                            placeholder="ex: Rouge, Bleu, Vert"
                          />
                          <p className="text-xs text-muted-foreground">Séparez chaque valeur par une virgule</p>
                        </div>
                        <Button 
                          type="button" 
                          onClick={handleAddAttribute}
                          className="w-full"
                        >
                          Ajouter cet attribut
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <div className="flex justify-between items-center pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoBack}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                
                <div className="flex gap-2">
                  {activeTab !== "variants" && isParentProduct && (
                    <Button 
                      type="button" 
                      variant="secondary" 
                      onClick={() => setActiveTab("variants")}
                      disabled={isSubmitting}
                    >
                      Définir les variantes
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                  
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <span className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent rounded-full"></span>
                        {isEditing ? "Mise à jour en cours..." : "Création en cours..."}
                      </span>
                    ) : (
                      isEditing ? "Mettre à jour le produit" : "Ajouter le produit"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductEditor;
