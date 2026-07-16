"use server";

import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { AppError, handleError } from "@/lib/errors";
import { generateContent, GenerationType, isAIConfigured } from "@/lib/ai/gemini";
import { revalidatePath } from "next/cache";

/**
 * Returns the current user's study copilot access (plan and limits).
 */
export async function getStudyCopilotAccess() {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AppError("You must be logged in to use Study Copilot.", 401, "UNAUTHORIZED");
    }

    const supabase = createServiceRoleSupabaseClient();
    
    const { data: profile, error } = await (supabase as any)
      .from("profiles")
      .select("plan, ai_monthly_limit, ai_used_this_month, ai_usage_reset_at")
      .eq("id", userId)
      .single();

    if (error || !profile) {
      throw new AppError("Failed to fetch access details.", 500, "DATABASE_ERROR");
    }

    // Check if usage needs to be reset
    const now = new Date();
    const currentMonthStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    
    let needsReset = false;
    if (!profile.ai_usage_reset_at) {
      needsReset = true;
    } else {
      const resetDate = new Date(profile.ai_usage_reset_at);
      const resetMonthStr = `${resetDate.getUTCFullYear()}-${String(resetDate.getUTCMonth() + 1).padStart(2, '0')}`;
      if (currentMonthStr !== resetMonthStr) {
        needsReset = true;
      }
    }

    if (needsReset) {
      const { error: updateError } = await (supabase as any)
        .from("profiles")
        .update({
          ai_used_this_month: 0,
          ai_usage_reset_at: new Date().toISOString()
        })
        .eq("id", userId);
        
      if (updateError) {
        console.error("[getStudyCopilotAccess] Failed to reset monthly usage:", updateError);
      } else {
        profile.ai_used_this_month = 0;
      }
    }

    return {
      success: true,
      data: {
        plan: profile.plan || 'free',
        limit: profile.ai_monthly_limit || 3,
        used: profile.ai_used_this_month || 0,
        hasAccess: (profile.ai_used_this_month || 0) < (profile.ai_monthly_limit || 3),
      }
    };
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Generates study material using AI based on a given note.
 */
export async function generateStudyMaterial(noteId: string, generationType: GenerationType, optionalQuestion?: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AppError("You must be logged in to use Study Copilot.", 401, "UNAUTHORIZED");
    }

    if (!noteId) throw new AppError("Note ID is required.", 400, "INVALID_INPUT");

    // 1. Verify Note Exists and is Approved
    const supabase = createServiceRoleSupabaseClient();
    const { data: note, error: noteError } = await supabase
      .from("notes")
      .select("id, status, title")
      .eq("id", noteId)
      .single();

    if (noteError || !note) throw new AppError("Note not found.", 404, "NOT_FOUND");
    if (note.status !== "approved") throw new AppError("Note is not approved for AI processing.", 403, "FORBIDDEN");

    // 2. Check Plan & Usage Limits
    const accessRes = await getStudyCopilotAccess();
    if (!accessRes.success || !("data" in accessRes)) {
      throw new AppError("Failed to verify AI limits.", 500, "INTERNAL_ERROR");
    }
    
    if (!accessRes.data.hasAccess) {
      throw new AppError("Monthly AI usage limit reached. Please upgrade to continue.", 403, "LIMIT_REACHED");
    }

    // 3. Extract PDF Text (Placeholder for Phase 8)
    // NOTE: True PDF text extraction is complex on edge environments.
    // For this phase, we safely return a placeholder if extraction isn't ready.
    const isExtractionReady = false; 
    let extractedText = "";

    if (!isExtractionReady) {
      return {
        success: false,
        error: "Study Copilot is ready, but PDF text extraction is not configured yet.",
        code: "EXTRACTION_NOT_READY"
      };
    }

    // 4. Verify AI is configured
    if (!isAIConfigured()) {
       return {
        success: false,
        error: "AI provider is not configured yet.",
        code: "AI_NOT_CONFIGURED"
      };
    }

    // 5. Generate AI Content
    // This part will only run if extraction is ready and AI is configured.
    let generatedResult;
    try {
      generatedResult = await generateContent(extractedText, generationType, optionalQuestion);
    } catch (e: any) {
      console.error("[generateStudyMaterial] AI Generation failed:", e);
      throw new AppError("Failed to generate content: " + e.message, 500, "AI_ERROR");
    }

    const { data: generationRow, error: saveError } = await (supabase as any)
      .from("ai_generations")
      .insert({
        user_id: userId,
        note_id: noteId,
        generation_type: generationType,
        status: 'completed',
        result_text: generatedResult.isJson ? null : (generatedResult.text || ""),
        result_json: generatedResult.isJson ? JSON.parse(generatedResult.text || "{}") : null,
      })
      .select()
      .single();

    if (saveError) {
      console.error("[generateStudyMaterial] Failed to save generation:", saveError);
      throw new AppError("Generated successfully, but failed to save result.", 500, "DATABASE_ERROR");
    }
    // 7. Increment Usage
    const newUsedCount = accessRes.data.used + 1;
    await (supabase as any).from("profiles").update({ ai_used_this_month: newUsedCount }).eq("id", userId);
    
    // Log in ai_usage table
    const now = new Date();
    const currentMonthStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const { data: usageRow } = await (supabase as any).from("ai_usage").select("id, generations_count").eq("user_id", userId).eq("usage_month", currentMonthStr).single();
    if (usageRow) {
      await (supabase as any).from("ai_usage").update({ generations_count: usageRow.generations_count + 1 }).eq("id", usageRow.id);
    } else {
      await (supabase as any).from("ai_usage").insert({ user_id: userId, usage_month: currentMonthStr, generations_count: 1 });
    }

    revalidatePath(`/notes/${noteId}`);
    revalidatePath("/dashboard/study-copilot");

    return {
      success: true,
      data: generationRow
    };
  } catch (error) {
    return handleError(error);
  }
}

