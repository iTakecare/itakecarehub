
import React, { useState, useEffect } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, AlertCircle } from "lucide-react";
import { Product } from "@/types/catalog";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { getProducts } from "@/services/catalogService";
import { Alert } from "@/components/ui/alert";
import { products as defaultProducts } from "@/data/products";

// Map for translating category names to French
const categoryTranslations: Record<string, string> = {
  "all": "Tous",
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

// Helper function to translate categories
const translateCategory = (category: string): string => {
  return categoryTranslations[category?.toLowerCase()] || category;
};

interface ProductCatalogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
}

const ProductCatalog = ({ isOpen, onClose, onSelectProduct }: ProductCatalogProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  console.log("Default products available:", defaultProducts.length); // Debug log
  
  // Ensure default products are properly formatted
  const enrichedDefaultProducts = defaultProducts.map(product => ({
    ...product,
    specifications: product.specifications || {},
    createdAt: product.createdAt || new Date(),
    updatedAt: product.updatedAt || new Date()
  }));
  
  // Utiliser React Query avec les produits par défaut comme fallback
  const { 
    data: products = enrichedDefaultProducts, 
    isLoading, 
    isError 
  } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
    enabled: isOpen // Ne charger les données que lorsque le catalogue est ouvert
  });
  
  console.log("Products available:", products.length); // Debug log
  
  // Extraire les catégories à partir des produits chargés
  const filteredProducts = React.useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);
  
  console.log("Filtered products:", filteredProducts.length); // Debug log
  
  const handleSelectProduct = (product: Product) => {
    onSelectProduct(product);
    onClose();
  };
  
  // Reset search and category when closing
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setSelectedCategory("all");
    }
  }, [isOpen]);
  
  return (
    <Sheet open={isOpen} onOpenChange={() => onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md md:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Catalogue de produits</SheetTitle>
          <SheetDescription>
            Sélectionnez un produit pour l'ajouter à votre offre
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          {isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <p className="ml-2">Erreur lors du chargement des produits. Utilisation des données locales.</p>
            </Alert>
          )}
          
          <div className="flex flex-wrap gap-2">
            {React.useMemo(() => {
              const categories = ["all", ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];
              return categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category === "all" ? "Tous" : translateCategory(category)}
                </Button>
              ));
            }, [products, selectedCategory])}
          </div>
          
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="border rounded-lg p-4 h-[200px] animate-pulse bg-muted"></div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    whileHover={{ y: -5 }}
                    className="border rounded-lg p-4 cursor-pointer hover:border-primary"
                    onClick={() => handleSelectProduct(product)}
                  >
                    <div className="aspect-square w-full overflow-hidden bg-muted mb-3 rounded-md">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder.svg";
                        }}
                      />
                    </div>
                    <h3 className="font-medium line-clamp-1">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">{translateCategory(product.category)}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="font-bold">
                        {product.price.toLocaleString("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </p>
                      <Button size="sm" variant="ghost" className="rounded-full h-8 w-8 p-0">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-2 py-8 text-center">
                  <p className="text-muted-foreground">Aucun produit trouvé</p>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProductCatalog;
