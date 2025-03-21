import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

// Définition du schéma pour les données d'ambassadeur
export const ambassadorSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Veuillez entrer un email valide"),
  phone: z.string().min(5, "Veuillez entrer un numéro de téléphone valide").optional(),
  status: z.enum(["active", "inactive"]).optional(),
  notes: z.string().optional(),
  region: z.string().optional(),
  company: z.string().optional(),
  vat_number: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
  commission_level_id: z.string().uuid().optional()
});

// Type des données du formulaire d'ambassadeur
export type AmbassadorFormValues = z.infer<typeof ambassadorSchema>;

// Type complet d'un ambassadeur avec ID et données additionnelles
export interface Ambassador {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  notes?: string;
  region?: string;
  company?: string;
  vat_number?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  created_at?: string;
  updated_at?: string;
  clients_count?: number;
  commissions_total?: number;
  last_commission?: number;
  commission_level_id?: string;
  has_user_account?: boolean;
  user_account_created_at?: string;
  user_id?: string;
}

// Récupérer tous les ambassadeurs
export const getAmbassadors = async (): Promise<Ambassador[]> => {
  try {
    const { data, error } = await supabase
      .from("ambassadors")
      .select("*")
      .order("name");

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching ambassadors:", error);
    return [];
  }
};

// Récupérer un ambassadeur par son ID
export const getAmbassadorById = async (id: string): Promise<Ambassador | null> => {
  try {
    const { data, error } = await supabase
      .from("ambassadors")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    console.log(`Ambassadeur récupéré avec succès. ID: ${id}, Barème: ${data.commission_level_id}`);
    return data;
  } catch (error) {
    console.error(`Error fetching ambassador with ID ${id}:`, error);
    throw error;
  }
};

// Créer un nouvel ambassadeur
export const createAmbassador = async (
  ambassadorData: AmbassadorFormValues
): Promise<Ambassador> => {
  try {
    const { data, error } = await supabase
      .from("ambassadors")
      .insert([ambassadorData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating ambassador:", error);
    throw error;
  }
};

// Mettre à jour un ambassadeur existant
export const updateAmbassador = async (
  id: string,
  ambassadorData: AmbassadorFormValues
): Promise<void> => {
  try {
    console.log(`[updateAmbassador] Début de la mise à jour pour l'ambassadeur ${id}`);
    console.log(`[updateAmbassador] Données à mettre à jour:`, ambassadorData);
    
    // Extraire commission_level_id des données générales
    const { commission_level_id, ...updateData } = ambassadorData;
    
    // Mise à jour des données générales de l'ambassadeur
    const { error: updateError } = await supabase
      .from("ambassadors")
      .update(updateData)
      .eq("id", id);
      
    if (updateError) {
      console.error(`[updateAmbassador] Erreur lors de la mise à jour des données générales:`, updateError);
      throw updateError;
    }
    
    // Si un ID de barème est fourni, mettre à jour séparément
    if (commission_level_id) {
      await updateAmbassadorCommissionLevel(id, commission_level_id);
    }
    
    console.log(`[updateAmbassador] Mise à jour terminée avec succès pour l'ambassadeur ${id}`);
  } catch (error) {
    console.error(`[updateAmbassador] Erreur générale:`, error);
    throw error;
  }
};

// Supprimer un ambassadeur
export const deleteAmbassador = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase.from("ambassadors").delete().eq("id", id);

    if (error) throw error;
  } catch (error) {
    console.error(`Error deleting ambassador with ID ${id}:`, error);
    throw error;
  }
};

