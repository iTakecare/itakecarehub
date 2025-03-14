
import { getSupabaseClient, getAdminSupabaseClient } from "@/integrations/supabase/client";
import { Product } from "@/types/catalog";

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

    if (!data || data.length === 0) {
      console.log("No products found in API");
      return [];
    }

    console.log(`Retrieved ${data.length} products from API`);
    return data;
  } catch (error) {
    console.error("Error in getProducts:", error);
    throw error;
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    console.log(`Fetching product with ID: ${id}`);
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching product by ID ${id}:`, error);
      throw new Error(`Error fetching product by ID: ${error.message}`);
    }

    if (!data) {
      console.log(`No product found with ID: ${id}`);
      return null;
    }

    console.log(`Successfully retrieved product with ID: ${id}`, data);
    return data;
  } catch (error) {
    console.error("Error in getProductById:", error);
    throw error;
  }
}

export async function addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ id: string }> {
  try {
    const supabase = getSupabaseClient();
    
    // Correction: renommer imageUrl en image_url pour correspondre au schéma
    const productData = {
      ...product,
      image_url: product.imageUrl, // Mapper imageUrl vers image_url
    };
    
    // Supprimer la propriété imageUrl pour éviter les erreurs
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
    
    // Handle imageUrl to image_url conversion for DB compatibility
    const updateData = { ...updates };
    if ('imageUrl' in updateData) {
      // @ts-ignore - We know imageUrl exists because we just checked
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
    // Get product name for SEO-optimized alt texts
    const product = await getProductById(productId);
    const productName = product?.name || '';
    
    // Use our image service
    const { uploadImage } = await import("@/services/imageService");
    
    // Generate a unique path for the image
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'jpg';
    const path = `${productId}/${isMainImage ? 'main' : `additional_${timestamp}`}_${timestamp}.${extension}`;
    
    // Upload the image with preservation of original name for SEO
    const result = await uploadImage(file, path, 'product-images', true);
    
    if (!result || !result.url) {
      throw new Error("Failed to upload image");
    }
    
    // Update the product with the image URL and alt text
    if (product) {
      if (isMainImage) {
        // Use image_url for database compatibility
        await updateProduct(productId, { 
          image_url: result.url,
          // Use optional property
          ...(result.altText ? { image_alt: result.altText } : {})
        });
      } else {
        // Get existing additional images or initialize an empty array
        const imageUrls = product.image_urls || [];
        // Get existing alt texts or initialize an empty array
        const imageAlts = product.image_alts || [];
        
        // Limit to 4 additional images (5 total with main image)
        if (imageUrls.length >= 4) {
          imageUrls.pop(); // Remove the oldest additional image
          if (imageAlts.length > 0) {
            imageAlts.pop(); // Remove corresponding alt text
          }
        }
        
        // Add the new image at the beginning
        imageUrls.unshift(result.url);
        imageAlts.unshift(result.altText);
        
        await updateProduct(productId, { 
          image_urls: imageUrls,
          // Use optional property
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
    // Get product name for SEO-optimized alt texts
    const product = await getProductById(productId);
    const productName = product?.name || '';
    
    // Use our image service
    const { uploadProductImages } = await import("@/services/imageService");
    
    // Upload all images
    const uploadedImages = await uploadProductImages(files, productId, productName);
    
    if (uploadedImages.length === 0) {
      throw new Error("No images were uploaded successfully");
    }
    
    // Extract URLs and alt texts
    const uploadedUrls = uploadedImages.map(img => img.url);
    const uploadedAlts = uploadedImages.map(img => img.altText);
    
    // Get the current product
    if (!product) {
      throw new Error('Product not found');
    }
    
    // Update the product with the first image as main image
    if (uploadedUrls.length > 0) {
      await updateProduct(productId, { 
        image_url: uploadedUrls[0],
        // Use optional property for imageAlt
        ...(uploadedAlts[0] ? { image_alt: uploadedAlts[0] } : {}),
        image_urls: uploadedUrls.slice(1, 5), // Max 4 additional images
        // Use optional property for imageAlts
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
    
    // Delete the product
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);
    
    if (error) {
      throw new Error(`Error deleting product: ${error.message}`);
    }
    
    // Check if it's a parent product and delete children if necessary
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
