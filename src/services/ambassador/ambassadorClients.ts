
import { supabase } from "@/integrations/supabase/client";

/**
 * Récupère les clients d'un ambassadeur spécifique en utilisant la fonction sécurisée
 * Cette fonction contourne les problèmes RLS
 */
export const getAmbassadorClientsSecure = async (ambassadorId: string) => {
  try {
    console.log("🔒 getAmbassadorClientsSecure - Récupération pour ambassadeur:", ambassadorId);
    
    // Utiliser la fonction RPC sécurisée existante
    const { data, error } = await supabase.rpc('get_ambassador_clients_secure', {
      p_user_id: ambassadorId // Note: cette fonction attend un user_id, pas un ambassador_id
    });

    if (error) {
      console.error("❌ Erreur RPC get_ambassador_clients_secure:", error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log("⚠️ Aucun client trouvé pour cet ambassadeur via RPC");
      return [];
    }

    // Formatter les données pour correspondre au format attendu
    const formattedClients = data.map(client => ({
      id: client.client_id,
      name: client.client_name,
      email: client.client_email || '',
      company: client.client_company || '',
      companyName: client.client_company || '',
      phone: client.client_phone,
      address: client.client_address,
      city: client.client_city,
      postal_code: client.client_postal_code,
      country: client.client_country,
      vat_number: client.client_vat_number,
      notes: client.client_notes,
      status: client.client_status,
      created_at: new Date(client.client_created_at),
      updated_at: new Date(client.client_updated_at),
      user_id: client.client_user_id,
      has_user_account: client.client_has_user_account,
      company_id: client.client_company_id,
      ambassador: {
        id: ambassadorId,
        name: 'Ambassadeur' // On pourrait enrichir avec le nom réel si nécessaire
      }
    }));

    console.log("✅ Clients d'ambassadeur formatés:", formattedClients);
    return formattedClients;

  } catch (error) {
    console.error("❌ Exception dans getAmbassadorClientsSecure:", error);
    return [];
  }
};

/**
 * Récupère les clients d'un ambassadeur en utilisant l'ID de l'ambassadeur
 * Cette fonction fait le lien entre l'ID ambassadeur et l'ID utilisateur
 */
export const getClientsByAmbassadorId = async (ambassadorId: string) => {
  try {
    console.log("🔍 getClientsByAmbassadorId - Récupération pour ID ambassadeur:", ambassadorId);
    
    // D'abord, récupérer l'user_id de l'ambassadeur
    const { data: ambassadorData, error: ambassadorError } = await supabase
      .from('ambassadors')
      .select('user_id, name')
      .eq('id', ambassadorId)
      .single();

    if (ambassadorError || !ambassadorData) {
      console.error("❌ Erreur lors de la récupération de l'ambassadeur:", ambassadorError);
      return [];
    }

    if (!ambassadorData.user_id) {
      console.log("⚠️ Ambassadeur sans user_id associé");
      return [];
    }

    console.log("🔍 User ID trouvé pour l'ambassadeur:", ambassadorData.user_id);

    // Utiliser la fonction sécurisée avec l'user_id
    const { data, error } = await supabase.rpc('get_ambassador_clients_secure', {
      p_user_id: ambassadorData.user_id
    });

    if (error) {
      console.error("❌ Erreur RPC get_ambassador_clients_secure:", error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log("⚠️ Aucun client trouvé pour cet ambassadeur");
      return [];
    }

    // Formatter les données avec les informations de l'ambassadeur
    const formattedClients = data.map(client => ({
      id: client.client_id,
      name: client.client_name,
      email: client.client_email || '',
      company: client.client_company || '',
      companyName: client.client_company || '',
      phone: client.client_phone,
      address: client.client_address,
      city: client.client_city,
      postal_code: client.client_postal_code,
      country: client.client_country,
      vat_number: client.client_vat_number,
      notes: client.client_notes,
      status: client.client_status,
      created_at: new Date(client.client_created_at),
      updated_at: new Date(client.client_updated_at),
      user_id: client.client_user_id,
      has_user_account: client.client_has_user_account,
      company_id: client.client_company_id,
      ambassador: {
        id: ambassadorId,
        name: ambassadorData.name || 'Ambassadeur'
      }
    }));

    console.log("✅ Clients d'ambassadeur formatés via ID:", formattedClients);
    return formattedClients;

  } catch (error) {
    console.error("❌ Exception dans getClientsByAmbassadorId:", error);
    return [];
  }
};
