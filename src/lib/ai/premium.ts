export type UserPlan = "free" | "premium";
export type PremiumStatus = "inactive" | "active" | "trial" | "cancelled" | "expired";

export const FREE_MONTHLY_LIMIT = 10;
export const PREMIUM_MONTHLY_LIMIT = 100;

export interface PlanResolution {
  effectivePlan: "free" | "premium";
  premiumStatus: PremiumStatus;
  isPremiumActive: boolean;
  isPremiumExpired: boolean;
  isPremiumEndingSoon: boolean;
  limit: number;
  premiumExpiresAt: string | null;
}

export interface ProfilePlanData {
  plan?: string | null;
  premium_status?: string | null;
  premium_expires_at?: string | null;
}

export function resolveUserPlan(profile?: ProfilePlanData | null): PlanResolution {
  const rawPlan = profile?.plan || "free";
  // If it's a known plan, but old schema, status might be null
  let rawStatus = (profile?.premium_status || "inactive") as PremiumStatus;
  const expiresAt = profile?.premium_expires_at || null;

  let effectivePlan: "free" | "premium" = "free";
  let premiumStatus: PremiumStatus = rawStatus;
  let isPremiumActive = false;
  let isPremiumExpired = false;
  let isPremiumEndingSoon = false;
  let limit = FREE_MONTHLY_LIMIT;

  const now = new Date();

  // Backward compatibility: If plan is premium but status is null/inactive and no expiry, treat as active
  if (rawPlan === "premium" && (!profile?.premium_status || rawStatus === "inactive") && !expiresAt) {
    premiumStatus = "active";
  }

  if (rawPlan === "premium" || premiumStatus === "active" || premiumStatus === "trial") {
    if (expiresAt) {
      const expDate = new Date(expiresAt);
      if (expDate < now) {
        // Expired
        effectivePlan = "free";
        premiumStatus = "expired";
        isPremiumExpired = true;
        limit = FREE_MONTHLY_LIMIT;
      } else {
        // Active
        effectivePlan = "premium";
        isPremiumActive = true;
        limit = PREMIUM_MONTHLY_LIMIT;
        
        // Ending soon? (within 3 days)
        const diffMs = expDate.getTime() - now.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (diffDays <= 3) {
          isPremiumEndingSoon = true;
        }
      }
    } else {
      // Active forever (manual override / backward compat)
      if (premiumStatus === "active" || premiumStatus === "trial") {
        effectivePlan = "premium";
        isPremiumActive = true;
        limit = PREMIUM_MONTHLY_LIMIT;
      }
    }
  }

  return {
    effectivePlan,
    premiumStatus,
    isPremiumActive,
    isPremiumExpired,
    isPremiumEndingSoon,
    limit,
    premiumExpiresAt: expiresAt,
  };
}

export type StudyFeature = 
  | "base_generations"
  | "scanned_pdf_ai_reading"
  | "exam_sprint_mode"
  | "multi_pdf_study_pack"
  | "spaced_repetition"
  | "export_pdf";

export function getMonthlyLimitForPlan(plan: UserPlan | string | undefined | null): number {
  return plan === "premium" ? PREMIUM_MONTHLY_LIMIT : FREE_MONTHLY_LIMIT;
}

export function canUseStudyFeature(plan: UserPlan | string | undefined | null, feature: StudyFeature): boolean {
  if (plan === "premium") {
    return true; // Premium has access to everything
  }

  // Free plan feature flags
  switch (feature) {
    case "base_generations":
      return true; // Free can use summary, mcq, flashcards, important qs, doubts (up to limit)
    case "scanned_pdf_ai_reading":
      // Note for Phase 8.7A: We leave this true so we don't break existing scanned PDF QA flow.
      // In future updates, we can switch this to false to make it premium-only.
      return true; 
    case "exam_sprint_mode":
    case "multi_pdf_study_pack":
    case "spaced_repetition":
    case "export_pdf":
      return false; // Future premium features
    default:
      return false;
  }
}
