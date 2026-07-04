import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export const createServerSupabaseClient = async () => {
  const { getToken } = await auth();
  const token = await getToken();

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    }
  );
};
