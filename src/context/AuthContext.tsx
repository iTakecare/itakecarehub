
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

// Define the extended user type with role
interface ExtendedUser extends User {
  role?: string | null;
  partner_id?: string | null;
  ambassador_id?: string | null;
  client_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  company?: string | null;
}

// Define the auth context type
export interface AuthContextType {
  user: ExtendedUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  role: string | null;
  isLoading: boolean;
  userRoleChecked: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, data?: any) => Promise<{error: Error | null}>;
  setRole: (role: string | null) => void;
  setUser: (user: ExtendedUser | null) => void;
  isAdmin: () => boolean;
  isClient: () => boolean;
  isPartner: () => boolean;
  isAmbassador: () => boolean;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isAuthenticated: false,
  role: null,
  isLoading: true,
  userRoleChecked: false,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  signUp: async () => ({ error: null }),
  setRole: () => {},
  setUser: () => {},
  isAdmin: () => false,
  isClient: () => false,
  isPartner: () => false,
  isAmbassador: () => false,
});

// Define the provider props type
interface AuthProviderProps {
  children: ReactNode;
}

// Create the provider component
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRoleChecked, setUserRoleChecked] = useState(false);

  useEffect(() => {
    // Check for an active session on initial load
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error checking session:', error);
        setSession(null);
        setUser(null);
        setRole(null);
      } else if (session) {
        setSession(session);
        setUser(session.user as ExtendedUser);
      }
      
      setLoading(false);
      setUserRoleChecked(true);
    };
    
    checkSession();
    
    // Set up listener for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`Auth state changed: ${event}`, session);
        setSession(session);
        setUser(session?.user as ExtendedUser || null);
        
        if (event === 'SIGNED_OUT') {
          setRole(null);
        }
        
        setUserRoleChecked(true);
      }
    );
    
    // Clean up the listener on unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Sign in error:', error);
        return { error };
      }
      
      setSession(data.session);
      setUser(data.user as ExtendedUser);
      
      return { error: null };
    } catch (error) {
      console.error('Exception during sign in:', error);
      return { error: error as Error };
    }
  };
  
  // Sign up function
  const signUp = async (email: string, password: string, userData?: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData || {}
        }
      });
      
      if (error) {
        console.error('Sign up error:', error);
        return { error };
      }
      
      return { error: null };
    } catch (error) {
      console.error('Exception during sign up:', error);
      return { error: error as Error };
    }
  };
  
  // Sign out function
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        toast.error('Erreur lors de la déconnexion');
      } else {
        setUser(null);
        setSession(null);
        setRole(null);
      }
    } catch (error) {
      console.error('Exception during sign out:', error);
    }
  };
  
  // Role checking functions
  const isAdmin = () => {
    return role === 'admin';
  };
  
  const isClient = () => {
    return role === 'client';
  };
  
  const isPartner = () => {
    return role === 'partner';
  };
  
  const isAmbassador = () => {
    return role === 'ambassador';
  };
  
  // The value to be provided to consumers of this context
  const value: AuthContextType = {
    user,
    session,
    isAuthenticated: !!user,
    role,
    isLoading: loading,
    userRoleChecked,
    signIn,
    signOut,
    signUp,
    setRole,
    setUser,
    isAdmin,
    isClient,
    isPartner,
    isAmbassador,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
