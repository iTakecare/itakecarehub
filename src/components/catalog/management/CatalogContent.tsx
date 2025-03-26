
import React from "react";
import { Product } from "@/types/catalog";
import AccordionProductList from "@/components/catalog/AccordionProductList";
import ProductGrid from "@/components/catalog/ProductGrid";

interface CatalogContentProps {
  products: Product[];
  isLoading: boolean;
  error: any;
  viewMode: "grid" | "accordion";
  groupingOption: "model" | "brand";
  onProductDeleted: (productId: string) => Promise<void>;
}

const CatalogContent: React.FC<CatalogContentProps> = ({
  products,
  isLoading,
  error,
  viewMode,
  groupingOption,
  onProductDeleted
}) => {
  if (error) {
    return (
      <div className="text-center p-4 bg-red-50 text-red-600 rounded-md border border-red-200">
        Une erreur s'est produite lors du chargement des produits. Veuillez réessayer.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 rounded-md bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      {viewMode === "accordion" ? (
        <AccordionProductList 
          products={products} 
          onProductDeleted={onProductDeleted} 
          groupingOption={groupingOption} 
        />
      ) : (
        <ProductGrid products={products} />
      )}
    </>
  );
};

export default CatalogContent;
