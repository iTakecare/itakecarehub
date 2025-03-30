
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProducts } from "@/services/catalogService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowUpDown } from "lucide-react";
import ProductGridCard from "@/components/catalog/public/ProductGridCard";
import PublicHeader from "@/components/catalog/public/PublicHeader";
import { Product } from "@/types/catalog";
import { useNavigate } from "react-router-dom";

const PublicCatalog = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  useEffect(() => {
    if (products && products.length > 0) {
      console.log("Total products loaded:", products.length);
      
      const productsWithVariants = products.filter(p => 
        p.variants && p.variants.length > 0 || 
        p.variant_combination_prices && p.variant_combination_prices.length > 0 ||
        p.variation_attributes && Object.keys(p.variation_attributes || {}).length > 0
      );
      
      console.log("Products with variants:", productsWithVariants.length);
      
      productsWithVariants.forEach(p => {
        console.log(`Product "${p.name}" (${p.id}) variant info:`, {
          has_variants: p.variants && p.variants.length > 0,
          variants_count: p.variants?.length || 0,
          has_variant_prices: p.variant_combination_prices && p.variant_combination_prices.length > 0,
          variant_prices_count: p.variant_combination_prices?.length || 0,
          has_variation_attributes: p.variation_attributes && Object.keys(p.variation_attributes || {}).length > 0,
          variation_attributes: p.variation_attributes,
          monthly_price: p.monthly_price
        });
      });
    }
  }, [products]);

  const groupedProducts = React.useMemo(() => {
    const parentProducts = products.filter(p => 
      !p.parent_id && !p.is_variation
    );
    
    const variantMap = new Map<string, Product[]>();
    
    products.forEach(product => {
      if (product.parent_id) {
        const variants = variantMap.get(product.parent_id) || [];
        variants.push(product);
        variantMap.set(product.parent_id, variants);
      }
    });
    
    parentProducts.forEach(parent => {
      if (parent.id) {
        const variants = variantMap.get(parent.id) || [];
        parent.variants = variants;
        parent.is_parent = variants.length > 0 || 
                          (parent.variation_attributes && Object.keys(parent.variation_attributes).length > 0) ||
                          (parent.variant_combination_prices && parent.variant_combination_prices.length > 0);
      }
    });
    
    return parentProducts;
  }, [products]);

  const filteredProducts = groupedProducts.filter((product: Product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (product.brand && product.brand.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  const handleProductClick = (product: Product) => {
    navigate(`/produits/${product.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />
      
      <div className="bg-gradient-to-br from-[#33638e] via-[#347599] to-[#4ab6c4] text-white py-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-full w-1/2 lg:w-2/5">
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#33638e]/70 to-[#33638e] z-10"></div>
          <img 
            src="/lovable-uploads/e3c85b46-0f2e-4316-9fe1-647586b28021.png" 
            alt="Groupe de personnes heureuses utilisant des produits Apple" 
            className="h-full w-full object-cover object-center opacity-70"
          />
        </div>
        
        <div className="container mx-auto px-4 relative z-20">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="max-w-xl">
              <h1 className="text-4xl font-bold mb-4">Équipement premium reconditionné pour des équipes performantes</h1>
              <p className="text-lg mb-8">Donnez à vos collaborateurs les outils dont ils ont besoin avec notre sélection de matériel Apple et PC haute qualité, à l'impact environnemental réduit.</p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" variant="outline" className="bg-white text-[#33638e] hover:bg-gray-100 border-white">
                  Parler à un conseiller
                </Button>
                <Button size="lg" className="bg-[#da2959]/80 hover:bg-[#da2959] border-0">
                  Demander un devis
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher un produit..."
              className="pl-10 border-[#4ab6c4]/30 focus-visible:ring-[#33638e]/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center border-[#4ab6c4]/30 text-[#33638e]">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Trier
            </Button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow animate-pulse h-[280px]">
                <div className="h-0 pb-[100%] bg-gray-200 rounded-t-lg"></div>
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-lg font-medium">Aucun produit trouvé</h3>
            <p className="text-gray-500 mt-2">
              Essayez de modifier vos critères de recherche.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredProducts.map((product) => (
              <ProductGridCard 
                key={product.id} 
                product={product} 
                onClick={() => handleProductClick(product)} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicCatalog;
