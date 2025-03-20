
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Product } from "@/types/catalog";
import { formatCurrency } from "@/utils/formatters";
import { Badge } from "@/components/ui/badge";
import { Tag } from "lucide-react";

interface ProductGridCardProps {
  product: Product;
  onClick: () => void;
}

const ProductGridCard: React.FC<ProductGridCardProps> = ({ product, onClick }) => {
  // Skip rendering if this is a variant
  if (product.is_variation || product.parent_id) {
    return null;
  }

  const brandLabel = product.brand || "Generic";
  
  // Determine minimum monthly price considering variants
  const getMinimumMonthlyPrice = (): number => {
    let minPrice = product.monthly_price || 0;
    
    if (product.variants && product.variants.length > 0) {
      const variantPrices = product.variants
        .map(variant => variant.monthly_price || 0)
        .filter(price => price > 0);
      
      if (variantPrices.length > 0) {
        const minVariantPrice = Math.min(...variantPrices);
        if (minVariantPrice > 0 && (minPrice === 0 || minVariantPrice < minPrice)) {
          minPrice = minVariantPrice;
        }
      }
    }
    
    return minPrice;
  };
  
  // Calculate the number of variants or variations
  const getVariationsCount = (): number => {
    // First check for actual variants
    if (product.variants && product.variants.length > 0) {
      return product.variants.length;
    }
    
    // Check if product has variant combination prices
    if (product.variant_combination_prices && product.variant_combination_prices.length > 0) {
      return product.variant_combination_prices.length;
    }
    
    // Check if product has variation attributes and calculate combinations
    if (product.variation_attributes && Object.keys(product.variation_attributes).length > 0) {
      const attributes = product.variation_attributes;
      const attributeKeys = Object.keys(attributes);
      
      if (attributeKeys.length > 0) {
        // Calculate total possible combinations
        return attributeKeys.reduce((total, key) => {
          const values = attributes[key];
          return total * (Array.isArray(values) ? values.length : 1);
        }, 1);
      }
    }
    
    return 0;
  };
  
  // Fonction pour obtenir les attributs de variation disponibles
  const getVariationAttributesList = (): JSX.Element | null => {
    if (!product.variation_attributes || Object.keys(product.variation_attributes).length === 0) {
      return null;
    }
    
    // Limiter à 3 types d'attributs maximum pour l'affichage
    const attributeEntries = Object.entries(product.variation_attributes).slice(0, 3);
    
    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {attributeEntries.map(([key, values]) => {
          // Afficher uniquement le nom de l'attribut, pas les valeurs
          return (
            <Badge 
              key={key}
              variant="outline" 
              className="bg-purple-50 text-purple-700 border-purple-200 flex items-center px-2 py-0.5"
            >
              <Tag className="h-3 w-3 mr-1" />
              {key}
            </Badge>
          );
        })}
      </div>
    );
  };
  
  const monthlyPrice = getMinimumMonthlyPrice();
  const hasPrice = monthlyPrice > 0;
  const monthlyPriceLabel = hasPrice ? `${formatCurrency(monthlyPrice)}/mois` : "Prix sur demande";
  const imageUrl = product.image_url || product.imageUrl || "/placeholder.svg";
  
  // Get appropriate category label
  const getCategoryLabel = (category: string | undefined) => {
    if (!category) return "Autre";
    
    const categoryMap: Record<string, string> = {
      laptop: "Ordinateur portable",
      desktop: "Ordinateur fixe",
      tablet: "Tablette",
      smartphone: "Smartphone",
      monitor: "Écran",
      printer: "Imprimante",
      accessories: "Accessoire"
    };
    
    return categoryMap[category] || "Autre";
  };

  // Check if product has variants
  const hasVariants = product.is_parent || 
                     (product.variants && product.variants.length > 0) ||
                     (product.variant_combination_prices && product.variant_combination_prices.length > 0) ||
                     (product.variation_attributes && Object.keys(product.variation_attributes).length > 0);

  // Count available variants for the badge
  const variantsCount = getVariationsCount();

  return (
    <Card 
      className="overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer h-full flex flex-col border shadow-sm rounded-xl"
      onClick={onClick}
    >
      <div className="relative aspect-video bg-white flex items-center justify-center p-4">
        <img 
          src={imageUrl} 
          alt={product.name} 
          className="object-contain max-h-full max-w-full"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder.svg";
          }}
        />
      </div>
      
      <CardContent className="flex-1 flex flex-col p-5 pt-3">
        <div className="flex flex-wrap gap-2 mb-2">
          {product.category && (
            <Badge className="bg-indigo-500 text-white hover:bg-indigo-600 rounded-full font-normal">
              {getCategoryLabel(product.category)}
            </Badge>
          )}
          {brandLabel && (
            <Badge variant="outline" className="rounded-full font-normal text-gray-600 bg-gray-50">
              {brandLabel}
            </Badge>
          )}
        </div>
        
        <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-2">{product.name}</h3>
        
        <div className="text-gray-700 text-base mt-1">
          {hasPrice && <span>à partir de </span>}
          <span className="font-bold text-indigo-700">{monthlyPriceLabel}</span>
        </div>
        
        {/* Afficher les badges des attributs de variation */}
        {hasVariants && getVariationAttributesList()}
        
        {hasVariants && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <span className="text-gray-600 text-sm">
              {variantsCount > 0 
                ? `${variantsCount} configuration${variantsCount > 1 ? 's' : ''} disponible${variantsCount > 1 ? 's' : ''}`
                : "Configurations disponibles"}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductGridCard;
