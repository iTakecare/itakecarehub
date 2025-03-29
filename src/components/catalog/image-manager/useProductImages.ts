import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UseProductImagesProps {
  productId: string;
  onChange?: (images: any[]) => void;
}

export const useProductImages = ({ productId, onChange }: UseProductImagesProps) => {
  const [images, setImages] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const loadingRef = useRef(false);
  
  const getUniqueImageUrl = useCallback((url: string, index: number): string => {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${Date.now()}&rc=${retryCount}&idx=${index}`;
  }, [retryCount]);
  
  useEffect(() => {
    if (loadingRef.current) return;
    
    const loadImages = async () => {
      loadingRef.current = true;
      setIsLoadingImages(true);
      setErrorMessage(null);
      
      try {
        console.log(`Loading images for product ${productId} from product-images bucket`);
        
        // Vérifier si le bucket existe
        try {
          const { data: buckets } = await supabase.storage.listBuckets();
          const bucketExists = buckets?.some(bucket => bucket.name === 'product-images');
          
          if (!bucketExists) {
            console.log('product-images bucket does not exist, trying to create it');
            
            try {
              // Try to create the bucket via Edge Function
              const response = await fetch('/api/create-storage-bucket', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ bucketName: 'product-images' }),
              });
              
              if (!response.ok) {
                throw new Error('Failed to create bucket via edge function');
              }
            } catch (edgeFnError) {
              console.error('Error creating bucket via edge function:', edgeFnError);
              setErrorMessage('Erreur lors de la création du bucket de stockage.');
              setIsLoadingImages(false);
              loadingRef.current = false;
              return;
            }
          }
        } catch (bucketError) {
          console.error('Error checking buckets:', bucketError);
        }
        
        // Check if the folder exists and create it if not
        try {
          const { data: files, error } = await supabase.storage
            .from("product-images")
            .list(productId, {
              sortBy: { column: 'name', order: 'asc' }
            });
          
          if (error) {
            if (error.message.includes('does not exist') || error.message.includes('not found')) {
              console.log(`No folder found for product ${productId}, creating one`);
              
              // Create an empty placeholder file to create the folder
              const placeholderBytes = new Uint8Array(0);
              const placeholderBlob = new Blob([placeholderBytes]);
              const placeholderFile = new File([placeholderBlob], '.emptyFolderPlaceholder', {
                type: 'application/octet-stream'
              });
              
              await supabase.storage
                .from("product-images")
                .upload(`${productId}/.emptyFolderPlaceholder`, placeholderFile);
                
              setImages([]);
              
              if (onChange) {
                onChange([]);
              }
              
              setIsLoadingImages(false);
              loadingRef.current = false;
              return;
            } else {
              console.error(`Error loading images: ${error.message}`);
              setErrorMessage(`Erreur lors du chargement des images: ${error.message}`);
              setIsLoadingImages(false);
              loadingRef.current = false;
              return;
            }
          }
          
          if (!files || files.length === 0) {
            console.log(`No images found for product ${productId}`);
            setImages([]);
            setIsLoadingImages(false);
            loadingRef.current = false;
            
            if (onChange) {
              onChange([]);
            }
            
            return;
          }
          
          const imageFiles = files
            .filter(file => 
              !file.name.startsWith('.') && 
              file.name !== '.emptyFolderPlaceholder'
            )
            .map(file => {
              try {
                const { data } = supabase.storage
                  .from("product-images")
                  .getPublicUrl(`${productId}/${file.name}`);
                
                if (!data || !data.publicUrl) {
                  console.error(`Failed to get public URL for ${file.name}`);
                  return null;
                }
                
                const timestamp = Date.now();
                
                return {
                  name: file.name,
                  url: `${data.publicUrl}?t=${timestamp}&rc=${retryCount}`,
                  originalUrl: data.publicUrl,
                  isMain: false
                };
              } catch (e) {
                console.error(`Error generating URL for ${file.name}:`, e);
                return null;
              }
            })
            .filter(Boolean);
          
          console.log(`Loaded ${imageFiles.length} images for product ${productId}`);
          setImages(imageFiles);
          
          if (onChange) {
            onChange(imageFiles);
          }
        } catch (error) {
          console.error("Error loading images:", error);
          setErrorMessage(`Erreur lors du chargement des images: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
          setImages([]);
        } finally {
          setIsLoadingImages(false);
          loadingRef.current = false;
        }
      } catch (error) {
        console.error("Error in loadImages:", error);
        setErrorMessage(`Erreur lors du chargement des images: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        setIsLoadingImages(false);
        loadingRef.current = false;
      }
    };
    
    loadImages();
    
    return () => {
      loadingRef.current = false;
    };
  }, [productId, onChange, retryCount]);

  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    toast.info("Rafraîchissement des images...");
  }, []);
  
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    let uploadedCount = 0;
    
    try {
      // Ensure bucket exists
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === 'product-images');
      
      if (!bucketExists) {
        console.log('product-images bucket does not exist, trying to create it');
        
        try {
          // Try to create the bucket via Edge Function
          const response = await fetch('/api/create-storage-bucket', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ bucketName: 'product-images' }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to create bucket via edge function');
          }
        } catch (edgeFnError) {
          console.error('Error creating bucket via edge function:', edgeFnError);
          toast.error("Erreur lors de la création du bucket de stockage.");
          setIsUploading(false);
          return;
        }
      }
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (!file.type.startsWith('image/') && !file.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
          toast.error(`Le fichier ${file.name} n'est pas une image valide`);
          continue;
        }
        
        const imageUrl = await uploadImage(file, "product-images", productId);
        if (imageUrl) {
          uploadedCount++;
        }
      }
      
      if (uploadedCount > 0) {
        toast.success(`${uploadedCount} image(s) téléchargée(s) avec succès`);
        setRetryCount(prev => prev + 1);
      }
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Erreur lors de l'upload des images");
    } finally {
      setIsUploading(false);
      
      if (e.target) {
        e.target.value = '';
      }
    }
  }, [productId]);
  
  const handleDelete = useCallback(async (imageName: string) => {
    try {
      const filePath = `${productId}/${imageName}`;
      console.log(`Deleting file ${filePath} from bucket product-images`);
      
      const { error } = await supabase.storage
        .from("product-images")
        .remove([filePath]);
      
      if (error) {
        console.error('Error deleting file:', error);
        toast.error(`Erreur lors de la suppression: ${error.message}`);
        return;
      }
      
      toast.success("Image supprimée avec succès");
      setRetryCount(prev => prev + 1);
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("Erreur lors de la suppression de l'image");
    }
  }, [productId]);

  return {
    images,
    isUploading,
    isLoadingImages,
    errorMessage,
    retryCount,
    getUniqueImageUrl,
    handleRetry,
    handleFileChange,
    handleDelete,
  };
};

