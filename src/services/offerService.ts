
import { supabase } from "@/integrations/supabase/client";
import { Equipment } from "@/types/equipment";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { createContractFromOffer } from "./contractService";
import { RequestInfoData } from "@/services/requestInfoService";

const mockOffers = [
  {
    id: "1",
    client_name: "Entreprise ABC",
    amount: 25000,
    monthly_payment: 720,
    commission: 1250,
    status: "accepted",
    workflow_status: "client_approved",
    created_at: "2025-03-01T09:30:00Z",
    type: "admin_offer"
  },
  {
    id: "2",
    client_name: "Clinique Santé+",
    amount: 18500,
    monthly_payment: 540,
    commission: 925,
    status: "pending",
    workflow_status: "client_waiting",
    created_at: "2025-03-05T14:15:00Z",
    type: "admin_offer"
  },
  {
    id: "3",
    client_name: "Cabinet Dentaire Sourire",
    amount: 32000,
    monthly_payment: 910,
    commission: 1600,
    status: "rejected",
    workflow_status: "client_no_response",
    created_at: "2025-02-22T11:20:00Z",
    type: "admin_offer"
  },
  {
    id: "4",
    client_name: "Centre Imagerie Médicale",
    amount: 45000,
    monthly_payment: 1250,
    commission: 2250,
    status: "accepted",
    workflow_status: "leaser_approved",
    created_at: "2025-02-15T10:00:00Z",
    type: "admin_offer"
  }
];

export interface EquipmentItem {
  id: string;
  title: string;
  purchasePrice: number;
  quantity: number;
  margin: number;
}

export interface OfferData {
  client_name: string;
  client_email: string;
  client_id?: string;
  equipment_description?: string;
  equipment_text?: string;
  amount: number;
  coefficient: number;
  monthly_payment: number;
  commission: number;
  user_id: string;
  type?: string;
  remarks?: string;
}

export const createOffer = async (offerData: OfferData): Promise<string | null> => {
  try {
    console.log("Creating offer with data:", offerData);
    
    // Create a clean object without any fields that might not exist in the database
    const dataToSend = {
      client_id: offerData.client_id,
      client_name: offerData.client_name,
      client_email: offerData.client_email,
      equipment_description: offerData.equipment_description || offerData.equipment_text,
      amount: offerData.amount,
      coefficient: offerData.coefficient,
      monthly_payment: offerData.monthly_payment,
      commission: offerData.commission,
      user_id: offerData.user_id === 'user-123' ? 
        '00000000-0000-0000-0000-000000000000' : offerData.user_id,
      type: offerData.type || 'admin_offer',
      remarks: offerData.remarks
    };
    
    const { data, error } = await supabase
      .from('offers')
      .insert(dataToSend)
      .select();
    
    if (error) {
      console.error("Error creating offer:", error);
      throw error;
    }
    
    return data?.[0]?.id || null;
  } catch (error) {
    console.error("Error creating offer:", error);
    return null;
  }
};

export const getOffers = async (includeConverted: boolean = false): Promise<any[]> => {
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => {
        console.log("Timeout atteint, utilisation des données mockées");
        reject(new Error("Timeout lors de la récupération des offres"));
      }, 5000)
    );
    
    const fetchPromise = supabase
      .from('offers')
      .select('*, clients(name, email, company)')
      .eq('converted_to_contract', includeConverted ? false : false)
      .order('created_at', { ascending: false });
    
    const { data, error } = await Promise.race([
      fetchPromise,
      timeoutPromise,
    ]) as any;
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error("Error fetching offers:", error);
    const mockOffersWithType = mockOffers.map(offer => ({
      ...offer,
      type: 'admin_offer'
    }));
    return mockOffersWithType;
  }
};

