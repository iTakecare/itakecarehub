
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Uploads an image to Supabase storage and returns the public URL
 */
export async function uploadImage(
  file: File,
  bucketName: string,
  folderPath: string = ""
): Promise<string | null> {
  try {
    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image est trop volumineuse (max 5MB)");
      return null;
    }
    
    // Generate a unique filename to prevent conflicts
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '-')}`;
    const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;
    
    // Determine correct content type based on file extension
    const extension = fileName.split('.').pop()?.toLowerCase();
    const contentType = extension === 'png' ? 'image/png' : 
                        extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' :
                        extension === 'webp' ? 'image/webp' :
                        extension === 'gif' ? 'image/gif' : 'image/png';
    
    console.log(`Using direct fetch method to upload: ${fileName} with Content-Type: ${contentType}`);
    
    // Use direct fetch API for better control over Content-Type
    const formData = new FormData();
    formData.append('file', file);
    
    // Get the storage URL and key
    const storageUrl = `${supabase.supabaseUrl}/storage/v1/object/${bucketName}/${filePath}`;
    
    // Upload using fetch with explicit content-type in body
    const response = await fetch(storageUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabase.supabaseKey}`,
        'x-upsert': 'true'
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload error:', errorText);
      throw new Error(`Upload failed: ${errorText}`);
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
    
    if (!urlData || !urlData.publicUrl) {
      throw new Error('Could not get public URL');
    }
    
    console.log(`Image uploaded successfully: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Image upload error:', error);
    toast.error("Erreur lors du téléchargement de l'image");
    return null;
  }
}

/**
 * Gets a cached-busted image URL and fixes common URL issues
 */
export function getCacheBustedUrl(url: string | null | undefined): string {
  if (!url) return '';
  
  // Fix common URL issues 
  let fixedUrl = url;
  
  // Try to parse if it's JSON
  if (typeof fixedUrl === 'string' && (fixedUrl.startsWith('{') || fixedUrl.startsWith('['))) {
    try {
      const parsed = JSON.parse(fixedUrl);
      
      // Check various JSON structures that might contain URLs
      if (parsed.url) {
        fixedUrl = parsed.url;
      } else if (parsed.data && typeof parsed.data === 'string') {
        // It might be a data URL or another string URL
        fixedUrl = parsed.data;
      } else if (Array.isArray(parsed) && parsed.length > 0) {
        // If it's an array, try to get the first item that might be a URL
        if (typeof parsed[0] === 'string') {
          fixedUrl = parsed[0];
        } else if (parsed[0]?.url) {
          fixedUrl = parsed[0].url;
        }
      } else {
        // Try to get any property that looks like a URL
        const possibleUrlProps = ['src', 'href', 'link', 'image', 'path', 'publicUrl'];
        for (const prop of possibleUrlProps) {
          if (parsed[prop] && typeof parsed[prop] === 'string') {
            fixedUrl = parsed[prop];
            break;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to parse JSON URL, using as is:', e);
      // Continue with the URL as is
    }
  }
  
  // Fix missing protocol (if URL starts with single slash)
  if (fixedUrl.startsWith('/') && !fixedUrl.startsWith('//')) {
    fixedUrl = `${window.location.origin}${fixedUrl}`;
  }
  
  // Fix typo in URL (https:/ instead of https://)
  if (fixedUrl.startsWith('https:/') && !fixedUrl.startsWith('https://')) {
    fixedUrl = fixedUrl.replace('https:/', 'https://');
  }
  
  // Fix another common typo (https/:/ instead of https://)
  if (fixedUrl.startsWith('https/:/')) {
    fixedUrl = fixedUrl.replace('https/:/', 'https://');
  }
  
  // Ensure valid URL format for data URLs
  if (fixedUrl.startsWith('data:') && !fixedUrl.includes(';base64,')) {
    // Try to add the missing parts if it's a data URL with incorrect format
    if (fixedUrl.includes(',')) {
      const parts = fixedUrl.split(',');
      const mimeType = parts[0].replace('data:', '') || 'image/png';
      fixedUrl = `data:${mimeType};base64,${parts[1]}`;
    } else {
      // If it doesn't have a comma, it's likely just the base64 data without the prefix
      fixedUrl = `data:image/png;base64,${fixedUrl.replace('data:', '')}`;
    }
  }
  
  // Add cache busting parameter
  const timestamp = Date.now();
  
  // Don't add cache busting to data URLs
  if (fixedUrl.startsWith('data:')) {
    return fixedUrl;
  }
  
  // If URL already has query parameters, append cache busting parameter
  if (fixedUrl.includes('?')) {
    return `${fixedUrl}&t=${timestamp}`;
  }
  
  return `${fixedUrl}?t=${timestamp}`;
}

/**
 * Parse various image formats from the database or API responses
 */
export function parseImageData(imageData: any): string | null {
  if (!imageData) return null;
  
  try {
    // Case 1: Direct URL string
    if (typeof imageData === 'string') {
      // Check if it's JSON string
      if (imageData.startsWith('{') || imageData.startsWith('[')) {
        try {
          return parseImageData(JSON.parse(imageData));
        } catch (e) {
          console.warn('Failed to parse JSON image data:', e);
        }
      }
      
      // Regular URL or data URL
      return getCacheBustedUrl(imageData);
    }
    
    // Case 2: Object with URL property
    if (imageData.url) {
      return getCacheBustedUrl(imageData.url);
    }
    
    // Case 3: Object with data property
    if (imageData.data) {
      if (typeof imageData.data === 'string') {
        return getCacheBustedUrl(imageData.data);
      }
      return null;
    }
    
    // Case 4: Array of images, get the first one
    if (Array.isArray(imageData) && imageData.length > 0) {
      return parseImageData(imageData[0]);
    }
    
    // Last resort: stringify the object
    console.warn('Unknown image data format:', imageData);
    return null;
  } catch (e) {
    console.error('Error parsing image data:', e);
    return null;
  }
}

/**
 * Get image URL with cache buster parameter
 * This is an alias for compatibility with components using this function name
 */
export function getImageUrlWithCacheBuster(url: string | null): string {
  if (!url) return "/placeholder.svg";
  return getCacheBustedUrl(url);
}

/**
 * Renomme un fichier image dans un bucket Supabase
 * @param imageUrl URL actuelle de l'image
 * @param newName Nouveau nom à assigner au fichier
 * @returns Nouvelle URL publique ou null en cas d'échec
 */
export async function renameImageFile(
  imageUrl: string,
  newName: string
): Promise<string | null> {
  try {
    if (!imageUrl || !newName) {
      toast.error("URL de l'image ou nouveau nom manquant");
      return null;
    }

    // Extraire le bucket et le chemin du fichier actuel à partir de l'URL
    const urlObj = new URL(imageUrl);
    const pathParts = urlObj.pathname.split('/');
    
    // Le format du chemin devrait être /storage/v1/object/public/BUCKET_NAME/FILE_PATH
    // Nous devons extraire le bucket_name et file_path
    const storageParts = pathParts.findIndex(part => part === 'object');
    if (storageParts === -1 || pathParts.length < storageParts + 3) {
      console.error("Format d'URL non reconnu:", imageUrl);
      toast.error("Format d'URL d'image non reconnu");
      return null;
    }
    
    const bucketIndex = pathParts.findIndex(part => part === 'object') + 2;
    const bucketName = pathParts[bucketIndex];
    
    // Le chemin du fichier est tout ce qui vient après le nom du bucket
    const filePath = pathParts.slice(bucketIndex + 1).join('/');
    
    // Si nous ne pouvons pas trouver le bucket ou le chemin, abandonner
    if (!bucketName || !filePath) {
      console.error("Impossible d'extraire les informations de l'URL:", imageUrl);
      toast.error("Impossible d'analyser l'URL de l'image");
      return null;
    }
    
    console.log(`Bucket détecté: ${bucketName}, Chemin du fichier: ${filePath}`);
    
    // Extraire le dossier (le cas échéant) et l'extension de fichier
    const lastSlashIndex = filePath.lastIndexOf('/');
    const folderPath = lastSlashIndex !== -1 ? filePath.substring(0, lastSlashIndex) : '';
    const fileName = lastSlashIndex !== -1 ? filePath.substring(lastSlashIndex + 1) : filePath;
    
    const dotIndex = fileName.lastIndexOf('.');
    const extension = dotIndex !== -1 ? fileName.substring(dotIndex) : '';
    
    // Créer le nouveau nom de fichier avec l'extension préservée
    const sanitizedNewName = newName.replace(/[^a-zA-Z0-9.-]/g, '-') + extension;
    const newFilePath = folderPath ? `${folderPath}/${sanitizedNewName}` : sanitizedNewName;
    
    console.log(`Ancien chemin: ${filePath}, Nouveau chemin: ${newFilePath}`);
    
    // Télécharger d'abord le fichier existant
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(bucketName)
      .download(filePath);
    
    if (downloadError || !fileData) {
      console.error("Erreur lors du téléchargement du fichier:", downloadError);
      toast.error("Impossible de télécharger le fichier original");
      return null;
    }
    
    // Détecter le type MIME depuis l'extension
    const mimeType = extension.toLowerCase() === '.png' ? 'image/png' : 
                   extension.toLowerCase() === '.jpg' || extension.toLowerCase() === '.jpeg' ? 'image/jpeg' : 
                   extension.toLowerCase() === '.gif' ? 'image/gif' : 
                   extension.toLowerCase() === '.webp' ? 'image/webp' : 
                   'application/octet-stream';
    
    console.log(`Détection du type MIME: ${mimeType} pour l'extension ${extension}`);
    
    // Créer un nouveau fichier avec le type MIME correct
    const file = new File([fileData], sanitizedNewName, { type: mimeType });
    
    // Téléverser le fichier avec le nouveau nom
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(newFilePath, file, {
        contentType: mimeType,
        upsert: true
      });
    
    if (uploadError) {
      console.error("Erreur lors du téléversement du fichier avec le nouveau nom:", uploadError);
      toast.error("Échec du renommage du fichier");
      return null;
    }
    
    // Supprimer l'ancien fichier
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);
    
    if (deleteError) {
      console.warn("Erreur lors de la suppression de l'ancien fichier:", deleteError);
      // Ne pas échouer l'opération si la suppression échoue
    }
    
    // Obtenir l'URL publique du nouveau fichier
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(newFilePath);
    
    if (!urlData || !urlData.publicUrl) {
      toast.error("Impossible d'obtenir l'URL du fichier renommé");
      return null;
    }
    
    console.log(`Fichier renommé avec succès: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error) {
    console.error("Erreur lors du renommage du fichier:", error);
    toast.error("Erreur lors du renommage du fichier");
    return null;
  }
}

