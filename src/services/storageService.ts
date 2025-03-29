import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * S'assure qu'un bucket de stockage existe et est configuré correctement
 * @param bucketName Le nom du bucket à vérifier/créer
 * @returns Promise<boolean> Vrai si le bucket existe ou a été créé avec succès
 */
export async function ensureStorageBucket(bucketName: string): Promise<boolean> {
  try {
    console.log(`Vérification/création du bucket de stockage: ${bucketName}`);
    
    // Cache des buckets existants pour éviter des appels répétés
    if ((window as any).__existingBuckets && (window as any).__existingBuckets[bucketName]) {
      console.log(`Le bucket ${bucketName} existe déjà (depuis le cache)`);
      return true;
    }
    
    // 1. Vérifier si le bucket existe déjà en tentant de lister son contenu
    try {
      const { data, error } = await supabase.storage.from(bucketName).list();
      
      if (!error) {
        console.log(`Le bucket ${bucketName} existe déjà et est accessible`);
        // Mettre en cache pour les appels futurs
        if (typeof window !== "undefined") {
          (window as any).__existingBuckets = (window as any).__existingBuckets || {};
          (window as any).__existingBuckets[bucketName] = true;
        }
        return true;
      } else {
        console.log(`Erreur lors de l'accès au bucket ${bucketName}:`, error);
      }
    } catch (e) {
      console.warn(`Exception lors de la vérification du bucket: ${e}`);
    }
    
    // 2. Essayer de créer le bucket directement
    try {
      console.log(`Tentative de création du bucket ${bucketName}`);
      
      const { data, error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 52428800 // 50MB
      });
      
      if (createError) {
        // Si l'erreur indique que le bucket existe déjà, c'est bon
        if (createError.message && createError.message.includes('already exists')) {
          console.log(`Le bucket ${bucketName} existe déjà (détecté via erreur de création)`);
          if (typeof window !== "undefined") {
            (window as any).__existingBuckets = (window as any).__existingBuckets || {};
            (window as any).__existingBuckets[bucketName] = true;
          }
          return true;
        }
        
        console.error(`Échec de la création directe du bucket ${bucketName}: ${createError.message}`);
        return false;
      }
      
      console.log(`Bucket ${bucketName} créé avec succès`);
      if (typeof window !== "undefined") {
        (window as any).__existingBuckets = (window as any).__existingBuckets || {};
        (window as any).__existingBuckets[bucketName] = true;
      }
      
      return true;
    } catch (error) {
      console.error(`Exception lors de la création directe du bucket ${bucketName}:`, error);
      return false;
    }
  } catch (error) {
    console.error(`Erreur générale dans ensureStorageBucket pour ${bucketName}:`, error);
    return false;
  }
}

/**
 * Obtient une URL d'image avec cache-busting
 */
export function getImageUrlWithCacheBuster(url: string | null): string {
  if (!url) return "/placeholder.svg";
  
  try {
    // Nettoyer l'URL en supprimant les paramètres existants
    const baseUrl = url.split('?')[0];
    
    // Ajouter un timestamp comme paramètre de cache-busting
    return `${baseUrl}?t=${Date.now()}`;
  } catch (error) {
    console.error("Erreur lors de la génération de l'URL avec cache-busting:", error);
    return url;
  }
}

/**
 * Détecte le type MIME à partir de l'extension de fichier
 */
function detectMimeType(extension: string): string {
  switch (extension.toLowerCase()) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'svg':
      return 'image/svg+xml';
    case 'bmp':
      return 'image/bmp';
    default:
      return 'image/jpeg';  // Fallback
  }
}

import { supabase, STORAGE_URL, SUPABASE_KEY } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * S'assure qu'un bucket de stockage existe et est configuré correctement
 * @param bucketName Le nom du bucket à vérifier/créer
 * @returns Promise<boolean> Vrai si le bucket existe ou a été créé avec succès
 */
