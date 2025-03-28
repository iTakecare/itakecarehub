/**
 * Service pour gérer le téléchargement et la manipulation d'images
 */
import { supabase } from "@/integrations/supabase/client";
import { ensureStorageBucket } from "./storageService";
import { toast } from "sonner";

export const uploadProductImage = async (file: File, productId: string, isMainImage = false) => {
  try {
    console.log(`Début du téléchargement d'image pour le produit ${productId} (image principale: ${isMainImage})`);
    
    // Vérifier d'abord si le bucket existe
    const bucketName = 'product-images';
    
    const isBucketReady = await ensureStorageBucket(bucketName);
    if (!isBucketReady) {
      console.error(`Le bucket ${bucketName} n'existe pas ou n'a pas pu être créé`);
      toast.error("Erreur lors de la préparation du stockage des images");
      throw new Error(`Impossible de créer ou vérifier le bucket ${bucketName}`);
    }
    
    // Créer la structure de dossier basée sur l'ID du produit
    const productFolder = `${productId}`;
    
    // Get file extension
    const fileExt = file.name.split('.').pop();
    const fileName = `${isMainImage ? 'main' : Date.now().toString()}.${fileExt}`;
    const filePath = `${productFolder}/${fileName}`;
    
    console.log(`Téléchargement de l'image vers: ${filePath} dans le bucket ${bucketName}`);
    
    // Vérifier si le fichier existe déjà
    try {
      const { data: existingFiles, error: listError } = await supabase.storage
        .from(bucketName)
        .list(productFolder);
      
      if (listError) {
        console.warn(`Erreur lors de la vérification des fichiers existants: ${listError.message}`);
        // On continue malgré l'erreur
      } else if (existingFiles) {
        // Si c'est l'image principale et qu'elle existe déjà, la supprimer
        if (isMainImage) {
          const mainFile = existingFiles.find(f => f.name.startsWith('main.'));
          if (mainFile) {
            console.log(`Suppression de l'ancienne image principale: ${productFolder}/${mainFile.name}`);
            await supabase.storage
              .from(bucketName)
              .remove([`${productFolder}/${mainFile.name}`]);
          }
        }
      }
    } catch (listError) {
      console.warn(`Exception lors de la vérification des fichiers existants, on continue: ${listError}`);
      // Non bloquant, on continue
    }
    
    // Uploader le fichier
    console.log(`Upload du fichier ${file.name} (type: ${file.type}, taille: ${file.size} bytes)`);
    const { error: uploadError, data: uploadData } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, { 
        contentType: file.type || 'application/octet-stream',
        upsert: true 
      });
    
    if (uploadError) {
      console.error('Erreur détaillée lors du téléchargement de l\'image:', uploadError);
      toast.error(`Erreur lors du téléchargement: ${uploadError.message}`);
      throw new Error(uploadError.message);
    }
    
    // Get public URL
    const { data: publicURL } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
    
    console.log(`Image téléchargée avec succès: ${publicURL.publicUrl}`);
    
    // Update product with image URL
    if (isMainImage) {
      const { error: updateError } = await supabase.from('products').update({
        image_url: publicURL.publicUrl
      }).eq('id', productId);
      
      if (updateError) {
        console.error(`Erreur lors de la mise à jour de l'image principale dans la base de données:`, updateError);
        toast.error("L'image a été téléchargée mais non enregistrée dans la base de données");
      } else {
        console.log(`Image principale mise à jour pour le produit ${productId}`);
      }
    } else {
      // Get current image_urls array
      const { data: product, error: fetchError } = await supabase.from('products')
        .select('image_urls')
        .eq('id', productId)
        .single();
      
      if (fetchError) {
        console.error(`Erreur lors de la récupération des URLs d'images existantes:`, fetchError);
        toast.error("L'image a été téléchargée mais non enregistrée dans la base de données");
      } else {
        let imageUrls = product?.image_urls || [];
        if (!Array.isArray(imageUrls)) {
          imageUrls = [];
        }
        
        // Add new URL and update
        const { error: updateError } = await supabase.from('products').update({
          image_urls: [...imageUrls, publicURL.publicUrl]
        }).eq('id', productId);
        
        if (updateError) {
          console.error(`Erreur lors de la mise à jour des URLs d'images:`, updateError);
          toast.error("L'image a été téléchargée mais non enregistrée dans la base de données");
        } else {
          console.log(`Image secondaire ajoutée pour le produit ${productId}`);
        }
      }
    }
    
    return publicURL.publicUrl;
  } catch (error) {
    console.error('Erreur dans uploadProductImage:', error);
    toast.error(`Erreur lors du téléchargement de l'image: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    throw error;
  }
};

export const uploadImage = async (
  file: File | string,
  bucket: string,
  folder: string = '',
  upsert: boolean = true
): Promise<{ url: string }> => {
  try {
    // Vérifier d'abord si le bucket existe
    const isBucketReady = await ensureStorageBucket(bucket);
    if (!isBucketReady) {
      console.error(`Le bucket ${bucket} n'existe pas ou n'a pas pu être créé`);
      toast.error(`Erreur lors de la préparation du bucket ${bucket}`);
      throw new Error(`Impossible de créer ou vérifier le bucket ${bucket}`);
    }
    
    // Si file est une chaîne, c'est déjà une URL ou un chemin de fichier
    if (typeof file === 'string') {
      if (file.startsWith('http')) {
        return { url: file }; // C'est déjà une URL, on la retourne simplement
      }
      // Sinon, on pourrait implémenter un téléchargement depuis le chemin, mais pas nécessaire pour l'instant
      throw new Error('Le téléchargement depuis un chemin de fichier n\'est pas supporté');
    }
    
    // C'est un objet File, on procède normalement
    // Get file extension
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;
    
    console.log(`Upload du fichier vers: ${bucket}/${filePath}`);
    
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        contentType: file.type || 'application/octet-stream',
        upsert: upsert
      });
    
    if (uploadError) {
      console.error('Erreur détaillée lors du téléchargement de l\'image:', uploadError);
      toast.error(`Erreur lors du téléchargement: ${uploadError.message}`);
      throw new Error(uploadError.message);
    }
    
    // Get public URL
    const { data: publicURL } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    console.log(`Image téléchargée avec succès: ${publicURL.publicUrl}`);
    
    return { url: publicURL.publicUrl };
  } catch (error) {
    console.error('Erreur dans uploadImage:', error);
    toast.error(`Erreur lors du téléchargement de l'image: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    throw error;
  }
};

export const detectFileExtension = (file: File | string): string => {
  if (typeof file === 'string') {
    // Si file est une chaîne (filename)
    const parts = file.split('.');
    return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
  } else {
    // Si file est un File object
    const parts = file.name.split('.');
    return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
  }
};

export const detectMimeTypeFromSignature = async (file: File): Promise<string> => {
  // Simple mime type detection based on file extension
  const ext = detectFileExtension(file);
  
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
  
  return mimeTypes[ext] || file.type || 'application/octet-stream';
};
