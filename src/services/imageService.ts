
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
    
    // Vérifier le bucket avec plusieurs tentatives si nécessaire
    let bucketReady = false;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (!bucketReady && attempts < maxAttempts) {
      attempts++;
      console.log(`Tentative ${attempts}/${maxAttempts} de vérification du bucket ${bucketName}`);
      
      bucketReady = await ensureStorageBucket(bucketName);
      
      if (!bucketReady) {
        console.warn(`Échec de la tentative ${attempts}/${maxAttempts} de vérification/création du bucket`);
        // Attendre un peu avant de réessayer
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    if (!bucketReady) {
      console.error(`Le bucket ${bucketName} n'existe pas ou n'a pas pu être créé après ${maxAttempts} tentatives`);
      toast.error("Erreur lors de la préparation du stockage des images");
      throw new Error(`Impossible de créer ou vérifier le bucket ${bucketName}`);
    }
    
    console.log(`Bucket ${bucketName} vérifié et prêt pour l'upload`);
    
    // Créer la structure de dossier basée sur l'ID du produit
    const productFolder = `${productId}`;
    
    // Conserver le nom d'origine du fichier
    const originalFileName = file.name;
    
    // Déterminer le nom de fichier
    const filePath = isMainImage 
      ? `${productFolder}/${originalFileName}` 
      : `${productFolder}/${originalFileName}`;
    
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
        // Si c'est l'image principale et qu'il y en a une existante, la supprimer
        if (isMainImage) {
          const mainFiles = existingFiles.filter(f => f.name.toLowerCase().includes('main'));
          for (const mainFile of mainFiles) {
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
    
    // Préparer le fichier pour l'upload
    let fileToUpload = file;
    let contentType = file.type || detectMimeTypeFromExtension(file.name);
    
    // Vérifier si le contenu est un JSON contenant une image en base64
    if (contentType === 'application/json') {
      try {
        // Lire le fichier pour vérifier s'il contient une image base64
        const reader = new FileReader();
        const fileContent = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsText(file);
        });
        
        try {
          const jsonData = JSON.parse(fileContent);
          
          // Si c'est un JSON et qu'il contient une propriété data qui est une chaîne
          if (jsonData.data && typeof jsonData.data === 'string') {
            console.log("Image encodée en base64 trouvée dans le JSON");
            
            // Si c'est un data URL, extraire la partie base64
            let base64Data = jsonData.data;
            let mimeType = 'image/png';
            
            // Détecter le MIME type à partir des premiers caractères de base64
            if (base64Data.includes('data:')) {
              // Format: data:image/jpeg;base64,/9j/...
              const parts = base64Data.split(';base64,');
              if (parts.length > 1) {
                mimeType = parts[0].replace('data:', '');
                base64Data = parts[1];
              }
            } else if (base64Data.startsWith('/9j/')) {
              mimeType = 'image/jpeg';
            } else if (base64Data.startsWith('iVBORw0KGgo')) {
              mimeType = 'image/png';
            } else if (base64Data.startsWith('UklGR')) {
              mimeType = 'image/webp';
            } else if (base64Data.startsWith('R0lGODlh')) {
              mimeType = 'image/gif';
            }
            
            // Convertir la chaîne base64 en Blob
            const byteCharacters = atob(base64Data.replace(/^data:image\/\w+;base64,/, ''));
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: mimeType });
            
            // Créer un nouveau File à partir du Blob en conservant le nom du fichier original
            fileToUpload = new File([blob], originalFileName, { type: mimeType });
            contentType = mimeType;
            
            console.log(`Fichier converti de JSON à ${mimeType}`);
          }
        } catch (parseError) {
          console.warn("Erreur lors de la tentative de parse JSON:", parseError);
        }
      } catch (checkError) {
        console.warn("Erreur lors de la vérification du type de fichier:", checkError);
      }
    }
    
    // Upload avec plusieurs tentatives
    let uploadAttempts = 0;
    const maxUploadAttempts = 3;
    let uploadSuccessful = false;
    let uploadError, uploadData;
    
    while (!uploadSuccessful && uploadAttempts < maxUploadAttempts) {
      uploadAttempts++;
      console.log(`Tentative d'upload ${uploadAttempts}/${maxUploadAttempts}`);
      
      try {
        const result = await supabase.storage
          .from(bucketName)
          .upload(filePath, fileToUpload, {
            contentType: contentType,
            upsert: true
          });
        
        uploadError = result.error;
        uploadData = result.data;
        
        if (uploadError) {
          console.warn(`Échec de la tentative d'upload ${uploadAttempts}/${maxUploadAttempts}: ${uploadError.message}`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          uploadSuccessful = true;
        }
      } catch (e) {
        console.warn(`Exception lors de la tentative d'upload ${uploadAttempts}/${maxUploadAttempts}:`, e);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    if (!uploadSuccessful) {
      console.error('Erreur détaillée lors du téléchargement de l\'image après plusieurs tentatives:', uploadError);
      toast.error(`Erreur lors du téléchargement: ${uploadError?.message || "Erreur inconnue"}`);
      throw new Error(uploadError?.message || "Échec de l'upload après plusieurs tentatives");
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
    // Vérifier d'abord si le bucket existe avec plusieurs tentatives
    let bucketReady = false;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (!bucketReady && attempts < maxAttempts) {
      attempts++;
      console.log(`Tentative ${attempts}/${maxAttempts} de vérification du bucket ${bucket}`);
      
      bucketReady = await ensureStorageBucket(bucket);
      
      if (!bucketReady) {
        console.warn(`Échec de la tentative ${attempts}/${maxAttempts} de vérification/création du bucket`);
        // Attendre un peu avant de réessayer
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    if (!bucketReady) {
      console.error(`Le bucket ${bucket} n'existe pas ou n'a pas pu être créé après ${maxAttempts} tentatives`);
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
    // Utiliser le nom de fichier original
    const originalFileName = file.name;
    const filePath = folder ? `${folder}/${originalFileName}` : originalFileName;
    
    console.log(`Upload du fichier vers: ${bucket}/${filePath}`);

    // Important: Vérifier que le fichier est bien une image réelle et pas un objet JSON
    let fileToUpload = file;
    let contentType = file.type || detectMimeTypeFromExtension(file.name);

    // S'assurer que le contenu est bien un fichier binaire et pas un JSON
    try {
      // Lire les premiers octets du fichier pour vérifier si c'est un JSON
      const fileSlice = file.slice(0, 20);
      const reader = new FileReader();
      const fileContent = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsText(fileSlice);
      });

      if (fileContent.trim().startsWith('{') || fileContent.trim().startsWith('[')) {
        console.warn("Le fichier semble être un JSON, conversion en cours...");
        
        // Lire le fichier complet
        const fullReader = new FileReader();
        const fullContent = await new Promise<string>((resolve) => {
          fullReader.onload = (e) => resolve(e.target?.result as string);
          fullReader.readAsText(file);
        });
        
        try {
          // Essayer de parser le JSON
          const jsonData = JSON.parse(fullContent);
          
          // Si c'est un JSON et qu'il contient une propriété data qui est une chaîne
          if (jsonData.data && typeof jsonData.data === 'string') {
            console.log("Image encodée en base64 trouvée dans le JSON");
            
            // Si c'est un data URL, extraire la partie base64
            let base64Data = jsonData.data;
            let mimeType = 'image/png';
            
            // Détecter le MIME type à partir des premiers caractères du base64
            if (base64Data.includes('data:')) {
              const parts = base64Data.split(';base64,');
              if (parts.length > 1) {
                mimeType = parts[0].replace('data:', '');
                base64Data = parts[1];
              }
            } else if (base64Data.startsWith('/9j/')) {
              mimeType = 'image/jpeg';
            } else if (base64Data.startsWith('iVBORw0KGgo')) {
              mimeType = 'image/png';
            } else if (base64Data.startsWith('UklGR')) {
              mimeType = 'image/webp';
            } else if (base64Data.startsWith('R0lGODlh')) {
              mimeType = 'image/gif';
            }
            
            // Extraire la partie base64 si nécessaire
            if (base64Data.includes('base64,')) {
              base64Data = base64Data.split('base64,')[1];
            }
            
            // Convertir la chaîne base64 en Blob
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: mimeType });
            
            // Créer un nouveau File à partir du Blob en conservant le nom du fichier original
            fileToUpload = new File([blob], originalFileName, { type: mimeType });
            contentType = mimeType;
            
            console.log(`Fichier converti de JSON à ${mimeType} avec nom ${originalFileName}`);
          }
        } catch (parseError) {
          console.warn("Erreur lors de la tentative de parse JSON:", parseError);
        }
      }
    } catch (checkError) {
      console.warn("Erreur lors de la vérification du type de fichier:", checkError);
    }
    
    // Upload avec plusieurs tentatives
    let uploadAttempts = 0;
    const maxUploadAttempts = 3;
    let uploadSuccessful = false;
    let uploadError;
    
    while (!uploadSuccessful && uploadAttempts < maxUploadAttempts) {
      uploadAttempts++;
      console.log(`Tentative d'upload ${uploadAttempts}/${maxUploadAttempts}`);
      
      try {
        const result = await supabase.storage
          .from(bucket)
          .upload(filePath, fileToUpload, {
            contentType: contentType,
            upsert: upsert
          });
        
        uploadError = result.error;
        
        if (uploadError) {
          console.warn(`Échec de la tentative d'upload ${uploadAttempts}/${maxUploadAttempts}: ${uploadError.message}`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          uploadSuccessful = true;
        }
      } catch (e) {
        console.warn(`Exception lors de la tentative d'upload ${uploadAttempts}/${maxUploadAttempts}:`, e);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    if (!uploadSuccessful) {
      console.error('Erreur détaillée lors du téléchargement de l\'image:', uploadError);
      toast.error(`Erreur lors du téléchargement: ${uploadError?.message || "Erreur inconnue"}`);
      throw new Error(uploadError?.message || "Échec de l'upload après plusieurs tentatives");
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

export const detectMimeTypeFromExtension = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
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
  
  return ext && mimeTypes[ext] ? mimeTypes[ext] : 'application/octet-stream';
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
