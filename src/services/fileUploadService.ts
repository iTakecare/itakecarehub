
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Vérifie si un bucket existe et le crée s'il n'existe pas
 */
export const ensureBucket = async (bucketName: string): Promise<boolean> => {
  try {
    // Vérifier si le bucket existe
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
      console.error('Erreur lors de la vérification des buckets:', error);
      return false;
    }

    // Si le bucket existe, retourner true
    if (buckets.some(bucket => bucket.name === bucketName)) {
      return true;
    }

    // Si le bucket n'existe pas, le créer
    const { error: createError } = await supabase.storage.createBucket(bucketName, {
      public: true
    });

    if (createError) {
      if (createError.message.includes('already exists')) {
        return true;
      }
      console.error(`Erreur lors de la création du bucket ${bucketName}:`, createError);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Erreur lors de la vérification/création du bucket ${bucketName}:`, error);
    return false;
  }
};

/**
 * Upload une image dans un bucket
 */
export const uploadImage = async (
  file: File,
  bucketName: string,
  folderPath: string = ''
): Promise<{ url: string } | null> => {
  try {
    const bucketExists = await ensureBucket(bucketName);
    if (!bucketExists) {
      toast.error(`Le bucket ${bucketName} n'existe pas et n'a pas pu être créé`);
      return null;
    }

    // Générer un nom unique pour le fichier
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

    // Upload du fichier
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Erreur lors de l\'upload:', error);
      toast.error("Erreur lors de l'upload du fichier");
      return null;
    }

    // Récupérer l'URL publique
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return { url: data.publicUrl };
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    toast.error("Erreur lors de l'upload du fichier");
    return null;
  }
};

/**
 * Upload des fichiers dans un bucket
 */
export const uploadFiles = async (
  files: File[],
  bucketName: string,
  folderPath: string = ''
): Promise<{ urls: string[] }> => {
  const urls: string[] = [];

  for (const file of files) {
    const result = await uploadImage(file, bucketName, folderPath);
    if (result) {
      urls.push(result.url);
    }
  }

  return { urls };
};

/**
 * Supprime un fichier d'un bucket
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
      console.error('Erreur lors de la suppression:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    return false;
  }
};

/**
 * Liste les fichiers dans un bucket
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
      console.error('Erreur lors de la récupération des fichiers:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des fichiers:', error);
    return [];
  }
};