export const getOffersByClientId = async (clientId: string): Promise<any[]> => {
  try {
    console.log("Fetching offers for client ID:", clientId);
    
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .eq('client_id', clientId)
      .eq('converted_to_contract', false)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    console.log(`Retrieved ${data?.length || 0} offers by client_id for client ${clientId}`);
    
    if (!data || data.length === 0) {
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('name, email')
        .eq('id', clientId)
        .single();
        
      if (clientError || !clientData) {
        console.error("Error fetching client details:", clientError);
        return [];
      }
      
      console.log("Looking for offers by client name/email:", clientData.name, clientData.email);
      
      const { data: nameOffers, error: nameError } = await supabase
        .from('offers')
        .select('*')
        .ilike('client_name', clientData.name)
        .eq('converted_to_contract', false)
        .order('created_at', { ascending: false });
        
      if (nameError) {
        console.error("Error fetching offers by name:", nameError);
        return [];
      }
      
      console.log(`Found ${nameOffers?.length || 0} offers by client_name`);
      
      let emailOffers: any[] = [];
      if (clientData.email) {
        const { data: emailData, error: emailError } = await supabase
          .from('offers')
          .select('*')
          .ilike('client_email', clientData.email)
          .eq('converted_to_contract', false)
          .order('created_at', { ascending: false });
          
        if (emailError) {
          console.error("Error fetching offers by email:", emailError);
        } else {
          emailOffers = emailData || [];
          console.log(`Found ${emailOffers.length} offers by client_email`);
        }
      }
      
      const combinedOffers = [...(nameOffers || []), ...emailOffers];
      const uniqueOffers = combinedOffers.filter((offer, index, self) =>
        index === self.findIndex((o) => o.id === offer.id)
      );
      
      console.log(`Found ${uniqueOffers.length} unique offers in total`);
      
      for (const offer of uniqueOffers) {
        const { error: updateError } = await supabase
          .from('offers')
          .update({ client_id: clientId })
          .eq('id', offer.id);
          
        if (updateError) {
          console.error(`Error updating offer ${offer.id}:`, updateError);
        } else {
          console.log(`Updated client_id for offer ${offer.id}`);
        }
      }
      
      return uniqueOffers;
    }
    
    return data;
  } catch (error) {
    console.error("Error fetching offers by client ID:", error);
    toast.error("Erreur lors de la récupération des offres du client");
    return [];
  }
};

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
  previousStatus: string,
  reason?: string
): Promise<boolean> => {
  try {
    console.log(`Updating offer ${offerId} from ${previousStatus} to ${newStatus} with reason: ${reason || 'Aucune'}`);

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
    const { data: logData, error: logError } = await supabase
      .from('offer_workflow_logs')
      .insert({
        offer_id: offerId,
        user_id: user.id,
        previous_status: previousStatus,
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

    // If the status is approved by the leaser, convert it to a contract
    if (newStatus === 'leaser_approved') {
      try {
        const leaserName = "Grenke";
        const leaserLogo = "https://logo.clearbit.com/grenke.com";
        
        const contractId = await createContractFromOffer(offerId, leaserName, leaserLogo);
        
        if (contractId) {
          console.log("Contrat créé avec l'ID:", contractId);
          
          // Mark the offer as converted to contract
          const { error } = await supabase
            .from('offers')
            .update({ converted_to_contract: true })
            .eq('id', offerId);
            
          if (error) {
            console.error("Erreur lors de la mise à jour du statut de conversion:", error);
          }
        }
      } catch (contractError) {
        console.error("Erreur lors de la création du contrat:", contractError);
        toast.error("L'offre a été approuvée mais nous n'avons pas pu créer le contrat");
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error updating offer status:", error);
    return false;
  }
};

export const getWorkflowLogs = async (offerId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('offer_workflow_logs')
      .select(`
        *,
        profiles:user_id (first_name, last_name, email, avatar_url)
      `)
      .eq('offer_id', offerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching workflow logs:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching workflow logs:", error);
    return [];
  }
};

export const createClientRequest = async (requestData: OfferData): Promise<string | null> => {
  try {
    const validData = {
      ...requestData,
      type: 'client_request',
      status: 'pending',
      workflow_status: 'client_waiting',
      user_id: requestData.user_id === 'user-123' ? 
        '00000000-0000-0000-0000-000000000000' : requestData.user_id
    };
    
    const { data, error } = await supabase
      .from('offers')
      .insert(validData)
      .select();
    
    if (error) throw error;
    
    return data?.[0]?.id || null;
  } catch (error) {
    console.error("Error creating client request:", error);
    return null;
  }
};

export const getOfferById = async (offerId: string) => {
  try {
    const { data, error } = await supabase
      .from('offers')
      .select(`
        *,
        clients:client_id (
          id, 
          name, 
          email, 
          company
        )
      `)
      .eq('id', offerId)
      .single();

    if (error) {
      console.error('Error fetching offer:', error);
      return null;
    }

    if (data && data.equipment_description) {
      try {
        // Better parsing of equipment data with explicit type conversion
        const equipmentData = JSON.parse(data.equipment_description);
        console.log("Parsed equipment data:", equipmentData);
        
        // Ensure all numeric values are properly parsed as numbers
        if (Array.isArray(equipmentData)) {
          data.equipment_data = equipmentData.map(item => ({
            ...item,
            purchasePrice: parseFloat(item.purchasePrice) || 0,
            quantity: parseInt(item.quantity, 10) || 1,
            margin: parseFloat(item.margin) || 20,
            monthlyPayment: parseFloat(item.monthlyPayment || 0)
          }));
        } else {
          data.equipment_data = equipmentData;
        }
        
        console.log("Processed equipment data with preserved values:", data.equipment_data);
      } catch (e) {
        console.log("Equipment description is not valid JSON:", data.equipment_description);
      }
    }

    return data;
  } catch (error) {
    console.error('Error fetching offer:', error);
    return null;
  }
};

export const updateOffer = async (offerId: string, offerData: any) => {
  try {
    const dataToSend = { ...offerData };
    
    if (dataToSend.remarks !== undefined) {
      dataToSend.additional_info = dataToSend.remarks;
      delete dataToSend.remarks;
    }
    
    if (dataToSend.equipment_text) {
      if (!dataToSend.equipment_description) {
        dataToSend.equipment_description = dataToSend.equipment_text;
      }
      delete dataToSend.equipment_text;
    }
    
    const { data, error } = await supabase
      .from('offers')
      .update(dataToSend)
      .eq('id', offerId);

    if (error) {
      console.error('Error updating offer:', error);
      throw error;
    }

    return offerId;
  } catch (error) {
    console.error('Error updating offer:', error);
    return null;
  }
};

// Ajouter une fonction pour envoyer une demande d'informations
export const sendInfoRequest = async (data: RequestInfoData): Promise<boolean> => {
  try {
    console.log("Sending information request for offer:", data.offerId);
    console.log("Requested documents:", data.requestedDocs);
    
    // Journaliser la demande
    const { error: logError } = await supabase
      .from('offer_workflow_logs')
      .insert({
        offer_id: data.offerId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
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
    
    // Dans une implémentation réelle, nous enverrions un email ici
    // via une fonction Supabase Edge ou un service d'emailing
    
    return true;
  } catch (error) {
    console.error("Error sending info request:", error);
    return false;
  }
};

// Traiter la réponse après réception des informations
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
    
    // Journaliser le changement
    const { error: logError } = await supabase
      .from('offer_workflow_logs')
      .insert({
        offer_id: offerId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
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
    
    return true;
  } catch (error) {
    console.error("Error processing info response:", error);
    return false;
  }
};
