"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { AppError, handleError } from "@/lib/errors";

/**
 * Helper to fetch the current average and count for a note.
 */
async function getRatingSummary(noteId: string) {
  const supabase = createServiceRoleSupabaseClient();
  const { data: ratingsData, error } = await supabase
    .from("ratings")
    .select("rating")
    .eq("note_id", noteId);

  if (error) {
    throw error;
  }

  let averageRating = 0;
  let ratingCount = 0;
  if (ratingsData && ratingsData.length > 0) {
    const sum = ratingsData.reduce((acc, curr) => acc + curr.rating, 0);
    ratingCount = ratingsData.length;
    averageRating = parseFloat((sum / ratingCount).toFixed(1));
  }

  return { averageRating, ratingCount };
}

/**
 * Fetches the current user's rating for a specific note.
 */
export async function getCurrentUserRating(noteId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: true, data: null };
    }

    if (!noteId) {
      throw new AppError("Note ID is required", 400, "INVALID_INPUT");
    }

    const supabase = createServiceRoleSupabaseClient();
    const { data, error } = await supabase
      .from("ratings")
      .select("rating")
      .eq("user_id", userId)
      .eq("note_id", noteId)
      .single();

    if (error) {
      if (error.code === "PGRST116") { // PostgREST error for no rows found
        return { success: true, data: null };
      }
      console.error("[getCurrentUserRating] Error:", error);
      throw error;
    }

    return { success: true, data: data.rating };
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Submits or updates a rating for a specific note.
 */
export async function submitRating(noteId: string, value: number) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AppError("You must be logged in to rate notes", 401, "UNAUTHORIZED");
    }

    if (!noteId) {
      throw new AppError("Note ID is required", 400, "INVALID_INPUT");
    }

    if (!Number.isInteger(value) || value < 1 || value > 5) {
      throw new AppError("Rating must be an integer between 1 and 5", 400, "INVALID_INPUT");
    }

    // Verify note exists, is approved, and user is not the author
    const serviceSupabase = createServiceRoleSupabaseClient();
    const { data: note, error: noteError } = await serviceSupabase
      .from("notes")
      .select("status, author_id")
      .eq("id", noteId)
      .single();

    console.log("[submitRating DIAGNOSTIC] userId:", userId);
    console.log("[submitRating DIAGNOSTIC] noteId:", noteId, "value:", value);
    console.log("[submitRating DIAGNOSTIC] note author_id:", note?.author_id, "status:", note?.status);

    if (noteError || !note) {
      throw new AppError("Note not found", 404, "NOT_FOUND");
    }

    if (note.status !== "approved") {
      throw new AppError("Only approved notes can be rated", 403, "FORBIDDEN");
    }

    if (note.author_id === userId) {
      throw new AppError("You cannot rate your own note", 403, "FORBIDDEN");
    }

    // Check if rating exists (using service role since Clerk JWT does not integrate with Supabase RLS)
    const supabaseClient = createServiceRoleSupabaseClient();
    const { data: existingRating, error: fetchError } = await supabaseClient
      .from("ratings")
      .select("id")
      .eq("user_id", userId)
      .eq("note_id", noteId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("[submitRating] Error checking existing:", fetchError);
      throw fetchError;
    }

    if (existingRating) {
      // Update existing
      const { error: updateError } = await supabaseClient
        .from("ratings")
        .update({
          rating: value,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingRating.id);

      if (updateError) {
        console.error("[submitRating DIAGNOSTIC] Update Error:", JSON.stringify(updateError));
        throw updateError;
      }
      console.log("[submitRating DIAGNOSTIC] Updated existing rating row.");
    } else {
      // Insert new
      const { error: insertError } = await supabaseClient
        .from("ratings")
        .insert({
          user_id: userId,
          note_id: noteId,
          rating: value,
        });

      if (insertError) {
        console.error("[submitRating DIAGNOSTIC] Insert Error:", JSON.stringify(insertError));
        throw insertError;
      }
      console.log("[submitRating DIAGNOSTIC] Inserted new rating row.");
    }

    // Fetch and return updated summary
    const summary = await getRatingSummary(noteId);

    revalidatePath(`/notes/${noteId}`);

    return {
      success: true,
      data: summary,
    };
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Removes the current user's rating for a specific note.
 */
export async function removeRating(noteId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AppError("You must be logged in to remove a rating", 401, "UNAUTHORIZED");
    }

    if (!noteId) {
      throw new AppError("Note ID is required", 400, "INVALID_INPUT");
    }

    const supabase = createServiceRoleSupabaseClient();
    const { error } = await supabase
      .from("ratings")
      .delete()
      .eq("user_id", userId)
      .eq("note_id", noteId);

    if (error) {
      console.error("[removeRating] Error:", error);
      throw error;
    }

    // Fetch and return updated summary
    const summary = await getRatingSummary(noteId);

    revalidatePath(`/notes/${noteId}`);

    return {
      success: true,
      data: summary,
    };
  } catch (error) {
    return handleError(error);
  }
}
