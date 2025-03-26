
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Product } from "@/types/catalog";

export const useProductSelector = (isOpen: boolean) => {
  const fetchProducts = async (): Promise<Product[]> => {
    console.log("Fetching products from Supabase");
    
    try {
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("active", true);
      
      if (productsError) {
        console.error("Error fetching products:", productsError);
        throw productsError;
      }
      
      console.log(`Retrieved ${productsData.length} products`);
      
      const { data: variantPricesData, error: variantPricesError } = await supabase
        .from("product_variant_prices")
        .select("*");
      
      if (variantPricesError) {
        console.error("Error fetching variant prices:", variantPricesError);
        throw variantPricesError;
      }
      
      console.log(`Retrieved ${variantPricesData.length} variant prices`);
      
      const productsWithVariants = productsData.map(product => {
        const productVariantPrices = variantPricesData.filter(price => 
          price.product_id === product.id
        );
        
        const isParent = productVariantPrices.length > 0;
        
        let variationAttributes = product.variation_attributes;
        if (isParent && (!variationAttributes || Object.keys(variationAttributes).length === 0)) {
          variationAttributes = extractVariationAttributes(productVariantPrices);
        }
        
        return {
          ...product,
          variant_combination_prices: productVariantPrices,
          is_parent: isParent || product.is_parent,
          variation_attributes: variationAttributes,
          createdAt: product.created_at || new Date(),
          updatedAt: product.updated_at || new Date()
        };
      });
      
      console.log("Processed products with variants:", productsWithVariants.length);
      return productsWithVariants;
    } catch (error) {
      console.error("Failed to fetch products:", error);
      throw error;
    }
  };
  
  const extractVariationAttributes = (variantPrices: any[]): Record<string, string[]> => {
    const attributes: Record<string, Set<string>> = {};
    
    variantPrices.forEach(price => {
      if (price.attributes) {
        Object.entries(price.attributes).forEach(([key, value]) => {
          if (!attributes[key]) {
            attributes[key] = new Set();
          }
          attributes[key].add(String(value));
        });
      }
    });
    
    const result: Record<string, string[]> = {};
    Object.entries(attributes).forEach(([key, values]) => {
      result[key] = Array.from(values);
    });
    
    return result;
  };

  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ["products-selector"],
    queryFn: fetchProducts,
    staleTime: 5 * 60 * 1000,
    enabled: isOpen,
    meta: {
      onError: (err: Error) => {
        console.error("Products query failed:", err);
        toast.error("Erreur lors du chargement des produits");
      }
    }
  });

  // Reset the component state when the selector is opened
  useEffect(() => {
    if (isOpen) {
      // The filter reset is handled in useProductFilter
    }
  }, [isOpen]);

  return {
    products,
    isLoading,
    error
  };
};
