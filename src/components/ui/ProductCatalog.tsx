
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { getProducts, getCategories, getBrands } from "@/services/catalogService";
import { Product } from "@/types/catalog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface ProductCatalogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: any) => void;
  isSheet?: boolean;
  title?: string;
  description?: string;
}

interface VariantCombinationPrice {
  id: string;
  product_id: string;
  attributes: Record<string, string>;
  price: number;
  monthly_price?: number;
  stock?: number;
}

interface ProductWithVariants extends Product {
  variant_combination_prices?: VariantCombinationPrice[];
}

const ProductCatalog: React.FC<ProductCatalogProps> = ({ 
  isOpen, 
  onClose, 
  onSelectProduct,
  isSheet = false,
  title = "Catalogue de produits",
  description = "Sélectionnez un produit à ajouter à votre offre"
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  
  // Fetch products directly from Supabase
  const fetchProductsDirectly = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(product => ({
      ...product,
      attributes: typeof product.attributes === 'string' 
        ? JSON.parse(product.attributes) 
        : product.attributes,
      variant_combination_prices: typeof product.variant_combination_prices === 'string'
        ? JSON.parse(product.variant_combination_prices)
        : product.variant_combination_prices
    }));
  };
  
  // Utiliser useQuery pour récupérer les produits
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ["products-direct"],
    queryFn: fetchProductsDirectly,
    enabled: isOpen, // Ne récupère les produits que lorsque le catalogue est ouvert
  });

  // Récupérer les catégories
  const { data: categoriesData = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
    enabled: isOpen,
  });

  // Récupérer les marques
  const { data: brandsData = [] } = useQuery({
    queryKey: ["brands"],
    queryFn: getBrands,
    enabled: isOpen,
  });

  useEffect(() => {
    if (isOpen) {
      console.log("Catalog opened with products:", products?.length);
      if (products && products.length > 0) {
        console.log("Sample product:", products[0]);
        if (products[0].variant_combination_prices) {
          console.log("Has variants:", products[0].variant_combination_prices.length);
        }
      }
    }
  }, [isOpen, products]);

  // Extraire les catégories
  const categories = React.useMemo(() => {
    return categoriesData.map(c => ({ name: c.name, translation: c.translation }));
  }, [categoriesData]);

  // Extraire les marques
  const brands = React.useMemo(() => {
    return brandsData.map(b => ({ name: b.name, translation: b.translation }));
  }, [brandsData]);

  // Toggle product expansion
  const toggleProductExpansion = (productId: string) => {
    setExpandedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  // Format attributes for display
  const formatAttributes = (attributes: Record<string, string> | undefined) => {
    if (!attributes || Object.keys(attributes).length === 0) {
      return "";
    }
    
    return Object.entries(attributes)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");
  };

  // Filter products
  const filteredProducts = React.useMemo(() => {
    if (!products || !Array.isArray(products)) {
      console.log("Products is not an array:", products);
      return [];
    }
    
    return products.filter((product: Product) => {
      try {
        // Search term filter
        const nameMatch = !searchTerm || (product.name && product.name.toLowerCase().includes(searchTerm.toLowerCase()));
        
        // Category filter
        const categoryMatch = selectedCategory === "all" || (product.category && product.category === selectedCategory);
        
        // Brand filter
        const brandMatch = selectedBrand === "all" || (product.brand && product.brand === selectedBrand);
        
        return nameMatch && categoryMatch && brandMatch;
      } catch (error) {
        console.error("Error filtering product:", error, product);
        return false;
      }
    });
  }, [products, searchTerm, selectedCategory, selectedBrand]);

  // Components for modal/sheet version
  const DialogOrSheet = isSheet ? Sheet : Dialog;
  const ContentComponent = isSheet ? SheetContent : DialogContent;
  const HeaderComponent = isSheet ? SheetHeader : DialogHeader;
  const TitleComponent = isSheet ? SheetTitle : DialogTitle;
  const DescriptionComponent = isSheet ? SheetDescription : DialogDescription;

  // Handle variant selection
  const handleVariantSelect = (product: ProductWithVariants, variant: VariantCombinationPrice) => {
    const variantName = product.name + " - " + formatAttributes(variant.attributes);
    
    const productWithVariant = {
      ...product,
      name: variantName,
      price: variant.price || product.price,
      monthly_price: variant.monthly_price || product.monthly_price,
      selected_variant_id: variant.id
    };
    
    onSelectProduct(productWithVariant);
  };

  // Render product with variants
  const renderProduct = (product: ProductWithVariants) => {
    const hasVariants = product.variant_combination_prices && product.variant_combination_prices.length > 0;
    const isExpanded = expandedProducts.has(product.id || "");
    
    return (
      <Card key={product.id} className="mb-3 hover:bg-slate-50 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start">
            <div className="w-20 h-20 flex-shrink-0 overflow-hidden bg-gray-100 rounded mr-4 flex items-center justify-center">
              <img 
                src={product.image_url || "/placeholder.svg"}
                alt={product.name}
                className="object-contain max-h-16 max-w-16"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                }}
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium line-clamp-2">{product.name}</h3>
                {hasVariants && (
                  <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-200">Variantes</Badge>
                )}
              </div>
              
              <div className="text-sm mt-2 flex flex-wrap gap-x-4 text-muted-foreground">
                <p>Prix: {product.price || 0} €</p>
                {product.monthly_price > 0 && (
                  <p>Mensualité: {product.monthly_price} €</p>
                )}
              </div>
              
              {hasVariants ? (
                <div className="mt-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs"
                    onClick={() => toggleProductExpansion(product.id || "")}
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp size={14} className="mr-1" />
                        Masquer les variantes ({product.variant_combination_prices?.length})
                      </>
                    ) : (
                      <>
                        <ChevronDown size={14} className="mr-1" />
                        Afficher les variantes ({product.variant_combination_prices?.length})
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="mt-2"
                  onClick={() => onSelectProduct(product)}
                >
                  <Plus size={16} className="mr-1" />
                  Sélectionner
                </Button>
              )}
            </div>
          </div>
          
          {hasVariants && isExpanded && (
            <div className="mt-4 border-t pt-3 pl-2">
              <h4 className="text-sm font-medium mb-2 text-slate-600">Variantes disponibles:</h4>
              <div className="space-y-2 ml-4">
                {product.variant_combination_prices?.map(variant => (
                  <div key={variant.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="text-sm">{formatAttributes(variant.attributes)}</p>
                      <div className="text-xs text-muted-foreground mt-1">
                        Prix: {variant.price || 0} € 
                        {variant.monthly_price ? ` • Mensualité: ${variant.monthly_price} €` : ""}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleVariantSelect(product, variant)}
                    >
                      <Plus size={14} className="mr-1" />
                      Sélectionner
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // For modal/dialog display (calculator or client requests)
  if (isSheet || (isOpen !== true)) {
    return (
      <DialogOrSheet open={isOpen} onOpenChange={() => !isLoading && onClose()}>
        <ContentComponent className={isSheet ? "sm:max-w-md" : "sm:max-w-[700px]"}>
          <HeaderComponent>
            <TitleComponent>{title}</TitleComponent>
            <DescriptionComponent>{description}</DescriptionComponent>
          </HeaderComponent>
          
          <div className="relative my-4">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un produit..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 my-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories && categories.length > 0 ? categories.map((category) => (
                  <SelectItem key={category.name} value={category.name}>
                    {category.translation || category.name}
                  </SelectItem>
                )) : null}
              </SelectContent>
            </Select>

            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger>
                <SelectValue placeholder="Marque" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les marques</SelectItem>
                {brands && brands.length > 0 ? brands.map((brand) => (
                  <SelectItem key={brand.name} value={brand.name}>
                    {brand.translation || brand.name}
                  </SelectItem>
                )) : null}
              </SelectContent>
            </Select>
          </div>
          
          {isLoading ? (
            <div className="flex flex-col gap-4 my-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 rounded-lg bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-6 text-red-500">
              Une erreur est survenue lors du chargement des produits.
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="flex flex-col gap-4 my-4">
                {filteredProducts && filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => renderProduct(product as ProductWithVariants))
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    Aucun produit trouvé
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </ContentComponent>
      </DialogOrSheet>
    );
  }

  // For regular catalog display (full page)
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative w-full md:w-[300px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {categories && categories.length > 0 ? categories.map((category) => (
                <SelectItem key={category.name} value={category.name}>
                  {category.translation}
                </SelectItem>
              )) : null}
            </SelectContent>
          </Select>
          
          <Select value={selectedBrand} onValueChange={setSelectedBrand}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Marque" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les marques</SelectItem>
              {brands && brands.length > 0 ? brands.map((brand) => (
                <SelectItem key={brand.name} value={brand.name}>
                  {brand.translation}
                </SelectItem>
              )) : null}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-10 border rounded-lg">
          <div className="text-red-500 font-medium">Une erreur est survenue lors du chargement des produits.</div>
          <div className="text-sm text-muted-foreground mt-2">Veuillez réessayer plus tard ou contactez l'administrateur.</div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => renderProduct(product as ProductWithVariants))
          ) : (
            <div className="text-center py-10 border rounded-lg">
              <div className="text-muted-foreground">Aucun produit trouvé</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductCatalog;
