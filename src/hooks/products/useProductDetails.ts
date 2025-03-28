import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Product, ProductVariationAttributes } from '@/types/catalog';
import { getProductById, getProducts, findVariantByAttributes } from '@/services/catalogService';

export function useProductDetails(productId: string | null) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [variationAttributes, setVariationAttributes] = useState<ProductVariationAttributes>({});
  const [hasVariants, setHasVariants] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [isRequestFormOpen, setIsRequestFormOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Product | null>(null);
  const [duration] = useState(24); // Default lease duration in months
  
  const { data, isLoading, isError } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productId ? getProductById(productId) : null,
    enabled: !!productId,
  });

  const getValidImages = (product: Product | null): string[] => {
    if (!product) return [];
    
    const validImages: string[] = [];
    const seenUrls = new Set<string>();
    
    const isValidImage = (url: string): boolean => {
      return url && 
        typeof url === 'string' && 
        url.trim() !== '' && 
        !url.includes('.emptyFolderPlaceholder') && 
        !url.includes('undefined') &&
        url !== '/placeholder.svg';
    };
    
    if (isValidImage(product.image_url as string)) {
      validImages.push(product.image_url as string);
      seenUrls.add(product.image_url as string);
    }
    
    if (isValidImage(product.imageUrl as string) && !seenUrls.has(product.imageUrl as string)) {
      validImages.push(product.imageUrl as string);
      seenUrls.add(product.imageUrl as string);
    }
    
    if (product.image_urls && Array.isArray(product.image_urls)) {
      product.image_urls.forEach(url => {
        if (isValidImage(url) && !seenUrls.has(url)) {
          validImages.push(url);
          seenUrls.add(url);
        }
      });
    }
    
    if (product.imageUrls && Array.isArray(product.imageUrls)) {
      product.imageUrls.forEach(url => {
        if (isValidImage(url) && !seenUrls.has(url)) {
          validImages.push(url);
          seenUrls.add(url);
        }
      });
    }
    
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach(img => {
        const imgUrl = typeof img === 'string' ? img : (img.src || '');
        if (isValidImage(imgUrl) && !seenUrls.has(imgUrl)) {
          validImages.push(imgUrl);
          seenUrls.add(imgUrl);
        }
      });
    }
    
    return validImages;
  };

  useEffect(() => {
    if (isLoading) {
      setLoading(true);
      return;
    }

    if (isError) {
      setLoading(false);
      setError('Failed to fetch product data');
      return;
    }

    if (!data) {
      setLoading(false);
      setError('Product not found');
      return;
    }

    setProduct(data);
    setLoading(false);
    setError(null);
    
    const validImages = getValidImages(data);
    console.log("Valid images for product:", validImages);
    
    if (validImages.length > 0) {
      setCurrentImage(validImages[0]);
      console.log("Setting current image to:", validImages[0]);
    } else {
      setCurrentImage(null);
      console.log("No valid images found for product");
    }

    const hasVariationAttrs = data.variation_attributes && 
      Object.keys(data.variation_attributes).length > 0;
    
    const hasVariantPrices = Array.isArray(data.variant_combination_prices) && 
      data.variant_combination_prices.length > 0;
    
    setHasVariants(hasVariationAttrs || hasVariantPrices);

    const extractedAttributes: ProductVariationAttributes = {};
    
    const variantPrices = Array.isArray(data.variant_combination_prices) 
      ? data.variant_combination_prices 
      : [];
      
    variantPrices.forEach(price => {
      if (price.attributes) {
        Object.entries(price.attributes).forEach(([key, value]) => {
          if (!extractedAttributes[key]) {
            extractedAttributes[key] = [];
          }
          
          const stringValue = String(value);
          
          if (!extractedAttributes[key].includes(stringValue)) {
            extractedAttributes[key].push(stringValue);
          }
        });
      }
    });

    if (data.variation_attributes && Object.keys(data.variation_attributes).length > 0) {
      setVariationAttributes(data.variation_attributes);
      
      const defaultOptions: Record<string, string> = {};
      Object.entries(data.variation_attributes).forEach(([key, values]) => {
        if (Array.isArray(values) && values.length > 0) {
          defaultOptions[key] = values[0];
        }
      });
      setSelectedOptions(defaultOptions);
    } 
    else if (Object.keys(extractedAttributes).length > 0) {
      setVariationAttributes(extractedAttributes);
      
      const defaultOptions: Record<string, string> = {};
      Object.entries(extractedAttributes).forEach(([key, values]) => {
        if (Array.isArray(values) && values.length > 0) {
          defaultOptions[key] = values[0];
        }
      });
      setSelectedOptions(defaultOptions);
    }
  }, [data, isLoading, isError]);
  
  const handleOptionChange = (attributeName: string, value: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [attributeName]: value
    }));
  };
  
  const isOptionAvailable = (attributeName: string, optionValue: string): boolean => {
    return true;
  };
  
  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(Math.max(1, newQuantity));
  };
  
  const getOptionsForAttribute = (attributeName: string): string[] => {
    return variationAttributes[attributeName] || [];
  };
  
  const hasAttributeOptions = (attributeName: string): boolean => {
    return !!variationAttributes[attributeName] && 
           Array.isArray(variationAttributes[attributeName]) && 
           variationAttributes[attributeName].length > 0;
  };
  
  const currentPrice = selectedVariant?.price || product?.price || 0;
  
  const specifications = product?.specifications || {};
  
  const hasOptions = Object.keys(variationAttributes).length > 0;
  
  const calculateMinMonthlyPrice = (): number => {
    if (product?.monthly_price) {
      return product.monthly_price;
    }
    
    if (Array.isArray(product?.variant_combination_prices) && product.variant_combination_prices.length > 0) {
      const monthlyPrices = product.variant_combination_prices
        .map(v => v.monthly_price || 0)
        .filter(p => p > 0);
        
      if (monthlyPrices.length > 0) {
        return Math.min(...monthlyPrices);
      }
    }
    
    return currentPrice / duration;
  };
  
  const minMonthlyPrice = calculateMinMonthlyPrice();
  
  const totalPrice = (selectedVariant?.monthly_price || product?.monthly_price || (currentPrice / duration)) * quantity;

  return {
    product,
    loading,
    error,
    variationAttributes,
    hasVariants,
    selectedOptions,
    handleOptionChange,
    isOptionAvailable,
    currentImage,
    currentPrice,
    selectedVariant,
    duration,
    totalPrice,
    minMonthlyPrice,
    specifications,
    hasOptions,
    hasAttributeOptions,
    getOptionsForAttribute,
    quantity,
    handleQuantityChange,
    isRequestFormOpen,
    setIsRequestFormOpen,
    isLoading: loading,
    getValidImages,
  };
}

export function useProductsList() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts(),
  });

  return {
    products: data || [],
    loading: isLoading,
    error: isError ? error || 'Failed to fetch products' : null,
  };
}
