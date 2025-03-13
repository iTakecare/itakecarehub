
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://cifbetjefyfocafanlhv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpZmJldGplZnlmb2NhZmFubGh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4NzgzODIsImV4cCI6MjA1NzQ1NDM4Mn0.B1-2XP0VVByxEq43KzoGml8W6z_XVtsh542BuiDm3Cw";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpZmJldGplZnlmb2NhZmFubGh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTg3ODM4MiwiZXhwIjoyMDU3NDU0MzgyfQ.39wjC_Ld_qXnExyLgCawiip5hBDfCY6Hkb1rktomIxk";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true, // Activer la persistance de session
    autoRefreshToken: true, // Activer le rafraîchissement automatique du token
    detectSessionInUrl: true, // Détecter la session dans l'URL après l'authentification
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
});

// Exporter l'URL et la clé de storage pour un usage direct
supabase.storageUrl = `${SUPABASE_URL}/storage/v1`;
supabase.supabaseKey = SUPABASE_PUBLISHABLE_KEY;

// Admin client that bypasses RLS policies - use with caution!
// Only use this in admin-specific functions or server-side contexts
export const adminSupabase = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false, // Ne pas persister la session pour le client admin
  },
});
