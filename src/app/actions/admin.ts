"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { AppError, handleError } from "@/lib/errors";

// ============================================================
// Helper: Verify admin/moderator access
// ============================================================

async function verifyAdminAccess(): Promise<{ userId: string; role: string }> {
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

async function verifyAdminOnly(): Promise<{ userId: string }> {
  const { userId, role } = await verifyAdminAccess();
  if (role !== "admin") {
    throw new AppError("Only administrators can perform this action.", 403, "FORBIDDEN");
  }
  return { userId };
}

async function getClientIp(): Promise<string | null> {
  try {
    const hdrs = await headers();
    return hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || hdrs.get("x-real-ip") || null;
  } catch {
    return null;
  }
}

// ============================================================
// Get Admin Stats
// ============================================================

export async function getAdminStats() {
  try {
    await verifyAdminAccess();
    const supabase = createServiceRoleSupabaseClient();

    // Fetch counts in parallel
    const [pendingRes, approvedRes, rejectedRes, removedRes, usersRes, downloadsRes] = await Promise.all([
      supabase.from("notes").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
      supabase.from("notes").select("id", { count: "exact", head: true }).eq("status", "approved"),
      supabase.from("notes").select("id", { count: "exact", head: true }).eq("status", "rejected"),
      supabase.from("notes").select("id", { count: "exact", head: true }).eq("status", "removed"),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("downloads").select("id", { count: "exact", head: true }),
    ]);

    return {
      success: true,
      data: {
        pendingCount: pendingRes.count ?? 0,
        approvedCount: approvedRes.count ?? 0,
        rejectedCount: rejectedRes.count ?? 0,
        removedCount: removedRes.count ?? 0,
        totalUsers: usersRes.count ?? 0,
        totalDownloads: downloadsRes.count ?? 0,
      },
    };
  } catch (error) {
    return handleError(error);
  }
}

// ============================================================
// Get Admin Notes (paginated, filterable by status)
// ============================================================

export interface AdminNotesFilters {
  status?: "pending_review" | "approved" | "rejected" | "removed" | "all";
  page?: number;
  limit?: number;
}

export async function getAdminNotes(filters: AdminNotesFilters = {}) {
  try {
    await verifyAdminAccess();
    const supabase = createServiceRoleSupabaseClient();

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("notes")
      .select(`
        id,
        title,
        description,
        semester,
        college,
        professor,
        status,
        rejection_reason,
        file_url,
        file_size,
        file_path,
        downloads_count,
        view_count,
        bookmarks_count,
        created_at,
        updated_at,
        profiles!notes_author_id_fkey (
          id,
          name,
          email
        ),
        subjects (
          name,
          code,
          branches (
            name,
            code
          )
        )
      `, { count: "exact" });

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("[getAdminNotes] Query error:", error);
      throw error;
    }

    return {
      success: true,
      data: {
        notes: data || [],
        totalCount: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
        currentPage: page,
      },
    };
  } catch (error) {
    return handleError(error);
  }
}

// ============================================================
// Approve Note
// ============================================================

