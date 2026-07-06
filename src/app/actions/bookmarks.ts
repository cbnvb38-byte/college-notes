"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { AppError, handleDatabaseError, handleError } from "@/lib/errors";

/**
 * Adds a bookmark for the current user and the specified note.
 * Increments notes.bookmarks_count atomically (via JS logic to prevent race conditions as best as possible without RPCs).
 */
export async function addBookmark(noteId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AppError("You must be logged in to bookmark notes.", 401, "UNAUTHORIZED");
    }

    if (!noteId) {
      throw new AppError("Note ID is required", 400, "INVALID_INPUT");
    }

    // Use service role to check note details and update counts
    const supabase = createServiceRoleSupabaseClient();

    // 1. Verify note exists and is approved
    const { data: note, error: fetchError } = await supabase
      .from("notes")
      .select("id, status, bookmarks_count")
      .eq("id", noteId)
      .single();

    if (fetchError || !note) {
      throw new AppError("Note not found or could not be accessed.", 404, "NOT_FOUND");
    }

    if (note.status !== "approved") {
      throw new AppError("Only approved notes can be bookmarked.", 403, "FORBIDDEN");
    }

    // Verify if Clerk user exists in public.profiles to prevent foreign key violations
    const { data: profileExists } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();
        
    if (!profileExists) {
      throw new AppError("User profile not found. Please log in again.", 403, "FORBIDDEN");
    }

    // 2. Insert bookmark row (relies on unique constraint to prevent duplicates)
    const { error: insertError } = await supabase
      .from("bookmarks")
      .insert({
        user_id: userId,
        note_id: noteId,
      });

    if (insertError) {
      // Postgres error code 23505 is unique violation
      if (insertError.code === "23505") {
        return { success: true, message: "Already bookmarked" };
      }
      throw insertError;
    }

    // 3. Increment bookmarks_count
    const { error: updateError } = await supabase
      .from("notes")
      .update({ bookmarks_count: note.bookmarks_count + 1 })
      .eq("id", noteId);

    if (updateError) {
      console.error("[addBookmark] Failed to increment count:", updateError);
    }

    revalidatePath("/dashboard/bookmarks");
    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Removes a bookmark for the current user and the specified note.
 * Decrements notes.bookmarks_count.
 */
export async function removeBookmark(noteId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AppError("You must be logged in to remove bookmarks.", 401, "UNAUTHORIZED");
    }

    if (!noteId) {
      throw new AppError("Note ID is required", 400, "INVALID_INPUT");
    }

    const supabase = createServiceRoleSupabaseClient();

    // 1. Fetch current count to safely decrement
    const { data: note, error: fetchError } = await supabase
      .from("notes")
      .select("bookmarks_count")
      .eq("id", noteId)
      .single();

    if (fetchError || !note) {
      throw new AppError("Note not found.", 404, "NOT_FOUND");
    }

    // 2. Delete bookmark
    // We only delete the current user's bookmark
    const { data: deleted, error: deleteError } = await supabase
      .from("bookmarks")
      .delete()
      .eq("user_id", userId)
      .eq("note_id", noteId)
      .select();

    if (deleteError) {
      throw deleteError;
    }

    // If no row was actually deleted, do not decrement count
    if (deleted && deleted.length > 0) {
      const newCount = Math.max(0, note.bookmarks_count - 1);
      
      const { error: updateError } = await supabase
        .from("notes")
        .update({ bookmarks_count: newCount })
        .eq("id", noteId);

      if (updateError) {
        console.error("[removeBookmark] Failed to decrement count:", updateError);
      }
    }

    revalidatePath("/dashboard/bookmarks");
    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Checks if the current user has bookmarked the specified note.
 */
export async function getBookmarkState(noteId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: true, data: false };
    }

    // Use service-role client to bypass RLS (Clerk userId already verified above)
    const supabase = createServiceRoleSupabaseClient();

    const { data, error } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("user_id", userId)
      .eq("note_id", noteId)
      .limit(1);

    if (error) {
      throw error;
    }

    return { success: true, data: data && data.length > 0 };
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Fetches all bookmarked notes for the current user.
 */
export async function getCurrentUserBookmarks() {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AppError("You must be logged in.", 401, "UNAUTHORIZED");
    }

    // Use service-role client to bypass RLS (Clerk userId already verified above)
    // RLS on bookmarks requires requesting_user_id() which relies on Supabase JWT parsing.
    // Since we use Clerk JWTs (not Supabase JWTs), RLS blocks all rows.
    // The service-role client bypasses RLS; we filter explicitly by userId.
    const supabase = createServiceRoleSupabaseClient();

    const { data, error } = await supabase
      .from("bookmarks")
      .select(`
        id,
        note_id,
        notes!inner (
          id,
          title,
          description,
          semester,
          status,
          downloads_count,
          view_count,
          bookmarks_count,
          file_url,
          file_size,
          created_at,
          college,
          professor,
          profiles (
            name
          ),
          subjects (
            name,
            branches (
              code
            )
          )
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    console.log("[getCurrentUserBookmarks] Current User ID:", userId);
    console.log("[getCurrentUserBookmarks] Query Error:", error);
    console.log("[getCurrentUserBookmarks] Rows returned:", data?.length ?? 0);
    if (data && data.length > 0) {
      console.log("[getCurrentUserBookmarks] First row joined note data:", JSON.stringify(data[0].notes, null, 2));
    }

    if (error) {
      console.error("[Database Operations Failure - getCurrentUserBookmarks]:", error);
      throw error;
    }

    return { success: true, data: data || [] };
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Fetches an array of note IDs that the current user has bookmarked.
 * Useful for initial state on the Browse Notes page.
 */
export async function getCurrentUserBookmarkedNoteIds() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: true, data: [] };
    }

    // Use service-role client to bypass RLS (Clerk userId already verified above)
    const supabase = createServiceRoleSupabaseClient();

    const { data, error } = await supabase
      .from("bookmarks")
      .select("note_id")
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    const ids = data ? data.map(b => b.note_id) : [];
    return { success: true, data: ids };
  } catch (error) {
    return handleError(error);
  }
}
