import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { createContractFromOffer } from "../contractService";

export const deleteOffer = async (offerId: string): Promise<boolean> => {
  try {
    console.log(`Tentative de suppression de l'offre: ${offerId}`);
    
    // Vérifier si l'offre a été convertie en contrat
    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .select('converted_to_contract, workflow_status')
      .eq('id', offerId)
      .single();
    
    if (offerError) {
      console.error("Erreur lors de la vérification de l'offre:", offerError);
      throw new Error("Impossible de vérifier l'état de l'offre");
    }
    
    // Si l'offre a été convertie en contrat (et potentiellement a le statut "financed")
    if (offer?.converted_to_contract) {
      console.log("L'offre a été convertie en contrat, recherche du contrat associé");
      
      // Rechercher le contrat associé à cette offre
      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .select('id')
        .eq('offer_id', offerId)
        .single();
      
      if (contractError && contractError.code !== 'PGRST116') { // PGRST116 = not found
        console.error("Erreur lors de la recherche du contrat associé:", contractError);
      }
      
      // Si un contrat est trouvé, demander confirmation supplémentaire
      if (contract) {
        console.log(`Contrat associé trouvé: ${contract.id}`);
        
        // Pour cette modification, nous allons simplement permettre la suppression
        // sans supprimer le contrat associé, car cela pourrait être dangereux
        
        // Mettre à jour le contrat pour supprimer la référence à l'offre
        const { error: updateError } = await supabase
          .from('contracts')
          .update({ offer_id: null })
          .eq('id', contract.id);
        
        if (updateError) {
          console.error("Erreur lors de la mise à jour du contrat:", updateError);
          // On continue même en cas d'erreur, pour essayer de supprimer l'offre
        } else {
          console.log("Référence à l'offre supprimée du contrat");
        }
      }
    }
    
    // Supprimer d'abord les logs associés à l'offre
    const { error: logsError } = await supabase
      .from('offer_workflow_logs')
      .delete()
      .eq('offer_id', offerId);
    
    if (logsError) {
      console.error("Erreur lors de la suppression des logs de l'offre:", logsError);
      // On continue même en cas d'erreur, pour essayer de supprimer l'offre
    }
    
    // Supprimer ensuite les demandes d'information associées
    const { error: infoRequestsError } = await supabase
      .from('offer_info_requests')
      .delete()
      .eq('offer_id', offerId);
    
    if (infoRequestsError) {
      console.error("Erreur lors de la suppression des demandes d'information:", infoRequestsError);
      // On continue même en cas d'erreur, pour essayer de supprimer l'offre
    }
    
    // Supprimer ensuite les notes associées
    const { error: notesError } = await supabase
      .from('offer_notes')
      .delete()
      .eq('offer_id', offerId);
    
    if (notesError) {
      console.error("Erreur lors de la suppression des notes de l'offre:", notesError);
      // On continue même en cas d'erreur, pour essayer de supprimer l'offre
    }
    
    // Finalement, supprimer l'offre elle-même
    const { error } = await supabase
      .from('offers')
      .delete()
      .eq('id', offerId);
    
    if (error) {
      console.error("Erreur lors de la suppression de l'offre:", error);
      throw error;
    }
    
    console.log("Offre supprimée avec succès");
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