export async function approveNote(noteId: string) {
  try {
    const { userId } = await verifyAdminAccess();
    if (!noteId) throw new AppError("Note ID is required", 400, "INVALID_INPUT");

    const supabase = createServiceRoleSupabaseClient();

    // 1. Verify note exists and is pending
    const { data: note, error: fetchError } = await supabase
      .from("notes")
      .select("id, status, title, author_id")
      .eq("id", noteId)
      .single();

    if (fetchError || !note) {
      throw new AppError("Note not found.", 404, "NOT_FOUND");
    }

    if (note.status !== "pending_review") {
      throw new AppError(`Cannot approve a note with status '${note.status}'. Only pending notes can be approved.`, 400, "INVALID_STATUS");
    }

    // 2. Update status
    const { error: updateError } = await supabase
      .from("notes")
      .update({ status: "approved", rejection_reason: null, updated_at: new Date().toISOString() })
      .eq("id", noteId);

    if (updateError) throw updateError;

    // 3. Create notification for the uploader
    const { error: notifyError } = await supabase.from("notifications").insert({
      user_id: note.author_id,
      title: "Note Approved",
      message: `Your note "${note.title}" has been approved and is now publicly available.`,
      type: "note_approved",
    });

    if (notifyError) {
      console.error("[approveNote] Notification insert error:", notifyError);
      throw notifyError;
    }

    // 4. Log admin action
    const ip = await getClientIp();
    await supabase.from("admin_logs").insert({
      admin_id: userId,
      action: "approve_note",
      target_id: noteId,
      target_type: "note",
      details: { title: note.title, previous_status: note.status },
      ip_address: ip,
    });

    // 5. Revalidate pages
    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/browse");
    revalidatePath("/dashboard/my-uploads");
    revalidatePath(`/notes/${noteId}`);

    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}

// ============================================================
// Reject Note
// ============================================================

export async function rejectNote(noteId: string, reason: string) {
  try {
    const { userId } = await verifyAdminAccess();
    if (!noteId) throw new AppError("Note ID is required", 400, "INVALID_INPUT");
    if (!reason || reason.trim().length === 0) {
      throw new AppError("A rejection reason is required.", 400, "INVALID_INPUT");
    }

    const supabase = createServiceRoleSupabaseClient();

    // 1. Verify note exists
    const { data: note, error: fetchError } = await supabase
      .from("notes")
      .select("id, status, title, author_id")
      .eq("id", noteId)
      .single();

    if (fetchError || !note) {
      throw new AppError("Note not found.", 404, "NOT_FOUND");
    }

    if (note.status !== "pending_review") {
      throw new AppError(`Cannot reject a note with status '${note.status}'. Only pending notes can be rejected.`, 400, "INVALID_STATUS");
    }

    // 2. Update status and set rejection_reason
    const { error: updateError } = await supabase
      .from("notes")
      .update({
        status: "rejected",
        rejection_reason: reason.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", noteId);

    if (updateError) throw updateError;

    // 3. Notify the uploader
    const { error: notifyError } = await supabase.from("notifications").insert({
      user_id: note.author_id,
      title: "Note Rejected",
      message: `Your note "${note.title}" has been rejected. Reason: ${reason.trim()}`,
      type: "note_rejected",
    });

    if (notifyError) {
      console.error("[rejectNote] Notification insert error:", notifyError);
      throw notifyError;
    }

    // 4. Log admin action
    const ip = await getClientIp();
    await supabase.from("admin_logs").insert({
      admin_id: userId,
      action: "reject_note",
      target_id: noteId,
      target_type: "note",
      details: { title: note.title, reason: reason.trim(), previous_status: note.status },
      ip_address: ip,
    });

    // 5. Revalidate
    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/my-uploads");

    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}

// ============================================================
// Remove Note (soft delete)
// ============================================================

export async function removeNote(noteId: string) {
  try {
    const { userId } = await verifyAdminAccess();
    if (!noteId) throw new AppError("Note ID is required", 400, "INVALID_INPUT");

    const supabase = createServiceRoleSupabaseClient();

    const { data: note, error: fetchError } = await supabase
      .from("notes")
      .select("id, status, title, author_id")
      .eq("id", noteId)
      .single();

    if (fetchError || !note) {
      throw new AppError("Note not found.", 404, "NOT_FOUND");
    }

    const { error: updateError } = await supabase
      .from("notes")
      .update({ status: "removed", updated_at: new Date().toISOString() })
      .eq("id", noteId);

    if (updateError) throw updateError;

    // Notify uploader
    const { error: notifyError } = await supabase.from("notifications").insert({
      user_id: note.author_id,
      title: "Note Removed",
      message: `Your note "${note.title}" has been removed by moderation.`,
      type: "report_action",
    });

    if (notifyError) {
      console.error("[removeNote] Notification insert error:", notifyError);
      // Don't fail the action if just the notification fails
    }

    // Log
    const ip = await getClientIp();
    await supabase.from("admin_logs").insert({
      admin_id: userId,
      action: "remove_note",
      target_id: noteId,
      target_type: "note",
      details: { title: note.title, previous_status: note.status },
      ip_address: ip,
    });

    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/admin/reports");
    revalidatePath("/dashboard/browse");
    revalidatePath("/dashboard/my-uploads");

    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}

// ============================================================
// Restore Note
// ============================================================

export async function restoreNote(noteId: string) {
  try {
    const { userId } = await verifyAdminAccess();
    if (!noteId) throw new AppError("Note ID is required", 400, "INVALID_INPUT");

    const supabase = createServiceRoleSupabaseClient();

    const { data: note, error: fetchError } = await supabase
      .from("notes")
      .select("id, status, title, author_id")
      .eq("id", noteId)
      .single();

    if (fetchError || !note) {
      throw new AppError("Note not found.", 404, "NOT_FOUND");
    }

    const { error: updateError } = await supabase
      .from("notes")
      .update({ status: "approved", updated_at: new Date().toISOString() })
      .eq("id", noteId);

    if (updateError) throw updateError;

    // Notify uploader
    const { error: notifyError } = await supabase.from("notifications").insert({
      user_id: note.author_id,
      title: "Note Restored",
      message: `Your note "${note.title}" has been restored by moderation and is publicly visible again.`,
      type: "report_action",
    });

    if (notifyError) {
      console.error("[restoreNote] Notification insert error:", notifyError);
    }

    // Log
    const ip = await getClientIp();
    await supabase.from("admin_logs").insert({
      admin_id: userId,
      action: "restore_note",
      target_id: noteId,
      target_type: "note",
      details: { title: note.title, previous_status: note.status },
      ip_address: ip,
    });

    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/admin/reports");
    revalidatePath("/dashboard/browse");
    revalidatePath("/dashboard/my-uploads");

    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}

// ============================================================
// Permanent Delete (admin only)
// ============================================================

export async function permanentDeleteNote(noteId: string) {
  try {
    const { userId } = await verifyAdminOnly();
    if (!noteId) throw new AppError("Note ID is required", 400, "INVALID_INPUT");

    const supabase = createServiceRoleSupabaseClient();

    // 1. Fetch note for file path and metadata
    const { data: note, error: fetchError } = await supabase
      .from("notes")
      .select("id, title, file_path, author_id, status")
      .eq("id", noteId)
      .single();

    if (fetchError || !note) {
      throw new AppError("Note not found.", 404, "NOT_FOUND");
    }

    // 2. Log admin action BEFORE deletion (so we have a record even on partial failure)
    const ip = await getClientIp();
    await supabase.from("admin_logs").insert({
      admin_id: userId,
      action: "permanent_delete_note",
      target_id: noteId,
      target_type: "note",
      details: { title: note.title, file_path: note.file_path, previous_status: note.status },
      ip_address: ip,
    });

    // 3. Delete related rows (bookmarks, ratings, downloads, reports)
    // These have ON DELETE CASCADE on note_id, so deleting the note row handles them.
    // But we do it explicitly in case cascade isn't triggered due to RLS or other issues.
    await Promise.all([
      supabase.from("bookmarks").delete().eq("note_id", noteId),
      supabase.from("ratings").delete().eq("note_id", noteId),
      supabase.from("downloads").delete().eq("note_id", noteId),
      supabase.from("reports").delete().eq("note_id", noteId),
    ]);

    // 4. Delete the PDF from storage
    if (note.file_path) {
      const { error: storageError } = await supabase.storage
        .from("notes")
        .remove([note.file_path]);

      if (storageError) {
        console.error("[permanentDeleteNote] Storage delete error:", storageError);
        // Continue even if storage delete fails
      }
    }

    // 5. Delete the notes row
    const { error: deleteError } = await supabase
      .from("notes")
      .delete()
      .eq("id", noteId);

    if (deleteError) {
      console.error("[permanentDeleteNote] DB delete error:", deleteError);
      throw new AppError("Failed to delete note from database.", 500, "DATABASE_ERROR");
    }

    // 6. Revalidate
    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/browse");
    revalidatePath("/dashboard/my-uploads");
    revalidatePath("/dashboard/bookmarks");

    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}

// ============================================================
// Get Recent Admin Activity
// ============================================================

export async function getRecentAdminActivity(limit: number = 10) {
  try {
    await verifyAdminAccess();
    const supabase = createServiceRoleSupabaseClient();

    const { data, error } = await supabase
      .from("admin_logs")
      .select(`
        id,
        action,
        target_id,
        target_type,
        details,
        created_at,
        profiles!admin_logs_admin_id_fkey (
          name,
          email
        )
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[getRecentAdminActivity] Error:", error);
      throw error;
    }

    return { success: true, data: data || [] };
  } catch (error) {
    return handleError(error);
  }
}

// ============================================================
// Check Admin Access (for page-level gate)
// ============================================================

export async function checkAdminAccess() {
  try {
    const result = await verifyAdminAccess();
    return { success: true, data: result };
  } catch (error) {
    return handleError(error);
  }
}
