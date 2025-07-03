import { supabase } from "@/integrations/supabase/client";

export interface Invoice {
  id: string;
  contract_id: string;
  company_id: string;
  leaser_name: string;
  external_invoice_id?: string;
  invoice_number?: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  generated_at?: string;
  sent_at?: string;
  paid_at?: string;
  due_date?: string;
  billing_data: any;
  integration_type: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyIntegration {
  id: string;
  company_id: string;
  integration_type: string;
  is_enabled: boolean;
  api_credentials: any;
  settings: any;
  created_at: string;
  updated_at: string;
}

// Vérifier si l'intégration Billit est configurée pour une entreprise
export const getBillitIntegration = async (companyId: string): Promise<CompanyIntegration | null> => {
  const { data, error } = await supabase
    .from('company_integrations')
    .select('*')
    .eq('company_id', companyId)
    .eq('integration_type', 'billit')
    .single();

  if (error) {
    console.error('Erreur lors de la récupération de l\'intégration Billit:', error);
    return null;
  }

  return data;
};

// Vérifier si tous les numéros de série sont remplis pour un contrat
export const areAllSerialNumbersComplete = (equipment: any[]): boolean => {
  if (!equipment || equipment.length === 0) return false;
  
  return equipment.every(item => 
    item.serial_number && 
    item.serial_number.trim() !== ''
  );
};

// Générer une facture via Billit
export const generateBillitInvoice = async (contractId: string, companyId: string) => {
  try {
    console.log('🚀 Génération facture Billit - contractId:', contractId, 'companyId:', companyId);
    
    const { data, error } = await supabase.functions.invoke('billit-integration', {
      body: {
        contractId,
        companyId
      }
    });

    console.log('📡 Réponse Edge Function:', { data, error });

    if (error) {
      console.error('❌ Erreur Edge Function:', error);
      throw new Error(`Erreur du serveur: ${error.message}`);
    }

    if (!data.success) {
      console.error('❌ Échec génération:', data);
      throw new Error(data.error || data.message || 'Erreur lors de la génération de la facture');
    }

    console.log('✅ Facture générée avec succès:', data.invoice);
    return data.invoice;
  } catch (error) {
    console.error('❌ Erreur lors de la génération de la facture:', error);
    throw error;
  }
};

// Tester l'intégration Billit
export const testBillitIntegration = async (companyId: string) => {
  try {
    console.log('🧪 Test intégration Billit pour companyId:', companyId);
    
    const { data, error } = await supabase.functions.invoke('billit-integration', {
      body: {
        companyId,
        testMode: true
      }
    });

    console.log('📊 Résultats test:', { data, error });

    if (error) {
      console.error('❌ Erreur test:', error);
      throw new Error(`Erreur du serveur: ${error.message}`);
    }

    return {
      success: data.success,
      results: data.test_results,
      message: data.message
    };
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    throw error;
  }
};

// Récupérer toutes les factures d'une entreprise
export const getCompanyInvoices = async (companyId?: string): Promise<Invoice[]> => {
  try {
    let targetCompanyId = companyId;
    
    // Si pas de companyId fourni, le récupérer depuis le profil utilisateur
    if (!targetCompanyId) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();
      
      if (profileError) {
        console.error('Erreur lors de la récupération du profil:', profileError);
        throw profileError;
      }
      
      targetCompanyId = profile?.company_id;
    }

    if (!targetCompanyId) {
      console.error('Aucun company_id trouvé');
      return [];
    }

    console.log('Récupération des factures pour company_id:', targetCompanyId);
    
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('company_id', targetCompanyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des factures:', error);
      throw error;
    }

    console.log('Factures récupérées:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('Erreur dans getCompanyInvoices:', error);
    throw error;
  }
};

// Récupérer les factures par statut
export const getInvoicesByStatus = async (companyId: string, status: string): Promise<Invoice[]> => {
  try {
    let targetCompanyId = companyId;
    
    // Si pas de companyId fourni, le récupérer depuis le profil utilisateur
    if (!targetCompanyId) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();
      
      if (profileError) {
        console.error('Erreur lors de la récupération du profil:', profileError);
        throw profileError;
      }
      
      targetCompanyId = profile?.company_id;
    }

    if (!targetCompanyId) {
      console.error('Aucun company_id trouvé');
      return [];
    }

    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('company_id', targetCompanyId)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des factures par statut:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Erreur dans getInvoicesByStatus:', error);
    throw error;
  }
};

