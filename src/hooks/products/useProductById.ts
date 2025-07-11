
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getProductById } from '@/services/catalogService';
import { Product } from '@/types/catalog';

const formatProductPrices = (productData: Product): Product => {
  if (!productData) return productData;
  
  // Convert monthly_price to number and validate it
  const originalPrice = productData.monthly_price;
  let parsedPrice: number;
  
  if (typeof originalPrice === 'number') {
    parsedPrice = originalPrice;
  } else if (typeof originalPrice === 'string') {
    parsedPrice = parseFloat(originalPrice);
  } else {
    parsedPrice = 0;
  }
  
  // If price is invalid, set to 0 but warn in console
  if (isNaN(parsedPrice)) {
    console.warn(`Invalid monthly_price converted to 0: ${originalPrice}`);
    parsedPrice = 0;
  }
  
  // Update the product with validated price
  productData.monthly_price = parsedPrice;
  
  // Also ensure valid prices for variants
  if (productData.variants && productData.variants.length > 0) {
    productData.variants = productData.variants.map(variant => {
      const variantOriginalPrice = variant.monthly_price;
      let variantParsedPrice: number;
      
      if (typeof variantOriginalPrice === 'number') {
        variantParsedPrice = variantOriginalPrice;
      } else if (typeof variantOriginalPrice === 'string') {
        variantParsedPrice = parseFloat(variantOriginalPrice);
      } else {
        variantParsedPrice = 0;
      }
      
      if (isNaN(variantParsedPrice)) {
        variantParsedPrice = 0;
      }
      
      return {
        ...variant,
        monthly_price: variantParsedPrice
      };
    });
  }
  
  // And for variant combination prices
  if (productData.variant_combination_prices && productData.variant_combination_prices.length > 0) {
    productData.variant_combination_prices = productData.variant_combination_prices.map(combo => {
      const comboOriginalPrice = combo.monthly_price;
      let comboParsedPrice: number;
      
      if (typeof comboOriginalPrice === 'number') {
        comboParsedPrice = comboOriginalPrice;
      } else if (typeof comboOriginalPrice === 'string') {
        comboParsedPrice = parseFloat(comboOriginalPrice);
      } else {
        comboParsedPrice = 0;
      }
      
      if (isNaN(comboParsedPrice)) {
        comboParsedPrice = 0;
      }
      
      return {
        ...combo,
        monthly_price: comboParsedPrice
      };
    });
  }
  
  return productData;
};

export const useProductById = (productId: string | undefined) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      if (!productId) return null;
      const productData = await getProductById(productId);
      return productData ? formatProductPrices(productData) : null;
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Function to update product data locally and invalidate cache
  const updateLocalProduct = (updatedData: Partial<Product>) => {
    if (query.data) {
      // Update the cache optimistically
      queryClient.setQueryData(['product', productId], {
        ...query.data,
        ...updatedData
      });
      
      // Invalidate to refetch from server
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
    }
  };

  return { 
    product: query.data, 
    isLoading: query.isLoading, 
    error: query.error, 
    updateLocalProduct 
  };
};
