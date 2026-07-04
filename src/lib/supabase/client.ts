import { createClient } from "@supabase/supabase-js";

export const createClerkSupabaseClient = (getToken: () => Promise<string | null>) => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: async (url, options = {}) => {
          const token = await getToken();
          const headers = new Headers(options.headers);
          if (token) {
            headers.set("Authorization", `Bearer ${token}`);
          }
          return fetch(url, { ...options, headers });
        },
      },
    }
  );
};