export async function ensureStorageBucket(bucketName: string): Promise<boolean> {
  try {
    console.log(`Vérification/création du bucket de stockage: ${bucketName}`);
    
    // Cache des buckets existants pour éviter des appels répétés
    if ((window as any).__existingBuckets && (window as any).__existingBuckets[bucketName]) {
      console.log(`Le bucket ${bucketName} existe déjà (depuis le cache)`);
      return true;
    }
    
    // 1. Vérifier si le bucket existe déjà
    try {
      const { data: existingBuckets, error: bucketError } = await supabase
        .storage
        .listBuckets();
      
      if (bucketError) {
        console.error(`Erreur lors de la vérification des buckets:`, bucketError);
      } else {
        const bucketExists = existingBuckets?.some(bucket => bucket.name === bucketName);
        
        if (bucketExists) {
          console.log(`Le bucket ${bucketName} existe déjà`);
          // Mettre en cache pour les appels futurs
          if (typeof window !== "undefined") {
            (window as any).__existingBuckets = (window as any).__existingBuckets || {};
            (window as any).__existingBuckets[bucketName] = true;
          }
          return true;
        }
      }
    } catch (e) {
      console.warn(`Exception lors de la vérification des buckets: ${e}`);
    }
    
    // 2. Essayer via la fonction RPC create_storage_bucket
    try {
      console.log(`Tentative de création via la fonction RPC create_storage_bucket`);
      const { data: rpcData, error: rpcError } = await supabase.rpc('create_storage_bucket', { 
        bucket_name: bucketName 
      });
      
      if (!rpcError) {
        console.log(`Bucket ${bucketName} créé avec succès via RPC`);
        if (typeof window !== "undefined") {
          (window as any).__existingBuckets = (window as any).__existingBuckets || {};
          (window as any).__existingBuckets[bucketName] = true;
        }
        return true;
      } else {
        console.error(`Erreur lors de l'appel à la fonction RPC:`, rpcError);
      }
    } catch (rpcCallError) {
      console.warn(`Exception lors de l'appel à la fonction RPC: ${rpcCallError}`);
    }
    
    // 3. Essayer via l'edge function create-storage-bucket
    try {
      console.log(`Tentative de création via l'edge function create-storage-bucket`);
      const { data, error } = await supabase.functions.invoke('create-storage-bucket', {
        body: { bucket_name: bucketName }
      });
      
      if (error) {
        console.error(`Erreur lors de l'appel à la fonction create-storage-bucket:`, error);
      } else if (data?.success) {
        console.log(`Bucket ${bucketName} créé avec succès via edge function`);
        if (typeof window !== "undefined") {
          (window as any).__existingBuckets = (window as any).__existingBuckets || {};
          (window as any).__existingBuckets[bucketName] = true;
        }
        return true;
      } else if (data?.message?.includes('already exists')) {
        console.log(`Le bucket ${bucketName} existe déjà (signalé par edge function)`);
        if (typeof window !== "undefined") {
          (window as any).__existingBuckets = (window as any).__existingBuckets || {};
          (window as any).__existingBuckets[bucketName] = true;
        }
        return true;
      }
    } catch (functionError) {
      console.warn(`Exception lors de l'appel à l'edge function: ${functionError}`);
    }
    
    // 4. Dernière tentative: création directe via l'API Supabase
    try {
      console.log(`Tentative de création directe du bucket ${bucketName}`);
      
      const { data, error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 52428800 // 50MB
      });
      
      if (createError) {
        if (createError.message && createError.message.includes('already exists')) {
          console.log(`Le bucket ${bucketName} existe déjà (détecté via erreur de création)`);
          if (typeof window !== "undefined") {
            (window as any).__existingBuckets = (window as any).__existingBuckets || {};
            (window as any).__existingBuckets[bucketName] = true;
          }
          return true;
        }
        
        console.error(`Échec de la création directe du bucket ${bucketName}: ${createError.message}`);
        
        // Try with adminSupabase as a last resort
        try {
          const { adminSupabase } = await import('@/integrations/supabase/client');
          const { error: adminError } = await adminSupabase.storage.createBucket(bucketName, {
            public: true
          });
          
          if (!adminError) {
            console.log(`Bucket ${bucketName} créé avec succès via admin API`);
            if (typeof window !== "undefined") {
              (window as any).__existingBuckets = (window as any).__existingBuckets || {};
              (window as any).__existingBuckets[bucketName] = true;
            }
            return true;
          } else if (adminError.message?.includes('already exists')) {
            console.log(`Le bucket ${bucketName} existe déjà (via admin API)`);
            if (typeof window !== "undefined") {
              (window as any).__existingBuckets = (window as any).__existingBuckets || {};
              (window as any).__existingBuckets[bucketName] = true;
            }
            return true;
          } else {
            console.error(`Échec de la création via admin API: ${adminError.message}`);
          }
        } catch (adminError) {
          console.error(`Exception lors de la création via admin API: ${adminError}`);
        }
        
        return false;
      }
      
      console.log(`Bucket ${bucketName} créé avec succès via API directe`);
      if (typeof window !== "undefined") {
        (window as any).__existingBuckets = (window as any).__existingBuckets || {};
        (window as any).__existingBuckets[bucketName] = true;
      }
      
      // Create public access policies
      try {
        await supabase.rpc('create_storage_policy', {
          bucket_name: bucketName,
          policy_name: `${bucketName}_public_select`,
          definition: 'TRUE',
          policy_type: 'SELECT'
        });
        
        await supabase.rpc('create_storage_policy', {
          bucket_name: bucketName,
          policy_name: `${bucketName}_public_insert`,
          definition: 'TRUE',
          policy_type: 'INSERT'
        });
        
        await supabase.rpc('create_storage_policy', {
          bucket_name: bucketName,
          policy_name: `${bucketName}_public_update`,
          definition: 'TRUE',
          policy_type: 'UPDATE'
        });
        
        await supabase.rpc('create_storage_policy', {
          bucket_name: bucketName,
          policy_name: `${bucketName}_public_delete`,
          definition: 'TRUE',
          policy_type: 'DELETE'
        });
        
        console.log(`Created public access policies for bucket ${bucketName}`);
      } catch (policyError) {
        console.error("Failed to create policies (continuing anyway):", policyError);
      }
      
      return true;
    } catch (error) {
      console.error(`Exception lors de la création directe du bucket ${bucketName}:`, error);
      return false;
    }
  } catch (error) {
    console.error(`Erreur générale dans ensureStorageBucket pour ${bucketName}:`, error);
    return false;
  }
}

