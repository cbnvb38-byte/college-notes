import { createClient } from "@supabase/supabase-js";
import { Database } from "./types";

let supabaseInstance: any = null;
let currentGetToken: ((options?: { template?: string }) => Promise<string | null>) | null = null;

export const createClerkSupabaseClient = (
  getToken: (options?: { template?: string }) => Promise<string | null>
) => {
  currentGetToken = getToken;

  if (supabaseInstance) {
    return supabaseInstance;
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing.");
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.");
  }

  supabaseInstance = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        fetch: async (url, options = {}) => {
          const token = currentGetToken ? await currentGetToken() : null;
          const headers = new Headers(options.headers);
          if (token) {
            headers.set("Authorization", `Bearer ${token}`);
          }
          return fetch(url, { ...options, headers });
        },
      },
    }
  );

  return supabaseInstance;
};
