
import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import Container from "@/components/layout/Container";
import { deleteAllProducts, deleteProduct } from "@/services/catalogService";
import { Product } from "@/types/catalog";
import { Plus, Trash2, Tag, Award, List, Grid3X3 } from "lucide-react";
import ProductEditor from "@/components/catalog/ProductEditor";
import { toast } from "sonner";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import ProductCatalog from "@/components/ui/ProductCatalog";
import { useNavigate } from "react-router-dom";
import { getProducts } from "@/services/catalogService";
import CategoryManager from "@/components/catalog/CategoryManager";
import BrandManager from "@/components/catalog/BrandManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AccordionProductList from "@/components/catalog/AccordionProductList";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const Catalog = () => {
  const navigate = useNavigate();
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("catalog");
  const [viewMode, setViewMode] = useState<"grid" | "accordion">("accordion");
  
  // Cette requête est juste pour avoir un refetch à transmettre au ProductCatalog
  const { refetch } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  const deleteAllProductsMutation = useMutation({
    mutationFn: deleteAllProducts,
    onSuccess: () => {
      refetch();
      toast.success("Tous les produits ont été supprimés");
    },
    onError: (err: Error) => {
      console.error("Erreur lors de la suppression des produits:", err);
      toast.error("Impossible de supprimer tous les produits");
    }
  });

  const onProductAdded = () => {
    setIsAddProductOpen(false);
    refetch();
    toast.success("Produit ajouté avec succès");
  };

  const handleDeleteAllProducts = () => {
    deleteAllProductsMutation.mutate();
  };

  const handleSelectProduct = (product: Product) => {
    navigate(`/products/${product.id}`);
  };

  const handleProductDeleted = () => {
    refetch();
  };

  return (
    <Container>
      <div className="py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Catalogue de produits</h1>
          <div className="flex gap-2">
            <Button onClick={() => setIsAddProductOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Ajouter un produit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Supprimer tous les produits
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir supprimer tous les produits du catalogue? Cette action ne peut pas être annulée.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAllProducts}>
                    Supprimer tous les produits
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4 w-full justify-start">
            <TabsTrigger value="catalog">Catalogue</TabsTrigger>
            <TabsTrigger value="categories">
              <Tag className="mr-2 h-4 w-4" />
              Catégories
            </TabsTrigger>
            <TabsTrigger value="brands">
              <Award className="mr-2 h-4 w-4" />
              Marques
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="catalog">
            <div className="mb-4 flex justify-end">
              <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as "grid" | "accordion")}>
                <ToggleGroupItem value="accordion" aria-label="Voir en accordéon">
                  <List className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="grid" aria-label="Voir en grille">
                  <Grid3X3 className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            
            {viewMode === "accordion" ? (
              <AccordionProductList onProductDeleted={handleProductDeleted} />
            ) : (
              <ProductCatalog 
                isOpen={true} 
                onClose={() => {}}
                onSelectProduct={handleSelectProduct}
                isSheet={false}
                title="Catalogue de produits"
                description="Parcourez notre catalogue complet de produits technologiques"
              />
            )}
          </TabsContent>
          
          <TabsContent value="categories">
            <CategoryManager />
          </TabsContent>
          
          <TabsContent value="brands">
            <BrandManager />
          </TabsContent>
        </Tabs>
      </div>

      <ProductEditor 
        isOpen={isAddProductOpen} 
        onClose={() => setIsAddProductOpen(false)} 
        onSuccess={onProductAdded}
      />
    </Container>
  );
};

export default Catalog;
