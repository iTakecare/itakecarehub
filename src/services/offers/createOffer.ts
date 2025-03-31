
import { supabase, adminSupabase } from "@/integrations/supabase/client";
import { OfferData } from "./types";

export const createOffer = async (offerData: OfferData) => {
  try {
    console.log("Creating offer with data:", offerData);
    
    // Création d'un objet propre avec uniquement les colonnes qui existent dans la base de données
    const dataToSend = {
      client_id: offerData.client_id,
      client_name: offerData.client_name,
      client_email: offerData.client_email,
      equipment_description: offerData.equipment_description,
      amount: offerData.amount,
      coefficient: offerData.coefficient,
      monthly_payment: offerData.monthly_payment,
      commission: offerData.commission,
      user_id: offerData.user_id === 'user-123' ? 
        '00000000-0000-0000-0000-000000000000' : offerData.user_id,
      type: offerData.type || 'admin_offer',
      workflow_status: offerData.workflow_status,
      status: offerData.workflow_status === 'draft' ? 'pending' : 'pending',
      remarks: offerData.remarks 
    };
    
    console.log("Sending data to database:", dataToSend);
    
    // Use adminSupabase for public client requests to bypass RLS
    const client = offerData.type === 'client_request' ? adminSupabase : supabase;
    
    const { data, error } = await client
      .from('offers')
      .insert(dataToSend)
      .select();
    
    if (error) {
      console.error("Error creating offer:", error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error("Error creating offer:", error);
    return { data: null, error };
  }
};
