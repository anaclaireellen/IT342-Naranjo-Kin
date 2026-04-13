import { createClient } from '@supabase/supabase-js';

// Project URL derived from your Project ID: himriwatwjoabvpzzjim
const supabaseUrl = 'https://himriwatwjoabvpzzjim.supabase.co';

// This is your 'anon' public key from your API Keys screenshot
const supabaseAnonKey = 'sb_publishable_avQuq9snkFnPG6yODahc2A_-nziyS3H'; 

// SINGLETON PATTERN: Ensuring only one instance of the Supabase client exists
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
