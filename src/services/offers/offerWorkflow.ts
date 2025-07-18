
import { supabase } from "@/integrations/supabase/client";
import { RequestInfoData } from "./types";

export const getWorkflowLogs = async (offerId: string): Promise<any[]> => {
  try {
    console.log("Fetching workflow logs for offer:", offerId);
    
    const { data, error } = await supabase
      .from('offer_workflow_logs')
      .select(`
        *,
        profiles:user_id (
          first_name, 
          last_name
        )
      `)
      .eq('offer_id', offerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching workflow logs:", error);
      return [];
    }

    console.log("Workflow logs fetched successfully:", data?.length || 0, "logs");
    return data || [];
  } catch (error) {
    console.error("Error fetching workflow logs:", error);
    return [];
  }
};

export const sendInfoRequest = async (data: RequestInfoData): Promise<boolean> => {
  try {
    console.log("Sending information request for offer:", data.offerId);
    console.log("Requested documents:", data.requestedDocs);
    
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      console.error("Error getting current user:", userError);
      return false;
    }
    
    // Journaliser la demande
    const { error: logError } = await supabase
      .from('offer_workflow_logs')
      .insert({
        offer_id: data.offerId,
        user_id: userData.user.id,
        previous_status: data.previousStatus,
        new_status: 'info_requested',
        reason: `Demande d'informations supplémentaires: ${data.requestedDocs.join(', ')}`
      });
      
    if (logError) {
      console.error("Error logging info request:", logError);
      return false;
    }
    
    // Mettre à jour l'état de l'offre
    const { error: updateError } = await supabase
      .from('offers')
      .update({ 
        workflow_status: 'info_requested',
        previous_status: data.previousStatus
      })
      .eq('id', data.offerId);
      
    if (updateError) {
      console.error("Error updating offer status for info request:", updateError);
      return false;
    }
    
    console.log("Info request sent successfully");
    return true;
  } catch (error) {
    console.error("Error sending info request:", error);
    return false;
  }
};

export const processInfoResponse = async (
  offerId: string,
  approve: boolean
): Promise<boolean> => {
  try {
    console.log(`Processing info response for offer ${offerId}: ${approve ? 'Approved' : 'Rejected'}`);
    
    // Récupérer le statut précédent
    const { data: offerData, error: fetchError } = await supabase
      .from('offers')
      .select('previous_status, workflow_status')
      .eq('id', offerId)
      .single();
      
    if (fetchError) {
      console.error("Error fetching offer data:", fetchError);
      throw fetchError;
    }
    
    // Déterminer le nouveau statut
    const newStatus = approve 
      ? 'leaser_review'  // Si approuvé, on passe directement à la validation bailleur
      : 'rejected';      // Sinon rejeté
    
    const previousStatus = offerData.workflow_status || 'info_requested';
    
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      console.error("Error getting current user:", userError);
      return false;
    }
    
    // Journaliser le changement
    const { error: logError } = await supabase
      .from('offer_workflow_logs')
      .insert({
        offer_id: offerId,
        user_id: userData.user.id,
        previous_status: previousStatus,
        new_status: newStatus,
        reason: approve 
          ? "Informations complémentaires acceptées" 
          : "Informations complémentaires insuffisantes"
      });
      
    if (logError) {
      console.error("Error logging status change:", logError);
      return false;
    }
    
    // Mettre à jour le statut
    const { error: updateError } = await supabase
      .from('offers')
      .update({ 
        workflow_status: newStatus,
        previous_status: null
      })
      .eq('id', offerId);
      
    if (updateError) {
      console.error("Error updating offer status:", updateError);
      return false;
    }
    
    console.log("Info response processed successfully");
    return true;
  } catch (error) {
    console.error("Error processing info response:", error);
    return false;
  }
};