export async function getAIGenerations(limit = 10) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: true, data: [] };
    }

    const supabase = createServiceRoleSupabaseClient();
    
    // Attempt to query with join relationship
    let data: any[] | null = null;
    let error: any = null;

    try {
      const res = await (supabase as any)
        .from("ai_generations")
        .select(`
          id,
          generation_type,
          status,
          result_text,
          result_json,
          created_at,
          notes ( id, title, subjects ( name, branches ( name ) ) )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);
      data = res.data;
      error = res.error;
    } catch (joinErr: any) {
      console.warn("[getAIGenerations] Join query failed, falling back to separate queries:", joinErr);
      error = joinErr;
    }

    // If query failed (e.g. relation doesn't exist, bad join, etc.), try fetching generations first, then notes separately
    if (error) {
      console.error("[getAIGenerations] Primary fetch error:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });

      // Fallback: fetch without notes join
      const fallbackRes = await (supabase as any)
        .from("ai_generations")
        .select(`
          id,
          generation_type,
          status,
          result_text,
          result_json,
          created_at,
          note_id
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (fallbackRes.error) {
        console.error("[getAIGenerations] Fallback fetch error:", {
          message: fallbackRes.error.message,
          code: fallbackRes.error.code,
          details: fallbackRes.error.details,
          hint: fallbackRes.error.hint
        });
        return { success: false, data: [], error: { message: "Failed to load study materials." } };
      }

      const generations = fallbackRes.data || [];
      if (generations.length === 0) {
        return { success: true, data: [] };
      }

      // Fetch note details separately
      const noteIds = generations
        .map((g: any) => g.note_id)
        .filter(Boolean);

      let notesMap: Record<string, any> = {};
      if (noteIds.length > 0) {
        const notesRes = await (supabase as any)
          .from("notes")
          .select(`
            id,
            title,
            subjects ( name, branches ( name ) )
          `)
          .in("id", noteIds);
        
        if (!notesRes.error && notesRes.data) {
          notesRes.data.forEach((n: any) => {
            notesMap[n.id] = n;
          });
        } else if (notesRes.error) {
          console.error("[getAIGenerations] Fallback notes fetch error:", {
            message: notesRes.error.message,
            code: notesRes.error.code,
            details: notesRes.error.details,
            hint: notesRes.error.hint
          });
        }
      }

      // Map notes back to generations
      const mappedData = generations.map((g: any) => ({
        ...g,
        notes: notesMap[g.note_id] || null
      }));

      return { success: true, data: mappedData };
    }

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error("[getAIGenerations] Unhandled error:", error);
    return { success: false, data: [], error: { message: "An unexpected error occurred." } };
  }
}

/**
 * Deletes a specific AI generation.
 */
export async function deleteAIGeneration(generationId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AppError("You must be logged in.", 401, "UNAUTHORIZED");
    }

    const supabase = createServiceRoleSupabaseClient();
    const { error } = await (supabase as any)
      .from("ai_generations")
      .delete()
      .eq("id", generationId)
      .eq("user_id", userId);

    if (error) {
      throw new AppError("Failed to delete generation.", 500, "DATABASE_ERROR");
    }

    revalidatePath("/dashboard/study-copilot");
    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}