// Obtenir les statistiques des ambassadeurs
export const getAmbassadorStats = async (id: string) => {
  try {
    // Obtenir le nombre de clients
    const { count: clientsCount, error: clientsError } = await supabase
      .from("ambassador_clients")
      .select("client_id", { count: "exact" })
      .eq("ambassador_id", id);

    if (clientsError) throw clientsError;

    // Obtenir le total des commissions
    const { data: commissions, error: commissionsError } = await supabase
      .from("ambassador_commissions")
      .select("amount")
      .eq("ambassador_id", id);

    if (commissionsError) throw commissionsError;

    const totalCommissions = commissions.reduce(
      (sum, commission) => sum + (parseFloat(commission.amount) || 0),
      0
    );

    // Obtenir la dernière commission
    const { data: lastCommission, error: lastCommissionError } = await supabase
      .from("ambassador_commissions")
      .select("amount")
      .eq("ambassador_id", id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (lastCommissionError) throw lastCommissionError;

    return {
      clientsCount: clientsCount || 0,
      totalCommissions,
      lastCommissionAmount: lastCommission.length > 0 ? lastCommission[0].amount : 0,
    };
  } catch (error) {
    console.error(`Error fetching stats for ambassador ${id}:`, error);
    return {
      clientsCount: 0,
      totalCommissions: 0,
      lastCommissionAmount: 0,
    };
  }
};

// Obtenir tous les clients d'un ambassadeur
export const getAmbassadorClients = async (ambassadorId: string) => {
  try {
    const { data, error } = await supabase
      .from("ambassador_clients")
      .select("client_id, clients(*)")
      .eq("ambassador_id", ambassadorId);

    if (error) throw error;

    // Transformer les données pour extraire seulement les informations du client
    return data.map((item) => item.clients) || [];
  } catch (error) {
    console.error(`Error fetching clients for ambassador ${ambassadorId}:`, error);
    return [];
  }
};

// Obtenir toutes les commissions d'un ambassadeur
export const getAmbassadorCommissions = async (ambassadorId: string) => {
  try {
    const { data, error } = await supabase
      .from("ambassador_commissions")
      .select("*")
      .eq("ambassador_id", ambassadorId)
      .order("date", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error fetching commissions for ambassador ${ambassadorId}:`, error);
    return [];
  }
};

// Fonction spécifique pour mettre à jour le barème de commissionnement avec gestion améliorée
export const updateAmbassadorCommissionLevel = async (ambassadorId: string, levelId: string): Promise<void> => {
  try {
    console.log(`[updateAmbassadorCommissionLevel] DÉBUT - Mise à jour du barème pour l'ambassadeur ${ambassadorId} vers ${levelId}`);
    
    // Effectuer plusieurs tentatives de mise à jour (jusqu'à 3 fois)
    let success = false;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (!success && attempts < maxAttempts) {
      attempts++;
      console.log(`[updateAmbassadorCommissionLevel] Tentative ${attempts}/${maxAttempts}`);
      
      // Utiliser un UPDATE explicite avec un timestamp unique pour éviter les problèmes de cache
      const timestamp = new Date().toISOString();
      const { error } = await supabase
        .from('ambassadors')
        .update({ 
          commission_level_id: levelId,
          updated_at: timestamp
        })
        .eq('id', ambassadorId);
      
      if (error) {
        console.error(`[updateAmbassadorCommissionLevel] Erreur pendant la mise à jour (tentative ${attempts}):`, error);
        
        // Pause courte entre les tentatives
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 300));
          continue;
        } else {
          throw new Error(`Impossible de mettre à jour le barème après ${maxAttempts} tentatives: ${error.message}`);
        }
      }
      
      // Attendre un court instant pour permettre la propagation de la mise à jour
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Vérification de la mise à jour
      const { data: verifyData, error: verifyError } = await supabase
        .from("ambassadors")
        .select("commission_level_id, updated_at")
        .eq("id", ambassadorId)
        .single();
        
      if (verifyError) {
        console.error(`[updateAmbassadorCommissionLevel] Erreur lors de la vérification (tentative ${attempts}):`, verifyError);
        
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 300));
          continue;
        } else {
          throw verifyError;
        }
      }
      
      // Vérifier si la mise à jour a été effectuée correctement
      if (verifyData.commission_level_id === levelId) {
        console.log(`[updateAmbassadorCommissionLevel] Mise à jour réussie du barème à la tentative ${attempts}. Vérifié: ${verifyData.commission_level_id}, timestamp: ${verifyData.updated_at}`);
        success = true;
        break;
      } else {
        console.warn(`[updateAmbassadorCommissionLevel] La mise à jour n'a pas été appliquée à la tentative ${attempts}. Attendu: ${levelId}, Reçu: ${verifyData.commission_level_id}`);
        
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 500)); // Pause plus longue entre les tentatives
        } else {
          throw new Error(`La mise à jour du barème n'a pas été appliquée correctement après ${maxAttempts} tentatives. Niveau actuel: ${verifyData.commission_level_id}`);
        }
      }
    }
    
    if (!success) {
      throw new Error(`Échec de la mise à jour du barème après ${maxAttempts} tentatives`);
    }
    
  } catch (error) {
    console.error(`[updateAmbassadorCommissionLevel] ERREUR CRITIQUE:`, error);
    throw error;
  }
};

