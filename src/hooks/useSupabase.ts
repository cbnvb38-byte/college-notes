"use client";

import { useAuth } from "@clerk/nextjs";
import { useMemo } from "react";
import { createClerkSupabaseClient } from "@/lib/supabase/client";

export const useSupabase = () => {
  const { getToken } = useAuth();

  const supabase = useMemo(() => {
    return createClerkSupabaseClient(getToken);
  }, [getToken]);

  return supabase;
};
