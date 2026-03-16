import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { env } from "../config/env";

export const supabaseClient = createClient<Database>(
  env.supabaseUrl,
  env.supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
