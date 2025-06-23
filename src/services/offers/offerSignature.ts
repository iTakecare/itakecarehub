
import { supabase } from "@/integrations/supabase/client";

export const generateSignatureLink = (offerId: string): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/offer/${offerId}`;
};

export const isOfferSigned = (offer: any): boolean => {
  return !!(offer.signature_data && offer.signed_at);
};

export const getOfferForClient = async (offerId: string) => {
  try {
    console.log("🔍 Fetching offer for client by ID:", offerId);
    
    const { data, error } = await supabase
      .from('offers')
      .select('*, clients(name, email, company)')
      .eq('id', offerId)
      .single();
    
    if (error) {
      console.error("❌ Error fetching offer for client:", error);
      return null;
    }
    
    console.log("✅ Offer fetched successfully for client:", data);
    return data;
  } catch (error) {
    console.error("❌ Error in getOfferForClient:", error);
    return null;
  }
};

export const saveOfferSignature = async (
  offerId: string,
  signatureData: string,
  signerName: string,
  signerIp?: string
) => {
  try {
    console.log("💾 Saving signature for offer:", offerId);
    
    const { data, error } = await supabase
      .from('offers')
      .update({
        signature_data: signatureData,
        signer_name: signerName,
        signed_at: new Date().toISOString(),
        signer_ip: signerIp,
        workflow_status: 'signed'
      })
      .eq('id', offerId)
      .select()
      .single();

    if (error) {
      console.error("❌ Error saving signature:", error);
      throw error;
    }

    console.log("✅ Signature saved successfully:", data);
    return { data, error: null };
  } catch (error) {
    console.error("❌ Error in saveOfferSignature:", error);
    return { data: null, error };
  }
};
