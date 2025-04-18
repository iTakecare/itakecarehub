
import React, { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProductFilter } from "@/hooks/products/useProductFilter";
import { Product } from "@/types/catalog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const SearchWithSuggestions = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const fetchProducts = async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .or('admin_only.is.null,admin_only.eq.false');
      
    if (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
    
    return data || [];
  };

  const { data: products = [] } = useQuery({
    queryKey: ["products-search"],
    queryFn: fetchProducts,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
  
  const suggestions = products
    .filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.brand && product.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .slice(0, 5);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleProductClick = (product: Product) => {
    setSearchTerm("");
    setShowSuggestions(false);
    navigate(`/produits/${product.id}`);
  };

  return (
    <div className="relative max-w-3xl mx-auto" ref={suggestionsRef}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setShowSuggestions(e.target.value.length > 0);
        }}
        placeholder="Rechercher un produit..."
        className="w-full rounded-full border border-gray-200 py-2 px-10 focus:outline-none focus:ring-2 focus:ring-[#275D8C]/30 text-gray-700"
        onFocus={() => setShowSuggestions(searchTerm.length > 0)}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute mt-1 w-full bg-white rounded-lg border border-gray-200 shadow-lg z-50 max-h-80 overflow-y-auto">
          {suggestions.map((product) => (
            <button
              key={product.id}
              onClick={() => handleProductClick(product)}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-3"
            >
              {product.image_url && (
                <img 
                  src={product.image_url} 
                  alt={product.name} 
                  className="w-10 h-10 object-cover rounded"
                />
              )}
              <div>
                <div className="font-medium">{product.name}</div>
                <div className="text-sm text-gray-500">{product.brand}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
