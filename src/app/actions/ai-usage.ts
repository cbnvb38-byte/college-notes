"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { getMonthlyLimitForPlan, UserPlan, resolveUserPlan } from "@/lib/ai/premium";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function makeClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

const isDev = process.env.NODE_ENV === "development";

function getCurrentMonthString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export interface UserAIUsage {
  plan: UserPlan;
  monthlyLimit: number;
  usedThisMonth: number;
  premiumStatus?: string;
  isPremiumActive?: boolean;
  isPremiumExpired?: boolean;
  isPremiumEndingSoon?: boolean;
  premiumExpiresAt?: string | null;
}

/**
 * Get the current user's plan and AI usage for the UI.
 */
export async function getUserAIUsage(): Promise<
  { success: true; data: UserAIUsage } | { success: false; error: string }
> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized." };
    }

    const supabase = makeClient();

    // Get user plan
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("plan, premium_status, premium_expires_at")
      .eq("id", userId)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("[ai-usage] getUserAIUsage (profile):", profileError);
      return { success: false, error: "Failed to fetch profile plan." };
    }

    const {
      effectivePlan: plan,
      limit: monthlyLimit,
      premiumStatus,
      isPremiumActive,
      isPremiumExpired,
      isPremiumEndingSoon,
      premiumExpiresAt,
    } = resolveUserPlan(profileData);
    
    const currentMonth = getCurrentMonthString();

    // Get current month usage
    const { data: usageData, error: usageError } = await supabase
      .from("ai_usage")
      .select("generations_count")
      .eq("user_id", userId)
      .eq("usage_month", currentMonth)
      .single();

    if (usageError && usageError.code !== "PGRST116") {
      console.error("[ai-usage] getUserAIUsage (usage):", usageError);
      return { success: false, error: "Failed to fetch AI usage." };
    }

    const usedThisMonth = usageData?.generations_count || 0;

    return {
      success: true,
      data: {
        plan,
        monthlyLimit,
        usedThisMonth,
        premiumStatus,
        isPremiumActive,
        isPremiumExpired,
        isPremiumEndingSoon,
        premiumExpiresAt,
      },
    };
  } catch (error: any) {
    console.error("[ai-usage] getUserAIUsage catch:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}

/**
 * Enforce AI limits before calling Gemini.
 * Do not call Gemini if this returns limitReached: true.
 */
export async function checkAILimitBeforeGeneration(userId: string): Promise<{
  success: boolean;
  limitReached: boolean;
  error?: string;
  errorMessage?: string;
}> {
  try {
    const supabase = makeClient();

    // Get user plan
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("plan, premium_status, premium_expires_at")
      .eq("id", userId)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("[ai-usage] check limit (profile):", profileError);
      return { success: false, limitReached: false, error: "Failed to verify plan." };
    }

    const { effectivePlan: plan, limit: monthlyLimit } = resolveUserPlan(profileData);
    const currentMonth = getCurrentMonthString();

    // Get current month usage
    const { data: usageData, error: usageError } = await supabase
      .from("ai_usage")
      .select("generations_count")
      .eq("user_id", userId)
      .eq("usage_month", currentMonth)
      .single();

    if (usageError && usageError.code !== "PGRST116") {
      console.error("[ai-usage] check limit (usage):", usageError);
      return { success: false, limitReached: false, error: "Failed to verify usage." };
    }

    const usedThisMonth = usageData?.generations_count || 0;

    if (isDev) {
      console.log(`[AI Usage Check] userId: ${userId} | plan: ${plan} | used: ${usedThisMonth} | limit: ${monthlyLimit} | generationType: check`);
    }

    if (usedThisMonth >= monthlyLimit) {
      const errorMessage = plan === "premium" 
        ? "You have reached your premium monthly AI limit for this month."
        : "You have reached your free monthly AI limit. Upgrade to Premium for more generations.";
      
      return { success: true, limitReached: true, errorMessage };
    }

    return { success: true, limitReached: false };
  } catch (error: any) {
    console.error("[ai-usage] checkAILimitBeforeGeneration catch:", error);
    return { success: false, limitReached: false, error: "An unexpected error occurred checking limit." };
  }
}

/**
 * Increment the AI usage count after a successful Gemini generation AND save.
 */
export async function incrementAIUsageAfterSuccess(userId: string, generationId?: string, generationType?: string): Promise<void> {
  try {
    const supabase = makeClient();
    const currentMonth = getCurrentMonthString();

    // UPSERT the usage for this month
    const { data: existingUsage, error: selectError } = await supabase
      .from("ai_usage")
      .select("id, generations_count")
      .eq("user_id", userId)
      .eq("usage_month", currentMonth)
      .single();

    if (selectError && selectError.code !== "PGRST116") {
      console.error("[ai-usage] incrementAIUsageAfterSuccess select:", selectError);
      return;
    }

    if (existingUsage) {
      const { error: updateError } = await supabase
        .from("ai_usage")
        .update({ generations_count: existingUsage.generations_count + 1 })
        .eq("id", existingUsage.id);

      if (updateError) {
        console.error("[ai-usage] incrementAIUsageAfterSuccess update:", updateError);
      }
    } else {
      const { error: insertError } = await supabase
        .from("ai_usage")
        .insert({
          user_id: userId,
          usage_month: currentMonth,
          generations_count: 1,
          tokens_used: 0,
        });

      if (insertError) {
        console.error("[ai-usage] incrementAIUsageAfterSuccess insert:", insertError);
      }
    }
    
    if (isDev) {
      console.log(`[AI Usage Increment] generationId: ${generationId || 'N/A'} | generationType: ${generationType || 'N/A'} | before: ${existingUsage ? existingUsage.generations_count : 0} | after: ${existingUsage ? existingUsage.generations_count + 1 : 1}`);
    }
  } catch (error: any) {
    console.error("[ai-usage] incrementAIUsageAfterSuccess catch:", error);
  }
}