// Mettre à jour le statut d'une facture
export const updateInvoiceStatus = async (invoiceId: string, status: string, paidAt?: string) => {
  const updateData: any = { status };
  
  if (status === 'paid' && paidAt) {
    updateData.paid_at = paidAt;
  }

  const { data, error } = await supabase
    .from('invoices')
    .update(updateData)
    .eq('id', invoiceId)
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la mise à jour de la facture:', error);
    throw error;
  }

  return data;
};

// Configurer l'intégration Billit pour une entreprise
export const setupBillitIntegration = async (
  companyId: string, 
  apiKey: string, 
  baseUrl: string, 
  billitCompanyId: string,
  settings: any = {}
) => {
  const { data, error } = await supabase
    .from('company_integrations')
    .upsert({
      company_id: companyId,
      integration_type: 'billit',
      is_enabled: true,
      api_credentials: {
        apiKey,
        baseUrl,
        companyId: billitCompanyId
      },
      settings
    }, {
      onConflict: 'company_id,integration_type'
    })
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la configuration de l\'intégration Billit:', error);
    throw error;
  }

  return data;
};

// Désactiver l'intégration Billit
export const disableBillitIntegration = async (companyId: string) => {
  const { error } = await supabase
    .from('company_integrations')
    .update({ is_enabled: false })
    .eq('company_id', companyId)
    .eq('integration_type', 'billit');

  if (error) {
    console.error('Erreur lors de la désactivation de l\'intégration Billit:', error);
    throw error;
  }
};

// Synchroniser les statuts des factures avec Billit
export const syncBillitInvoiceStatuses = async (companyId: string, invoiceId?: string) => {
  try {
    console.log('🔄 Synchronisation statuts Billit pour companyId:', companyId);
    
    const { data, error } = await supabase.functions.invoke('billit-sync-status', {
      body: {
        companyId,
        invoiceId
      }
    });

    if (error) {
      console.error('❌ Erreur synchronisation:', error);
      throw new Error(`Erreur du serveur: ${error.message}`);
    }

    if (!data.success) {
      console.error('❌ Échec synchronisation:', data);
      throw new Error(data.error || data.message || 'Erreur lors de la synchronisation');
    }

    console.log('✅ Synchronisation réussie:', data);
    return data;
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error);
    throw error;
  }
};

// Télécharger le PDF d'une facture depuis Billit
export const downloadBillitInvoicePdf = async (invoiceId: string) => {
  try {
    // Récupérer la facture avec son URL PDF
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('id, external_invoice_id, pdf_url, invoice_number, company_id')
      .eq('id', invoiceId)
      .single();

    if (error || !invoice) {
      throw new Error('Facture non trouvée');
    }

    if (!invoice.pdf_url) {
      // Essayer de synchroniser d'abord pour récupérer l'URL PDF
      await syncBillitInvoiceStatuses(invoice.company_id, invoiceId);
      
      // Récupérer à nouveau la facture
      const { data: updatedInvoice, error: updateError } = await supabase
        .from('invoices')
        .select('pdf_url, invoice_number')
        .eq('id', invoiceId)
        .single();

      if (updateError || !updatedInvoice?.pdf_url) {
        throw new Error('URL PDF non disponible pour cette facture');
      }

      // Ouvrir l'URL PDF dans un nouvel onglet
      window.open(updatedInvoice.pdf_url, '_blank');
      return updatedInvoice.invoice_number;
    }

    // Ouvrir l'URL PDF dans un nouvel onglet
    window.open(invoice.pdf_url, '_blank');
    return invoice.invoice_number;
  } catch (error) {
    console.error('Erreur lors du téléchargement du PDF Billit:', error);
    throw error;
  }
};

// Générer et télécharger le PDF d'une facture
export const generateAndDownloadInvoicePdf = async (invoiceId: string) => {
  const { downloadInvoicePdf } = await import('@/utils/invoicePdfGenerator');
  const { getCompanyInvoiceData } = await import('./invoiceCompanyService');
  
  try {
    // Récupérer la facture
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (error || !invoice) {
      throw new Error('Facture non trouvée');
    }

    // Récupérer les données de l'entreprise
    const companyInfo = await getCompanyInvoiceData(invoice.company_id);

    // Générer et télécharger le PDF
    const filename = await downloadInvoicePdf(invoice, companyInfo);
    return filename;
  } catch (error) {
    console.error('Erreur lors de la génération du PDF de facture:', error);
    throw error;
  }
};