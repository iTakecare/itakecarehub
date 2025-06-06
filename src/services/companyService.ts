
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Module {
  id: string;
  slug: string;
  name: string;
  description?: string;
  is_core: boolean;
  price?: number;
}

export interface Plan {
  name: string;
  price: number;
  description: string;
  features: string[];
  popular?: boolean;
  modules_limit: number;
  users_limit: number;
}

export const PLANS: Record<string, Plan> = {
  starter: {
    name: 'Starter',
    price: 49,
    description: 'Parfait pour débuter',
    features: ['1 module inclus', '1 utilisateur', 'Support email'],
    modules_limit: 1,
    users_limit: 1
  },
  pro: {
    name: 'Pro',
    price: 149,
    description: 'Pour les équipes qui grandissent',
    features: ['Jusqu\'à 3 modules', '5 utilisateurs', 'Support prioritaire', 'Intégrations avancées'],
    popular: true,
    modules_limit: 3,
    users_limit: 5
  },
  business: {
    name: 'Business',
    price: 299,
    description: 'Pour les grandes organisations',
    features: ['Tous les modules', '10 utilisateurs', 'Support dédié', 'Personnalisation avancée'],
    modules_limit: -1, // illimité
    users_limit: 10
  }
};

export const getAvailableModules = async (): Promise<Module[]> => {
  console.log('Récupération des modules disponibles...');
  
  // Modules par défaut si la base de données n'est pas accessible
  const defaultModules: Module[] = [
    { id: '1', slug: 'calculator', name: 'Calculateur Leasing', is_core: true },
    { id: '2', slug: 'catalog', name: 'Catalogue Produits', is_core: true },
    { id: '3', slug: 'crm', name: 'CRM Client', is_core: true },
    { id: '4', slug: 'ai_assistant', name: 'Assistant IA', is_core: false },
    { id: '5', slug: 'fleet_generator', name: 'Générateur de Parc', is_core: false },
    { id: '6', slug: 'contracts', name: 'Contrats', is_core: false },
    { id: '7', slug: 'support', name: 'SAV & Support', is_core: false }
  ];

  try {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .order('name');
    
    if (error) {
      console.warn('Erreur lors de la récupération des modules:', error);
      return defaultModules;
    }
    
    return data || defaultModules;
  } catch (error) {
    console.warn('Erreur de connexion pour récupérer les modules:', error);
    return defaultModules;
  }
};

export const calculatePrice = (plan: string, selectedModules: Module[]): number => {
  const basePlan = PLANS[plan as keyof typeof PLANS];
  if (!basePlan) return 0;
  
  let totalPrice = basePlan.price;
  
  // Ajouter le prix des modules additionnels non-core
  selectedModules.forEach(module => {
    if (!module.is_core && module.price) {
      totalPrice += module.price;
    }
  });
  
  return totalPrice;
};

interface CreateCompanyParams {
  companyName: string;
  adminEmail: string;
  adminPassword: string;
  adminFirstName: string;
  adminLastName: string;
  plan: string;
  selectedModules: string[];
}

export const createCompanyWithAdmin = async (params: CreateCompanyParams) => {
  console.log('Création de l\'entreprise:', params);
  
  try {
    // Étape 1: Créer l'utilisateur admin avec les métadonnées
    console.log('Étape 1: Création de l\'utilisateur admin...');
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: params.adminEmail,
      password: params.adminPassword,
      options: {
        data: {
          first_name: params.adminFirstName,
          last_name: params.adminLastName,
          role: 'admin'
        }
      }
    });

    if (authError) {
      console.error('Erreur lors de la création de l\'utilisateur:', authError);
      throw new Error(`Erreur d'authentification: ${authError.message}`);
    }

    if (!authData.user) {
      console.error('Aucun utilisateur créé');
      throw new Error('Erreur lors de la création de l\'utilisateur');
    }

    console.log('Utilisateur créé avec succès:', authData.user.id);

    // Étape 2: Créer l'entreprise
    console.log('Étape 2: Création de l\'entreprise...');
    
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .insert([{
        name: params.companyName,
        admin_user_id: authData.user.id,
        subscription_plan: params.plan,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (companyError) {
      console.error('Erreur lors de la création de l\'entreprise:', companyError);
      
      // Nettoyer l'utilisateur créé en cas d'erreur
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
      } catch (cleanupError) {
        console.error('Erreur lors du nettoyage:', cleanupError);
      }
      
      throw new Error(`Erreur lors de la création de l'entreprise: ${companyError.message}`);
    }

    console.log('Entreprise créée avec succès:', companyData.id);

    // Étape 3: Associer les modules sélectionnés
    console.log('Étape 3: Association des modules...');
    
    if (params.selectedModules.length > 0) {
      const moduleAssociations = params.selectedModules.map(moduleSlug => ({
        company_id: companyData.id,
        module_slug: moduleSlug,
        is_active: true,
        created_at: new Date().toISOString()
      }));

      const { error: modulesError } = await supabase
        .from('company_modules')
        .insert(moduleAssociations);

      if (modulesError) {
        console.warn('Erreur lors de l\'association des modules:', modulesError);
        // Ne pas faire échouer la création pour les modules
      } else {
        console.log('Modules associés avec succès');
      }
    }

    return {
      success: true,
      companyId: companyData.id,
      userId: authData.user.id
    };

  } catch (error) {
    console.error('Erreur lors de la création de l\'entreprise:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
};