/**
 * Méthode simplifiée pour télécharger et stocker une image
 * @param imageUrl URL de l'image à télécharger
 * @param bucketName Nom du bucket Supabase
 * @param folder Dossier optionnel dans le bucket
 * @returns URL de l'image stockée ou null en cas d'erreur
 */
export async function downloadAndStoreImage(imageUrl: string, bucketName: string, folder: string = ''): Promise<string | null> {
  try {
    if (!imageUrl) return null;
    console.log(`Téléchargement d'image depuis: ${imageUrl}`);
    
    // Vérifier que le bucket existe
    const bucketExists = await ensureStorageBucket(bucketName);
    if (!bucketExists) {
      console.error(`Le bucket ${bucketName} n'existe pas et n'a pas pu être créé`);
      toast.error(`Erreur: Le bucket ${bucketName} n'a pas pu être créé`);
      return null;
    }
    
    // Extraire le nom du fichier et l'extension de l'URL
    const urlParts = imageUrl.split('/');
    let fileName = urlParts[urlParts.length - 1];
    fileName = fileName.split('?')[0]; // Supprimer les paramètres de requête
    
    // Générer un nom unique pour éviter les collisions
    const timestamp = Date.now();
    const fileNameWithoutExt = fileName.split('.').slice(0, -1).join('.').replace(/[^a-zA-Z0-9]/g, '-');
    const fileExt = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    const uniqueFileName = `${fileNameWithoutExt}-${timestamp}.${fileExt}`;
    const filePath = folder ? `${folder}/${uniqueFileName}` : uniqueFileName;
    
    // Télécharger l'image avec timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      const response = await fetch(imageUrl, { 
        signal: controller.signal,
        headers: { 'Accept': 'image/*' }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Erreur lors du téléchargement: ${response.status} ${response.statusText}`);
      }
      
      // Vérifier le type de contenu
      const contentType = response.headers.get('content-type');
      console.log(`Type de contenu: ${contentType}`);
      
      if (contentType && contentType.includes('application/json')) {
        console.error('Réponse JSON reçue au lieu d\'une image');
        toast.error("Le serveur a renvoyé du JSON au lieu d'une image");
        return null;
      }
      
      // Obtenir le blob et forcer le type MIME correct
      const arrayBuffer = await response.arrayBuffer();
      let mimeType = contentType || `image/${fileExt}`;
      
      // S'assurer que le type MIME est correct
      if (!mimeType.startsWith('image/')) {
        mimeType = detectMimeType(fileExt);
      }
      
      console.log(`Utilisation du type MIME: ${mimeType}`);
      const blob = new Blob([arrayBuffer], { type: mimeType });
      
      // Upload vers Supabase
      console.log(`Upload vers ${bucketName}/${filePath}`);
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, blob, {
          contentType: mimeType,
          upsert: true
        });
      
      if (error) {
        console.error(`Erreur lors de l'upload: ${error.message}`);
        toast.error("Erreur lors de l'upload de l'image");
        return null;
      }
      
      // Obtenir l'URL publique
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      
      console.log(`Image téléchargée avec succès: ${publicUrlData.publicUrl}`);
      return publicUrlData.publicUrl;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error(`Erreur lors du téléchargement: ${fetchError}`);
      toast.error("Erreur lors du téléchargement de l'image");
      return null;
    }
  } catch (error) {
    console.error(`Erreur générale dans downloadAndStoreImage:`, error);
    toast.error("Erreur lors du traitement de l'image");
    return null;
  }
}

/**
 * Obtient une URL d'image avec cache-busting
 */
