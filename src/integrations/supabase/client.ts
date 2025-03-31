
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://cifbetjefyfocafanlhv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpZmJldGplZnlmb2NhZmFubGh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4NzgzODIsImV4cCI6MjA1NzQ1NDM4Mn0.B1-2XP0VVByxEq43KzoGml8W6z_XVtsh542BuiDm3Cw";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpZmJldGplZnlmb2NhZmFubGh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTg3ODM4MiwiZXhwIjoyMDU3NDU0MzgyfQ.39wjC_Ld_qXnExyLgCawiip5hBDfCY6Hkb1rktomIxk";

// Create a singleton instance for the public client
let supabaseInstance = null;

// Function to get supabase client with anon key
export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    });
  }
  return supabaseInstance;
};

// Function to get admin supabase client with service role key
let adminSupabaseInstance = null;

export const getAdminSupabaseClient = () => {
  if (!adminSupabaseInstance) {
    adminSupabaseInstance = createClient<Database>(
      SUPABASE_URL, 
      SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false
        }
      }
    );
  }
  return adminSupabaseInstance;
};

// For backwards compatibility
export const supabase = getSupabaseClient();

// Export storage URL and key properly as constants instead of properties
export const STORAGE_URL = `${SUPABASE_URL}/storage/v1`;
export const SUPABASE_KEY = SUPABASE_PUBLISHABLE_KEY;

// Export constants for use in other modules
export { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SERVICE_ROLE_KEY };
