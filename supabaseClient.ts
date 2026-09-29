import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tkozhbrqabhzdkmwhgwf.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrb3poYnJxYWJoemRrbXdoZ3dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NzkzMTcsImV4cCI6MjA4ODU1NTMxN30.Hv-BWvhCylH-J3S2PMOJIyuNtzhWVTczOcVSHF564Xo';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Create client with fallback configuration
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