export function getImageUrlWithCacheBuster(url: string | null): string {
  if (!url) return "/placeholder.svg";
  
  try {
    // Nettoyer l'URL en supprimant les paramètres existants
    const baseUrl = url.split('?')[0];
    
    // Ajouter un timestamp comme paramètre de cache-busting
    return `${baseUrl}?t=${Date.now()}`;
  } catch (error) {
    console.error("Erreur lors de la génération de l'URL avec cache-busting:", error);
    return url;
  }
}

/**
 * Détecte le type MIME à partir de l'extension de fichier
 */
function detectMimeType(extension: string): string {
  switch (extension.toLowerCase()) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'svg':
      return 'image/svg+xml';
    case 'bmp':
      return 'image/bmp';
    default:
      return 'image/jpeg';  // Fallback
  }
}

/**
 * Vérifie la connexion au stockage Supabase
 */
export const checkStorageConnection = async (): Promise<boolean> => {
  try {
    // Essayer de lister les buckets pour vérifier la connexion
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error("Erreur lors de la vérification de la connexion au stockage:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Exception lors de la vérification de la connexion au stockage:", error);
    return false;
  }
};

/**
 * Réinitialise la connexion au stockage
 */
export const resetStorageConnection = async (): Promise<boolean> => {
  try {
    // Essayer de créer le bucket 'product-images' via Edge Function
    try {
      const response = await fetch('/api/create-storage-bucket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bucketName: 'product-images' }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Résultat de la création du bucket:", result);
        return true;
      }
    } catch (error) {
      console.error("Erreur lors de la connexion à l'Edge Function:", error);
    }

    // Vérifier si le bucket existe
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error("Erreur lors de la réinitialisation de la connexion au stockage:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Exception lors de la réinitialisation de la connexion au stockage:", error);
    return false;
  }
};

/**
 * Tente de créer un bucket s'il n'existe pas
 */
export const createBucketIfNotExists = async (bucketName: string): Promise<boolean> => {
  try {
    // Vérifier si le bucket existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error("Erreur lors de la vérification des buckets:", listError);
      return false;
    }
    
    // Si le bucket existe déjà, retourner true
    if (buckets.some(bucket => bucket.name === bucketName)) {
      return true;
    }
    
    // Essayer de créer le bucket via Edge Function
    try {
      const response = await fetch('/api/create-storage-bucket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bucketName }),
      });

      if (response.ok) {
        return true;
      }
    } catch (error) {
      console.error("Erreur lors de l'appel à l'Edge Function:", error);
    }

    // Si l'Edge Function échoue, essayer de créer directement
    const { error: createError } = await supabase.storage.createBucket(bucketName, {
      public: true
    });
    
    if (createError) {
      console.error(`Erreur lors de la création du bucket ${bucketName}:`, createError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Erreur lors de la création du bucket ${bucketName}:`, error);
    return false;
  }
};

/**
 * Alias for backwards compatibility
 */
export const ensureBucket = createBucketIfNotExists;

/**
 * Upload a file to a bucket
 */
export const uploadFile = async (
  bucketName: string,
  file: File,
  filePath: string
): Promise<string | null> => {
  try {
    // Upload the file
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error(`Error uploading file to ${bucketName}/${filePath}:`, error);
      return null;
    }

    // Get the public URL
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error(`Exception uploading file to ${bucketName}/${filePath}:`, error);
    return null;
  }
};

/**
 * List files in a bucket or folder
 */
export const listFiles = async (
  bucketName: string,
  folderPath: string = ''
): Promise<any[]> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(folderPath);

    if (error) {
      console.error(`Error listing files in ${bucketName}/${folderPath}:`, error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error(`Exception listing files in ${bucketName}/${folderPath}:`, error);
    return [];
  }
};

/**
 * Delete a file from a bucket
 */
export const deleteFile = async (
  bucketName: string,
  filePath: string
): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.error(`Error deleting file ${bucketName}/${filePath}:`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Exception deleting file ${bucketName}/${filePath}:`, error);
    return false;
  }
};

/**
 * Obtient une URL d'image avec cache-busting
 */
export function getImageUrlWithCacheBuster(url: string | null): string {
  if (!url) return "/placeholder.svg";
  
  try {
    // Nettoyer l'URL en supprimant les paramètres existants
    const baseUrl = url.split('?')[0];
    
    // Ajouter un timestamp comme paramètre de cache-busting
    return `${baseUrl}?t=${Date.now()}`;
  } catch (error) {
    console.error("Erreur lors de la génération de l'URL avec cache-busting:", error);
    return url;
  }
}

/**
 * Détecte le type MIME à partir de l'extension de fichier
 */
function detectMimeType(extension: string): string {
  switch (extension.toLowerCase()) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'svg':
      return 'image/svg+xml';
    case 'bmp':
      return 'image/bmp';
    default:
      return 'image/jpeg';  // Fallback
  }
}
