import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Helper to determine if we should run in mock mode
export const isMockMode = 
  !supabaseUrl || 
  supabaseUrl.includes('your-supabase-project') || 
  !supabaseAnonKey || 
  supabaseAnonKey.includes('your-supabase-anon-key');

if (isMockMode) {
  console.warn('Supabase URL or Key is missing or using placeholders. Running in client-side Mock Storage mode.');
}

export const supabase = isMockMode 
  ? null 
  : createClient(supabaseUrl, supabaseAnonKey);
