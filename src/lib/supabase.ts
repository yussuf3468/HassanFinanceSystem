import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️ Supabase environment variables not configured. Please update .env.local with your Supabase credentials."
  );
  console.warn(
    "Required variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
  );
}

// Use placeholder values if not configured to prevent app crash
const defaultUrl = supabaseUrl || "https://placeholder.supabase.co";
const defaultKey = supabaseAnonKey || "placeholder-key";

export const supabase = createClient<Database>(defaultUrl, defaultKey);
