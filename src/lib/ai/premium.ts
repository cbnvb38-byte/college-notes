export type UserPlan = "free" | "premium";

export const FREE_MONTHLY_LIMIT = 10;
export const PREMIUM_MONTHLY_LIMIT = 100;

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
