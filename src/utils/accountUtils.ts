
import { supabase, adminSupabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Utility function to delete a specific user account
 * Used for admin purposes to clean up problematic accounts
 */
export const deleteSpecificUserAccount = async (userId: string): Promise<void> => {
  try {
    if (!userId) {
      toast.error("L'identifiant utilisateur est requis");
      return;
    }
    
    // First try to update related entities to remove user_id references
    const tables = ['clients', 'partners', 'ambassadors'];
    
    for (const table of tables) {
      const { error: updateError } = await supabase
        .from(table)
        .update({
          user_id: null,
          has_user_account: false,
          user_account_created_at: null
        })
        .eq('user_id', userId);
      
      if (updateError) {
        console.error(`Erreur lors de la mise à jour de ${table}:`, updateError);
        // Continue with deletion process even if this fails
      } else {
        console.log(`Association utilisateur supprimée dans ${table}`);
      }
    }
    
    // Try to delete profile record directly (this might bypass the constraint issue)
    const { error: deleteProfileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
      
    if (deleteProfileError) {
      console.error("Erreur lors de la suppression du profil:", deleteProfileError);
      toast.error(`Erreur lors de la suppression du profil: ${deleteProfileError.message}`);
    } else {
      console.log("Profil supprimé avec succès");
    }
    
    // Try to delete the user with adminSupabase
    const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(
      userId
    );
    
    if (deleteError) {
      console.error("Erreur lors de la suppression de l'utilisateur:", deleteError);
      toast.error(`Erreur: ${deleteError.message}`);
      
      // Try with execute_sql as a last resort if supported
      try {
        const { error: sqlError } = await supabase.rpc(
          'execute_sql',
          { sql: `DELETE FROM auth.users WHERE id = '${userId}'` }
        );
        
        if (sqlError) {
          console.error("Erreur lors de l'exécution SQL:", sqlError);
        } else {
          toast.success("Utilisateur supprimé avec succès via SQL");
        }
      } catch (sqlExecError) {
        console.error("Erreur lors de l'exécution SQL:", sqlExecError);
      }
    } else {
      toast.success("Compte utilisateur supprimé avec succès");
    }
  } catch (error) {
    console.error("Erreur dans deleteSpecificUserAccount:", error);
    toast.error("Erreur lors de la suppression du compte utilisateur");
  }
};

/**
 * Execute the deletion of the specific user with the provided ID
 * This function is specific to the user asked to be deleted
 */
export const deleteSpecificProblemUser = async (): Promise<void> => {
  const specificUserId = "658bd63c-08d8-428a-9c22-eeeca753dd73";
  await deleteSpecificUserAccount(specificUserId);
};
