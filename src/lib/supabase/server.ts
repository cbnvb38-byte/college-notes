import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "./types";

export const createServerSupabaseClient = async () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing.");
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.");
  }

  const { getToken } = await auth();
  const token = await getToken({ template: "supabase" });

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    }
  );
};
