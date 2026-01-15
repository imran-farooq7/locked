// lib/supabase/client.ts - Updated for SSR
import { createBrowserClient } from "@supabase/ssr";
import { Database } from "../database.types";

export const createSupabaseClient = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
};
