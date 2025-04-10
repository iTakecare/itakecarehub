import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { createContractFromOffer } from "../contractService";

export const deleteOffer = async (offerId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('offers')
      .delete()
      .eq('id', offerId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error("Error deleting offer:", error);
    return false;
  }
};

export const updateOfferStatus = async (
  offerId: string, 
  newStatus: string, 
  previousStatus: string | null,
  reason?: string
): Promise<boolean> => {
  try {
    console.log(`Updating offer ${offerId} from ${previousStatus || 'draft'} to ${newStatus} with reason: ${reason || 'Aucune'}`);

    // Vérifier que les statuts sont valides
    if (!newStatus) {
      throw new Error("Le nouveau statut est requis");
    }

    // Get the user for logging the change
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("Utilisateur non authentifié");
    }

    console.log("Authenticated user:", user.id);

    // First, log the status change
    // Ensure the previous status is never null for database constraints
    const safePreviousStatus = previousStatus || 'draft';
    
    const { data: logData, error: logError } = await supabase
      .from('offer_workflow_logs')
      .insert({
        offer_id: offerId,
        user_id: user.id,
        previous_status: safePreviousStatus,
        new_status: newStatus,
        reason: reason || null
      })
      .select();

    if (logError) {
      console.error("Erreur lors de l'enregistrement du log:", logError);
      throw new Error("Erreur lors de l'enregistrement du log");
    }
    
    console.log("Log created successfully:", logData);

    // Then, update the offer's workflow_status
    const { data: updateData, error: updateError } = await supabase
      .from('offers')
      .update({ workflow_status: newStatus })
      .eq('id', offerId)
      .select();
      
    if (updateError) {
      console.error("Erreur lors de la mise à jour du statut:", updateError);
      throw new Error("Erreur lors de la mise à jour du statut");
    }
    
    console.log("Offer status updated successfully:", updateData);

    // Si le statut est financed, créer automatiquement un contrat
    if (newStatus === 'financed') {
      try {
        // Récupérer les infos nécessaires pour créer le contrat
        const { data: offerData, error: offerDataError } = await supabase
          .from('offers')
          .select('*')
          .eq('id', offerId)
          .single();
        
        if (offerDataError || !offerData) {
          throw new Error("Impossible de récupérer les détails de l'offre");
        }
        
        // Récupérer le bailleur (ici, on utilise une valeur par défaut)
        const leaserName = "Grenke"; // Par défaut, devrait idéalement être récupéré depuis l'offre
        const leaserLogo = "https://logo.clearbit.com/grenke.com";
        
        const contractId = await createContractFromOffer(offerId, leaserName, leaserLogo);
        
        if (contractId) {
          console.log("Contrat créé avec l'ID:", contractId);
          
          // Marquer l'offre comme convertie en contrat
          const { error: conversionError } = await supabase
            .from('offers')
            .update({ converted_to_contract: true })
            .eq('id', offerId);
            
          if (conversionError) {
            console.error("Erreur lors de la mise à jour du statut de conversion:", conversionError);
          } else {
            toast.success("L'offre a été convertie en contrat");
          }
        }
      } catch (contractError) {
        console.error("Erreur lors de la création du contrat:", contractError);
        toast.error("L'offre a été marquée comme financée mais nous n'avons pas pu créer le contrat");
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error updating offer status:", error);
    return false;
  }
};

export const getWorkflowHistory = async (offerId: string) => {
  try {
    console.log("Fetching workflow history for offer:", offerId);
    
    // Obtenir les logs avec la relation profiles
    const { data: logsWithProfiles, error: profilesError } = await supabase
      .from('offer_workflow_logs')
      .select(`
        *,
        profiles:user_id (
          first_name, 
          last_name, 
          email, 
          avatar_url, 
          role
        )
      `)
      .eq('offer_id', offerId)
      .order('created_at', { ascending: false });
    
    if (profilesError) {
      console.error("Error fetching workflow logs with profiles:", profilesError);
      throw profilesError;
    }
    
    console.log("Workflow logs with profiles:", logsWithProfiles);
    
    // Si nous avons des logs avec des profiles, les retourner
    if (logsWithProfiles && logsWithProfiles.length > 0) {
      return logsWithProfiles;
    }
    
    // Si aucun log n'a été trouvé, essayer de récupérer les logs de base
    const { data: basicLogs, error: basicError } = await supabase
      .from('offer_workflow_logs')
      .select('*')
      .eq('offer_id', offerId)
      .order('created_at', { ascending: false });
    
    if (basicError) {
      console.error("Error fetching basic workflow logs:", basicError);
      throw basicError;
    }
    
    // Si nous n'avons pas de logs du tout
    if (!basicLogs || basicLogs.length === 0) {
      return [];
    }
    
    // Pour chaque log, essayer d'obtenir les informations du profil utilisateur
    const enhancedLogs = await Promise.all(
      basicLogs.map(async (log) => {
        try {
          // Essayer d'obtenir le profil utilisateur
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('first_name, last_name, email, avatar_url, role')
            .eq('id', log.user_id)
            .single();
          
          if (!profileError && profileData) {
            return {
              ...log,
              profiles: profileData
            };
          }
          
          // Si le profil n'a pas pu être récupéré, essayer d'obtenir les données utilisateur
          const { data: userData, error: userError } = await supabase
            .from('users') // Si une table users existe
            .select('email, full_name')
            .eq('id', log.user_id)
            .single();
          
          if (!userError && userData) {
            return {
              ...log,
              user_email: userData.email,
              user_name: userData.full_name
            };
          }
          
          // Utiliser un fallback si aucune autre information n'est disponible
          return {
            ...log,
            user_name: `Utilisateur (${log.user_id.substring(0, 6)})`
          };
        } catch (error) {
          console.warn("Error getting user details for log:", error);
          return log;
        }
      })
    );
    
    return enhancedLogs;
  } catch (error) {
    console.error("Error in getWorkflowHistory:", error);
    return [];
  }
};

export const getCompletedStatuses = async (offerId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('offer_workflow_logs')
      .select('new_status')
      .eq('offer_id', offerId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error("Error fetching completed statuses:", error);
      throw error;
    }
    
    // Extraire les statuts uniques dans l'ordre chronologique
    const uniqueStatuses = new Set<string>();
    data?.forEach(log => uniqueStatuses.add(log.new_status));
    
    return Array.from(uniqueStatuses);
  } catch (error) {
    console.error("Error in getCompletedStatuses:", error);
    return [];
  }
};
