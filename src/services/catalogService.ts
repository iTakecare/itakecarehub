
import { getSupabaseClient, getAdminSupabaseClient } from "@/integrations/supabase/client";
import { Product } from "@/types/catalog";
import { products as sampleProducts } from "@/data/products";

export async function getProducts(): Promise<Product[]> {
  try {
    console.log("Fetching products from API");
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching products from API:", error);
      throw new Error(`API Error: ${error.message}`);
    }

    console.log(`Retrieved ${data?.length || 0} products from API`);
    return data || [];
  } catch (error) {
    console.error("Error in getProducts:", error);
    return [];
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    console.log(`Fetching product with ID: ${id}`);
    const supabase = getSupabaseClient();
    
    const { data: mainProduct, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching product by ID ${id}:`, error);
      throw new Error(`Error fetching product by ID: ${error.message}`);
    }

    if (!mainProduct) {
      console.log(`No product found with ID: ${id}`);
      return null;
    }
    
    // Normaliser les attributs du produit principal pour garantir qu'ils sont au format Record
    if (mainProduct.attributes) {
      if (Array.isArray(mainProduct.attributes)) {
        const attributesObj: Record<string, string | number | boolean> = {};
        mainProduct.attributes.forEach((attr: any) => {
          if (attr.name && attr.value !== undefined) {
            attributesObj[attr.name] = attr.value;
          }
        });
        mainProduct.attributes = attributesObj;
      } else if (typeof mainProduct.attributes !== 'object') {
        mainProduct.attributes = {};
      }
    } else {
      mainProduct.attributes = {};
    }
    
    // Pour débogage, loguer les informations sur le produit parent
    console.log(`Product data: is_parent=${mainProduct.is_parent}, parent_id=${mainProduct.parent_id}`);
    
    // Si c'est un produit parent, récupérer ses variantes
    if (mainProduct.is_parent) {
      console.log(`Product ${id} is a parent, fetching variants...`);
      
      const { data: variants, error: variantError } = await supabase
        .from('products')
        .select('*')
        .eq('parent_id', id);
        
      if (variantError) {
        console.error(`Error fetching variants for product ${id}:`, variantError);
      } else if (variants && variants.length > 0) {
        console.log(`Found ${variants.length} variants for product ${id}`);
        
        // Loguer le premier variant pour déboggage (voir s'il a des attributs)
        if (variants[0]) {
          console.log(`First variant attributes:`, variants[0].attributes);
        }
        
        // Normaliser les attributs pour chaque variante
        mainProduct.variants = variants.map(variant => {
          // Convertir les attributs au format Record
          if (variant.attributes) {
            if (Array.isArray(variant.attributes)) {
              if (variant.attributes.length === 0) {
                variant.attributes = {};
              } else {
                const attributesObj: Record<string, string | number | boolean> = {};
                variant.attributes.forEach((attr: any) => {
                  if (attr.name && attr.value !== undefined) {
                    attributesObj[attr.name] = attr.value;
                  }
                });
                variant.attributes = attributesObj;
              }
            } else if (typeof variant.attributes !== 'object') {
              variant.attributes = {};
            }
          } else {
            variant.attributes = {};
          }
          return variant;
        });
        
        // Log variants après normalisation
        console.log(`Normalized variants:`, mainProduct.variants.map(v => ({
          id: v.id, 
          monthly_price: v.monthly_price,
          attributes: v.attributes
        })));
      } else {
        console.log(`No variants found for parent product ${id}`);
        mainProduct.variants = [];
      }
    }
    else if (mainProduct.parent_id) {
      console.log(`Product ${id} is a variant, fetching parent and siblings...`);
      
      const { data: parent, error: parentError } = await supabase
        .from('products')
        .select('*')
        .eq('id', mainProduct.parent_id)
        .maybeSingle();
        
      if (parentError) {
        console.error(`Error fetching parent for product ${id}:`, parentError);
      } else if (parent) {
        console.log(`Found parent ${parent.id} for product ${id}`);
        
        const { data: siblings, error: siblingsError } = await supabase
          .from('products')
          .select('*')
          .eq('parent_id', parent.id);
          
        if (siblingsError) {
          console.error(`Error fetching siblings for product ${id}:`, siblingsError);
        } else if (siblings && siblings.length > 0) {
          console.log(`Found ${siblings.length} siblings for product ${id}`);
          
          // Normaliser les attributs pour chaque frère/sœur (variant)
          const processedSiblings = siblings.map(variant => {
            if (variant.attributes) {
              if (Array.isArray(variant.attributes)) {
                if (variant.attributes.length === 0) {
                  variant.attributes = {};
                } else {
                  const attributesObj: Record<string, string | number | boolean> = {};
                  variant.attributes.forEach((attr: any) => {
                    if (attr.name && attr.value !== undefined) {
                      attributesObj[attr.name] = attr.value;
                    }
                  });
                  variant.attributes = attributesObj;
                }
              } else if (typeof variant.attributes !== 'object') {
                variant.attributes = {};
              }
            } else {
              variant.attributes = {};
            }
            return variant;
          });
          
          parent.variants = processedSiblings;
          mainProduct.variants = processedSiblings;
        }
      }
    }

    // Calculer le prix mensuel minimum en tenant compte des variantes
    if (mainProduct.variants && mainProduct.variants.length > 0) {
      const variantPrices = mainProduct.variants
        .map(variant => variant.monthly_price || 0)
        .filter(price => price > 0);
      
      if (variantPrices.length > 0) {
        const minPrice = Math.min(...variantPrices);
        // Si le produit principal n'a pas de prix mensuel, utilisez le prix minimum des variantes
        if (!mainProduct.monthly_price || mainProduct.monthly_price === 0) {
          mainProduct.monthly_price = minPrice;
        }
      }
    }

    console.log(`Successfully retrieved product with ID: ${id}`, mainProduct);
    return mainProduct;
  } catch (error) {
    console.error("Error in getProductById:", error);
    throw error;
  }
}

export async function addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ id: string }> {
  try {
    const supabase = getSupabaseClient();
    
    const productData = {
      ...product,
      image_url: product.imageUrl,
    };
    
    delete (productData as any).imageUrl;
    
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select('id')
      .single();

    if (error) {
      throw new Error(`Error adding product: ${error.message}`);
    }

    if (!data || !data.id) {
      throw new Error("Product ID not found after insertion.");
    }

    return { id: data.id };
  } catch (error) {
    console.error("Error in addProduct:", error);
    throw error;
  }
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
  try {
    console.log(`Updating product with ID: ${id}`, updates);
    const supabase = getSupabaseClient();
    
    const updateData = { ...updates };
    if ('imageUrl' in updateData) {
      updateData.image_url = updateData.imageUrl;
      delete updateData.imageUrl;
    }
    
    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      console.error(`Error updating product with ID ${id}:`, error);
      throw new Error(`Error updating product: ${error.message}`);
    }

    console.log(`Successfully updated product with ID: ${id}`);
    return data || null;
  } catch (error) {
    console.error("Error in updateProduct:", error);
    throw error;
  }
}

export async function uploadProductImage(file: File, productId: string, isMainImage: boolean = true): Promise<string> {
  try {
    const product = await getProductById(productId);
    const productName = product?.name || '';
    
    const { uploadImage } = await import("@/services/imageService");
    
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'jpg';
    const path = `${productId}/${isMainImage ? 'main' : `additional_${timestamp}`}_${timestamp}.${extension}`;
    
    const result = await uploadImage(file, path, 'product-images', true);
    
    if (!result || !result.url) {
      throw new Error("Failed to upload image");
    }
    
    if (product) {
      if (isMainImage) {
        await updateProduct(productId, { 
          image_url: result.url,
          ...(result.altText ? { image_alt: result.altText } : {})
        });
      } else {
        const imageUrls = product.image_urls || [];
        const imageAlts = product.image_alts || [];
        
        if (imageUrls.length >= 4) {
          imageUrls.pop();
          if (imageAlts.length > 0) {
            imageAlts.pop();
          }
        }
        
        imageUrls.unshift(result.url);
        imageAlts.unshift(result.altText);
        
        await updateProduct(productId, { 
          image_urls: imageUrls,
          ...(imageAlts.length > 0 ? { image_alts: imageAlts } : {})
        });
      }
    }

    return result.url;
  } catch (error) {
    console.error("Error in uploadProductImage:", error);
    throw error;
  }
}

export async function uploadMultipleProductImages(files: File[], productId: string): Promise<string[]> {
  try {
    if (!files.length) {
      return [];
    }
    
    const product = await getProductById(productId);
    const productName = product?.name || '';
    
    const { uploadProductImages } = await import("@/services/imageService");
    
    const uploadedImages = await uploadProductImages(files, productId, productName);
    
    if (uploadedImages.length === 0) {
      throw new Error("No images were uploaded successfully");
    }
    
    const uploadedUrls = uploadedImages.map(img => img.url);
    const uploadedAlts = uploadedImages.map(img => img.altText);
    
    if (uploadedUrls.length > 0) {
      await updateProduct(productId, { 
        image_url: uploadedUrls[0],
        ...(uploadedAlts[0] ? { image_alt: uploadedAlts[0] } : {}),
        ...(uploadedUrls.length > 1 ? { image_urls: uploadedUrls.slice(1, 5) } : {}),
        ...(uploadedAlts.length > 1 ? { image_alts: uploadedAlts.slice(1, 5) } : {})
      });
    }
    
    return uploadedUrls;
  } catch (error) {
    console.error("Error in uploadMultipleProductImages:", error);
    throw error;
  }
}

export async function deleteAllProducts(): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('products')
      .delete()
      .neq('id', 'null');

    if (error) {
      throw new Error(`Error deleting all products: ${error.message}`);
    }

    return Promise.resolve();
  } catch (error) {
    console.error("Error in deleteAllProducts:", error);
    return Promise.reject(error);
  }
}

export async function deleteProduct(productId: string): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);
    
    if (error) {
      throw new Error(`Error deleting product: ${error.message}`);
    }
    
    const { data: children, error: childrenError } = await supabase
      .from('products')
      .delete()
      .eq('parent_id', productId);
    
    if (childrenError) {
      console.error(`Error deleting child products: ${childrenError.message}`);
    }
    
    return Promise.resolve();
  } catch (error) {
    console.error("Error in deleteProduct:", error);
    return Promise.reject(error);
  }
}

export const getCategories = async () => {
  try {
    console.log("Fetching categories from API");
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      if (error.code === '42P01') {
        console.log("Categories table does not exist yet. Using default categories.");
        return [
          { name: "laptop", translation: "Ordinateur portable" },
          { name: "desktop", translation: "Ordinateur de bureau" },
          { name: "tablet", translation: "Tablette" },
          { name: "smartphone", translation: "Smartphone" },
          { name: "accessories", translation: "Accessoires" },
          { name: "other", translation: "Autre" }
        ];
      }
      
      console.error("Error fetching categories from API:", error);
      throw new Error(`API Error: ${error.message}`);
    }

    console.log(`Retrieved ${data?.length || 0} categories from API`);
    return data || [];
  } catch (error) {
    console.error("Error in getCategories:", error);
    return [];
  }
}

export const addCategory = async ({ name, translation }: { name: string, translation: string }) => {
  try {
    console.log(`Adding category: ${name} (${translation})`);
    const supabase = getSupabaseClient();
    
    const { error: tableCheckError } = await supabase.rpc('check_table_exists', { table_name: 'categories' });
    
    if (tableCheckError && tableCheckError.message.includes('does not exist')) {
      const adminSupabase = getAdminSupabaseClient();
      await adminSupabase.rpc('create_categories_table');
    }

    const { data, error } = await supabase
      .from('categories')
      .insert([{ name, translation }])
      .select('*')
      .single();

    if (error) {
      console.error(`Error adding category ${name}:`, error);
      throw new Error(`Error adding category: ${error.message}`);
    }

    console.log(`Successfully added category ${name}`);
    return data;
  } catch (error) {
    console.error("Error in addCategory:", error);
    throw error;
  }
}

export const updateCategory = async ({ originalName, name, translation }: { originalName: string, name: string, translation: string }) => {
  try {
    console.log(`Updating category: ${originalName} -> ${name} (${translation})`);
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('categories')
      .update({ name, translation })
      .eq('name', originalName)
      .select('*')
      .single();

    if (error) {
      console.error(`Error updating category ${originalName}:`, error);
      throw new Error(`Error updating category: ${error.message}`);
    }

    console.log(`Successfully updated category ${originalName} to ${name}`);
    return data;
  } catch (error) {
    console.error("Error in updateCategory:", error);
    throw error;
  }
}

export const deleteCategory = async ({ name }: { name: string }) => {
  try {
    console.log(`Deleting category: ${name}`);
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('name', name);

    if (error) {
      console.error(`Error deleting category ${name}:`, error);
      throw new Error(`Error deleting category: ${error.message}`);
    }

    console.log(`Successfully deleted category ${name}`);
    return { success: true };
  } catch (error) {
    console.error("Error in deleteCategory:", error);
    throw error;
  }
}

export const getBrands = async () => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error("Error fetching brands:", error);
      throw new Error(error.message);
    }
    
    console.log(`Retrieved ${data?.length || 0} brands from API`);
    return data || [];
  } catch (error) {
    console.error("Error in getBrands:", error);
    return [];
  }
};

export const addBrand = async ({ name, translation }: { name: string, translation: string }) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .rpc('add_brand', { 
      brand_name: name,
      brand_translation: translation
    });
  
  if (error) {
    console.error("Error adding brand:", error);
    throw new Error(error.message);
  }
  
  return data;
};

export const updateBrand = async ({ originalName, name, translation }: { originalName: string, name: string, translation: string }) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .rpc('update_brand', { 
      original_name: originalName,
      new_name: name,
      new_translation: translation
    });
  
  if (error) {
    console.error("Error updating brand:", error);
    throw new Error(error.message);
  }
  
  return data;
};

export const deleteBrand = async ({ name }: { name: string }) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .rpc('delete_brand', { brand_name: name });
  
  if (error) {
    console.error("Error deleting brand:", error);
    throw new Error(error.message);
  }
  
  return data;
};
