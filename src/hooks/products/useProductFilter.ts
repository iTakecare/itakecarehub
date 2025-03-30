
import { useState, useEffect } from "react";
import { Product } from "@/types/catalog";

export const useProductFilter = (products: Product[] = []) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("tous");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const getFilteredProducts = () => {
    if (!products) return [];
    
    let filtered = products;
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        (product.name?.toLowerCase().includes(query)) || 
        (product.brand?.toLowerCase().includes(query)) ||
        (product.description?.toLowerCase().includes(query))
      );
    }
    
    // Filter by product type
    if (selectedTab === "parents") {
      filtered = filtered.filter(product => 
        product.is_parent || 
        (product.variant_combination_prices && product.variant_combination_prices.length > 0)
      );
    } else if (selectedTab === "variantes") {
      filtered = filtered.filter(product => 
        product.variation_attributes && 
        Object.keys(product.variation_attributes).length > 0
      );
    } else if (selectedTab === "individuels") {
      filtered = filtered.filter(product => 
        !product.is_parent && 
        (!product.variation_attributes || Object.keys(product.variation_attributes).length === 0) &&
        (!product.variant_combination_prices || product.variant_combination_prices.length === 0)
      );
    }
    
    // Filter by selected category
    if (selectedCategory) {
      filtered = filtered.filter(product => 
        product.category === selectedCategory
      );
    }
    
    return filtered;
  };

  // Get unique categories from products
  const getCategories = (): string[] => {
    if (!products) return [];
    
    const categories = products
      .map(product => product.category)
      .filter((category): category is string => 
        category !== undefined && category !== null && category !== ''
      );
    
    return [...new Set(categories)].sort();
  };
  
  return {
    searchQuery,
    setSearchQuery,
    selectedTab,
    setSelectedTab,
    selectedCategory,
    setSelectedCategory,
    filteredProducts: getFilteredProducts(),
    categories: getCategories(),
    resetFilters: () => {
      setSearchQuery("");
      setSelectedTab("tous");
      setSelectedCategory(null);
    }
  };
};