// Helper function from utils/imageUtils.ts to maintain the same functionality
const uploadImage = async (
  file: File,
  bucketName: string,
  folderPath: string = ""
): Promise<string | null> => {
  try {
    console.log(`Uploading image to ${bucketName}/${folderPath}`);
    
    // Verify file size
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image est trop volumineuse (max 5MB)");
      return null;
    }
    
    // Normalize filename to prevent extension confusion
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-');
    
    // Extract proper extension - only keep the last extension if multiple exist
    let fileName = originalName;
    const extensionMatch = originalName.match(/\.([^.]+)$/);
    const extension = extensionMatch ? extensionMatch[1].toLowerCase() : '';
    
    // If the filename has multiple extensions (like .png.webp), normalize it
    if (originalName.match(/\.[^.]+\.[^.]+$/)) {
      fileName = originalName.replace(/\.[^.]+\.[^.]+$/, `.${extension}`);
    }
    
    // Ensure we have a timestamp prefix for uniqueness
    fileName = `${timestamp}-${fileName}`;
    const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;
    
    // Determine proper MIME type using the proper extension
    let contentType = 'application/octet-stream'; // default fallback
      
    if (extension === 'png') contentType = 'image/png';
    else if (extension === 'jpg' || extension === 'jpeg') contentType = 'image/jpeg';
    else if (extension === 'gif') contentType = 'image/gif';
    else if (extension === 'webp') contentType = 'image/webp';
    else if (extension === 'svg') contentType = 'image/svg+xml';
    else if (file.type.startsWith('image/')) contentType = file.type;
    
    // Create a new File object with the correct MIME type
    const newFile = new File([await file.arrayBuffer()], fileName, {
      type: contentType
    });
    
    console.log(`Using explicit File with content-type: ${newFile.type}`);
    
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, newFile, {
        contentType: contentType,
        upsert: true
      });
      
    if (error) {
      console.error('Error in upload:', error);
      toast.error(`Erreur lors de l'upload: ${error.message}`);
      return null;
    }
    
    // Generate public URL
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
    
    if (!data || !data.publicUrl) {
      console.error('Failed to get public URL');
      return null;
    }
    
    console.log(`Uploaded image: ${data.publicUrl}`);
    return data.publicUrl;
  } catch (error) {
    console.error('Error in uploadImage:', error);
    toast.error("Erreur lors de l'upload de l'image");
    return null;
  }
};
