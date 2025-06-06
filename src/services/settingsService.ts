
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SiteSettings {
  id?: number;
  site_name?: string;
  site_description?: string;
  company_name: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  logo_url?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Récupère les paramètres du site
 */
export const getSiteSettings = async (): Promise<SiteSettings | null> => {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .order('id', { ascending: true })
      .limit(1)
      .single();
    
    if (error) {
      console.error("Erreur lors de la récupération des paramètres:", error);
      return null;
    }
    
    return data as SiteSettings;
  } catch (error) {
    console.error("Exception lors de la récupération des paramètres:", error);
    return null;
  }
};

/**
 * Met à jour les paramètres du site
 */
export const updateSiteSettings = async (settings: Partial<SiteSettings>): Promise<boolean> => {
  try {
    // Récupérer l'ID actuel si on n'en a pas
    if (!settings.id) {
      const current = await getSiteSettings();
      if (current && current.id) {
        settings.id = current.id;
      } else {
        // Si pas de paramètres existants, en créer
        const { data, error } = await supabase
          .from('site_settings')
          .insert([{
            site_name: settings.site_name || 'Leazr',
            site_description: settings.site_description || 'Hub de gestion',
            company_name: settings.company_name,
            company_address: settings.company_address,
            company_phone: settings.company_phone,
            company_email: settings.company_email,
            logo_url: settings.logo_url
          }])
          .select()
          .single();
        
        if (error) {
          console.error("Erreur lors de la création des paramètres:", error);
          toast.error("Erreur lors de la création des paramètres");
          return false;
        }
        
        toast.success("Paramètres créés avec succès");
        return true;
      }
    }
    
    // Mise à jour des paramètres existants
    const { error } = await supabase
      .from('site_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString()
      })
      .eq('id', settings.id);
    
    if (error) {
      console.error("Erreur lors de la mise à jour des paramètres:", error);
      toast.error("Erreur lors de la mise à jour des paramètres");
      return false;
    }
    
    toast.success("Paramètres mis à jour avec succès");
    return true;
  } catch (error) {
    console.error("Exception lors de la mise à jour des paramètres:", error);
    toast.error("Erreur lors de la mise à jour des paramètres");
    return false;
  }
};
