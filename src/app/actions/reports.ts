"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { AppError, handleError } from "@/lib/errors";

// Helper to verify admin/moderator access
async function verifyAdminAccess() {
  const { userId } = await auth();
  if (!userId) {
    throw new AppError("You must be logged in.", 401, "UNAUTHORIZED");
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    throw new AppError("Profile not found.", 404, "NOT_FOUND");
  }

  if (profile.role !== "admin" && profile.role !== "moderator") {
    throw new AppError("You do not have permission to access admin features.", 403, "FORBIDDEN");
  }

  return { userId, role: profile.role };
}

async function getClientIp() {
  // Try to get from headers. Since we can't reliably get headers in a generic action without next/headers import
  // returning null is safe enough for admin logs if headers fail.
  return null;
}

export interface ReportFilterOptions {
  status?: "pending" | "resolved" | "dismissed" | "all";
  type?: "note" | "review";
  page?: number;
  limit?: number;
  search?: string;
}

export async function getAdminReports(filters: ReportFilterOptions = {}) {
  try {
    await verifyAdminAccess();
    const supabase = createServiceRoleSupabaseClient();
    
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;
    
    let noteReports: any[] = [];
    let noteCount = 0;
    let reviewReports: any[] = [];
    let reviewCount = 0;

    // Fetch Note Reports
    if (!filters.type || filters.type === "note") {
      let query = supabase
        .from("reports")
        .select(`
          id,
          reporter_id,
          note_id,
          reason,
          description,
          status,
          created_at,
          profiles!reports_reporter_id_fkey (name, email),
          notes!reports_note_id_fkey (title, status, author_id)
        `, { count: "exact" });
        
      if (filters.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      
      const { data, count, error } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
        
      if (error) throw error;
      noteReports = data || [];
      noteCount = count || 0;
    }

    // Fetch Review Reports
    if (!filters.type || filters.type === "review") {
      let query = supabase
        .from("review_reports")
        .select(`
          id,
          reporter_id,
          review_id,
          reason,
          details,
          status,
          created_at,
          profiles!review_reports_reporter_id_fkey (name, email),
          ratings!review_reports_review_id_fkey (rating, review_text, status, user_id, note_id)
        `, { count: "exact" });
        
      if (filters.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      
      const { data, count, error } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
        
      if (error) throw error;
      reviewReports = data || [];
      reviewCount = count || 0;
    }

    // Unify the format
    const unifiedReports = [
      ...noteReports.map(r => ({
        id: r.id,
        type: "note" as const,
        reporter_id: r.reporter_id,
        reporter_name: r.profiles?.name || r.profiles?.email || "Unknown",
        target_id: r.note_id,
        reason: r.reason,
        details: r.description,
        status: r.status,
        created_at: r.created_at,
        target_metadata: {
          title: r.notes?.title,
          status: r.notes?.status,
          author_id: r.notes?.author_id,
        }
      })),
      ...reviewReports.map(r => ({
        id: r.id,
        type: "review" as const,
        reporter_id: r.reporter_id,
        reporter_name: r.profiles?.name || r.profiles?.email || "Unknown",
        target_id: r.review_id,
        reason: r.reason,
        details: r.details,
        status: r.status,
        created_at: r.created_at,
        target_metadata: {
          rating: r.ratings?.rating,
          review_text: r.ratings?.review_text,
          status: r.ratings?.status,
          author_id: r.ratings?.user_id,
          note_id: r.ratings?.note_id,
        }
      }))
    ];

    // Re-sort combined
    unifiedReports.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    // In a real robust system we'd do a complex UNION or separate pagination properly,
    // but here we just paginate the requested subset (since we fetch limit per query).
    // We will slice it down to exactly limit.
    const sliced = unifiedReports.slice(0, limit);
    const totalCount = noteCount + reviewCount;

    return {
      success: true,
      data: {
        reports: sliced,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      }
    };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateReportStatus(reportId: string, type: "note" | "review", status: "pending" | "resolved" | "dismissed") {
  try {
    const { userId } = await verifyAdminAccess();
    const supabase = createServiceRoleSupabaseClient();
    
    const table = type === "note" ? "reports" : "review_reports";
    
    // Get existing report
    const { data: report, error: fetchError } = await supabase
      .from(table)
      .select("*")
      .eq("id", reportId)
      .single();
      
    if (fetchError || !report) throw new AppError("Report not found", 404, "NOT_FOUND");
    
    const { error: updateError } = await supabase
      .from(table)
      .update({ status })
      .eq("id", reportId);
      
    if (updateError) throw updateError;
    
    // Log action
    await supabase.from("admin_logs").insert({
      admin_id: userId,
      action: `mark_report_${status}`,
      target_id: reportId,
      target_type: type === "note" ? "note_report" : "review_report",
      details: { previous_status: report.status },
    });
    
    revalidatePath("/dashboard/admin/reports");
    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}

export async function reportNote(noteId: string, reason: string, details?: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AppError("You must be logged in to report a note.", 401, "UNAUTHORIZED");
    }

    const supabase = createServiceRoleSupabaseClient();

    // 1. Verify note exists
    const { data: note, error: fetchError } = await supabase
      .from("notes")
      .select("id, author_id, status")
      .eq("id", noteId)
      .single();

    if (fetchError || !note) {
      throw new AppError("Note not found.", 404, "NOT_FOUND");
    }

    // 2. Prevent self-reporting
    if (note.author_id === userId) {
      throw new AppError("You cannot report your own note.", 403, "FORBIDDEN");
    }

    // 3. Prevent duplicate unresolved reports (status = 'pending')
    const { data: existingReport } = await supabase
      .from("reports")
      .select("id")
      .eq("reporter_id", userId)
      .eq("note_id", noteId)
      .eq("status", "pending")
      .maybeSingle();

    if (existingReport) {
      throw new AppError("You have already reported this note. Please wait for moderation to review it.", 400, "DUPLICATE_REPORT");
    }

    // 4. Insert report
    const { error: insertError } = await supabase
      .from("reports")
      .insert({
        reporter_id: userId,
        note_id: noteId,
        reason,
        description: details || null,
        status: "pending",
      });

    if (insertError) {
      console.error("[reportNote] Database insert error:", insertError);
      throw new AppError("Failed to submit report. Please try again later.", 500, "DATABASE_ERROR");
    }

    revalidatePath(`/notes/${noteId}`);
    revalidatePath("/dashboard/admin/reports");

    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}
