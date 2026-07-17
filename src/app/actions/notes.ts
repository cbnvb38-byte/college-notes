"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { noteUploadSchema } from "@/lib/validation";
import { AppError, handleDatabaseError, handleError } from "@/lib/errors";

/**
 * Fetches all engineering branches from the database.
 */
export async function fetchBranches() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("branches")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("[Database Operations Failure - fetchBranches]:", error);
      throw error;
    }
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Fetches subjects for a specific branch and semester.
 */
export async function fetchSubjectsForBranch(branchId: string, semester: number) {
  try {
    if (!branchId) {
      throw new AppError("Branch ID is required", 400, "INVALID_INPUT");
    }
    if (semester < 1 || semester > 8) {
      throw new AppError("Semester must be between 1 and 8", 400, "INVALID_INPUT");
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("subjects")
      .select("*")
      .eq("branch_id", branchId)
      .eq("semester", semester)
      .order("name", { ascending: true });

    if (error) {
      console.error("[Database Operations Failure - fetchSubjectsForBranch]:", error);
      throw error;
    }
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Validates and uploads a study material PDF to storage and logs the metadata in the database.
 */
export async function uploadNoteAction(formData: FormData) {
  try {
    // 1. Authenticate user using Clerk Native Authentication
    const { userId } = await auth();
    if (!userId) {
      throw new AppError("You must be logged in to upload notes", 401, "UNAUTHORIZED");
    }

    // 2. Parse form data fields
    const rawData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string || null,
      branchId: formData.get("branchId") as string,
      semester: parseInt(formData.get("semester") as string, 10),
      subjectId: formData.get("subjectId") as string,
      college: formData.get("college") as string || null,
      professor: formData.get("professor") as string || null,
      file: formData.get("file") as File,
    };

    // 3. Validate form data with Zod
    const validated = noteUploadSchema.safeParse(rawData);
    if (!validated.success) {
      const errorMsg = validated.error.issues.map(err => err.message).join(", ");
      throw new AppError(`Validation failed: ${errorMsg}`, 400, "VALIDATION_FAILED");
    }

    const input = validated.data;
    const file = input.file as File;

    // 4. Initialize Supabase service-role client (bypasses RLS).
    // This is safe because Clerk auth() has already verified the user above.
    const supabase = createServiceRoleSupabaseClient();

    // 4.5. Check for duplicate upload (same author, same title, same size)
    const { data: existingNotes, error: checkError } = await supabase
      .from("notes")
      .select("id")
      .eq("author_id", userId)
      .eq("title", input.title)
      .eq("file_size", file.size)
      .limit(1);

    //if (checkError) {
     // console.error("[Duplicate Check Error]:", checkError);
     // throw new AppError("Failed to check for duplicate notes.", 500, "DATABASE_ERROR");
    //}
    if (checkError) {
  console.log("========== DUPLICATE ERROR ==========");
  console.log(JSON.stringify(checkError, null, 2));
  throw checkError;
}

    if (existingNotes && existingNotes.length > 0) {
      throw new AppError("A note with the same title and file size already exists. Duplicate uploads are not allowed.", 409, "DUPLICATE_UPLOAD");
    }

    // 5. Generate a unique ID for the note log
    const noteId = crypto.randomUUID();
    const fileExtension = "pdf";
    const storagePath = `${userId}/${noteId}.${fileExtension}`;

    // 6. Convert file to buffer and upload to the Supabase Storage bucket 'notes'
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("notes")
      .upload(storagePath, fileBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("[Storage Upload Error]:", uploadError);
      throw new AppError("Failed to upload file to storage.", 500, "STORAGE_UPLOAD_ERROR");
    }

    // 7. Get the public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from("notes")
      .getPublicUrl(storagePath);

    const fileUrl = urlData.publicUrl;

    // 8. Insert record metadata into notes table
    const { data: noteRecord, error: dbError } = await supabase
      .from("notes")
      .insert({
        id: noteId,
        title: input.title,
        description: input.description,
        file_url: fileUrl,
        file_path: storagePath,
        file_type: file.type,
        file_size: file.size,
        author_id: userId,
        subject_id: input.subjectId,
        semester: input.semester,
        college: input.college,
        professor: input.professor,
        status: "pending_review", // Sets note to undergo verification
      })
      .select()
      .single();

    if (dbError) {
      // If db log insert fails, attempt to delete orphaned file from storage
      await supabase.storage.from("notes").remove([storagePath]);
      handleDatabaseError(dbError);
    }

    // 9. Revalidate the my-uploads page cache
    revalidatePath("/dashboard/my-uploads");

    return {
      success: true,
      data: {
        noteId: noteRecord.id,
        title: noteRecord.title,
        fileUrl: noteRecord.file_url,
      },
    };
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Deletes a note from the database and removes its associated file from storage.
 */
export async function deleteNoteAction(noteId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AppError("You must be logged in to delete notes", 401, "UNAUTHORIZED");
    }

    if (!noteId) {
      throw new AppError("Note ID is required", 400, "INVALID_INPUT");
    }

    // Use service-role client (Clerk auth already verified user above)
    const supabase = createServiceRoleSupabaseClient();

    // 1. Fetch the note to verify ownership and get the file path
    const { data: note, error: fetchError } = await supabase
      .from("notes")
      .select("author_id, file_path")
      .eq("id", noteId)
      .single();

    if (fetchError || !note) {
      throw new AppError("Note not found or could not be accessed.", 404, "NOT_FOUND");
    }

    if (note.author_id !== userId) {
      throw new AppError("You do not have permission to delete this note.", 403, "FORBIDDEN");
    }

    // 2. Delete the file from Supabase storage
    if (note.file_path) {
      const { error: storageError } = await supabase.storage
        .from("notes")
        .remove([note.file_path]);

      if (storageError) {
        console.error("[Storage Delete Error]:", storageError);
        // We log the error but proceed to delete the database row anyway,
        // so the user is not permanently stuck if the file is already gone.
      }
    }

    // 3. Delete the database row
    const { error: dbError } = await supabase
      .from("notes")
      .delete()
      .eq("id", noteId);

    if (dbError) {
      handleDatabaseError(dbError);
    }

    // 4. Revalidate the my-uploads page cache
    revalidatePath("/dashboard/my-uploads");

    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}

export interface BrowseNotesFilters {
  search?: string;
  branchId?: string;
  semester?: number;
  subjectId?: string;
  sortBy?: "newest" | "downloads" | "views" | "highest_rated" | "most_reviewed" | "relevance";
  page?: number;
  limit?: number;
}

/**
 * Searches, filters, sorts, and paginates approved study notes.
 */
export async function browseNotesAction(filters: BrowseNotesFilters) {
  try {
    const search = filters.search?.trim();
    
    let branchId = filters.branchId;
    if (branchId === "all" || branchId === "") branchId = undefined;

    let semester = filters.semester;
    if (semester === 0) semester = undefined;

    let subjectId = filters.subjectId;
    if (subjectId === "all" || subjectId === "") subjectId = undefined;

    let sortBy = filters.sortBy || "newest";
    const allowedSorts = ["newest", "relevance", "downloads", "views", "highest_rated", "most_rated", "most_reviewed", "bookmarks"];
    if (!allowedSorts.includes(sortBy)) {
      sortBy = "newest";
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;

    const supabase = createServiceRoleSupabaseClient();

    const from = (page - 1) * limit;

    const { data: pagedNotes, error: notesError } = await (supabase.rpc as any)("search_notes", {
      p_search: search || null,
      p_branch_id: branchId || null,
      p_semester: semester || null,
      p_subject_id: subjectId || null,
      p_college: null,
      p_professor: null,
      p_min_rating: null,
      p_has_verified_reviews: null,
      p_has_written_reviews: null,
      p_recently_uploaded: null,
      p_sort_by: sortBy,
      p_limit: limit,
      p_offset: from
    });

    if (notesError) {
      console.error("[Database Operations Failure - browseNotesAction - notes query]:", notesError);
      throw notesError;
    }
    
    let totalCount = 0;
    if (pagedNotes && (pagedNotes as any[]).length > 0) {
      totalCount = Number((pagedNotes as any[])[0].total_count);
    }
    
    // Ensure safe defaults and map the flat RPC structure to the nested structure expected by the UI
    let notes = ((pagedNotes as any[]) || []).map((n: any) => ({
      id: n.id,
      title: n.title,
      description: n.description,
      semester: n.semester,
      college: n.college,
      professor: n.professor,
      downloads_count: n.downloads_count || 0,
      bookmarks_count: n.bookmarks_count || 0,
      view_count: n.view_count || 0,
      average_rating: n.average_rating || 0,
      total_ratings: n.total_ratings || 0,
      total_reviews: n.total_reviews || 0,
      created_at: n.created_at,
      file_url: n.file_url,
      author_id: n.author_id,
      profiles: {
        name: n.contributor_name
      },
      subjects: {
        id: n.subject_id,
        name: n.subject_name,
        code: n.subject_code,
        branches: {
          id: n.branch_id,
          name: n.branch_name,
          code: n.branch_code
        }
      }
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return {
      success: true,
      data: {
        notes,
        totalCount,
        page,
        totalPages,
      },
    };
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Fetches note details, average rating, and related notes list.
 */
export async function fetchNoteDetailsAction(noteId: string) {
  try {
    if (!noteId) {
      throw new AppError("Note ID is required", 400, "INVALID_INPUT");
    }

    const supabase = createServiceRoleSupabaseClient();

    // 1. Fetch note with profile, subject, and branch details
    const { data: note, error: noteError } = await supabase
      .from("notes")
      .select(`
        id,
        title,
        description,
        semester,
        college,
        professor,
        downloads_count,
        bookmarks_count,
        view_count,
        created_at,
        file_url,
        file_size,
        status,
        author_id,
        average_rating,
        total_ratings,
        total_reviews,
        profiles (
          name
        ),
        subjects!inner (
          id,
          name,
          code,
          branch_id,
          branches!inner (
            id,
            name,
            code
          )
        )
      `)
      .eq("id", noteId)
      .single();

    if (noteError || !note) {
      console.error("[Database Operations Failure - fetchNoteDetailsAction - fetch note]:", noteError);
      throw new AppError("Note not found or could not be accessed.", 404, "NOT_FOUND");
    }

    // Only approved notes can be publicly viewed
    if (note.status !== "approved") {
      throw new AppError("Note not found or could not be accessed.", 404, "NOT_FOUND");
    }

    // 2. Use native aggregated ratings
    const averageRating = note.average_rating || 0;
    const ratingCount = note.total_ratings || 0;
    const totalReviews = note.total_reviews || 0;

    // 3. Fetch related notes using the new RPC
    const { data: relatedNotesData, error: relatedError } = await (supabase.rpc as any)(
      "get_related_notes",
      { p_note_id: noteId, p_limit: 4 }
    );

    if (relatedError) {
      console.error("[Database Operations Failure - fetchNoteDetailsAction - related notes]:", relatedError);
    }
    
    // Map RPC output to expected UI structure
    const relatedNotes = ((relatedNotesData as any[]) || []).map((n: any) => ({
      id: n.id,
      title: n.title,
      semester: n.semester,
      downloads_count: n.downloads_count,
      view_count: n.view_count,
      created_at: n.created_at,
      subjects: {
        name: n.subject_name,
        branches: {
          name: n.branch_name,
          code: n.branch_code
        }
      }
    }));

    if (relatedError) {
      console.error("[Database Operations Failure - fetchNoteDetailsAction - related notes]:", relatedError);
    }

    return {
      success: true,
      data: {
        note,
        averageRating,
        ratingCount,
        totalReviews,
        relatedNotes: relatedNotes || []
      }
    };
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Increments the view count of a note by 1.
 */
export async function incrementViewCountAction(noteId: string) {
  try {
    console.log(`[DEBUG incrementViewCountAction] Entered for noteId: ${noteId}`);
    if (!noteId) {
      throw new AppError("Note ID is required", 400, "INVALID_INPUT");
    }

    const { userId } = await auth();
    const supabase = createServiceRoleSupabaseClient();
    console.log("[DEBUG incrementViewCountAction] Supabase service-role client created");

    // 1. Fetch current view count
    const { data: note, error: fetchError } = await supabase
      .from("notes")
      .select("view_count, status")
      .eq("id", noteId)
      .single();

    console.log("[DEBUG incrementViewCountAction] Fetch note result:", {
      note,
      error: fetchError ? { code: fetchError.code, message: fetchError.message } : null
    });

    if (fetchError || !note) {
      console.error("[Database Operations Failure - incrementViewCountAction - fetch]:", fetchError);
      throw new AppError("Note not found.", 404, "NOT_FOUND");
    }

    if (note.status !== "approved") {
      throw new AppError("Note is not approved.", 403, "FORBIDDEN");
    }

    // 2. Increment view_count
    const { data: updateData, error: updateError } = await supabase
      .from("notes")
      .update({ view_count: note.view_count + 1 })
      .eq("id", noteId)
      .select();

    console.log("[DEBUG incrementViewCountAction] Update note result:", {
      updateData,
      error: updateError ? { code: updateError.code, message: updateError.message } : null
    });

    if (updateError) {
      console.error("[Database Operations Failure - incrementViewCountAction - update]:", updateError);
      throw updateError;
    }

    return { success: true };
  } catch (error) {
    console.error("[DEBUG incrementViewCountAction] Caught error:", error);
    return handleError(error);
  }
}

/**
 * Records that a logged-in user recently viewed a note.
 */
export async function recordRecentlyViewedAction(noteId: string) {
  try {
    if (!noteId) return { success: false };

    const { userId } = await auth();
    if (!userId) return { success: true }; // Silent success for anonymous

    // Use service role client to bypass any RLS complexity, as we already verified userId via auth()
    const supabase = createServiceRoleSupabaseClient();
    
    // 1. Verify note exists and is approved
    const { data: note, error: noteError } = await supabase
      .from("notes")
      .select("status")
      .eq("id", noteId)
      .single();
      
    if (noteError || !note || note.status !== "approved") {
      return { success: false };
    }
    
    // 2. Check if Clerk user exists in profiles (optional, but safe)
    const { data: profileExists } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();
      
    if (profileExists) {
      const { error: viewLogErr } = await (supabase as any).from("recently_viewed_notes").upsert({
        user_id: userId,
        note_id: noteId,
        viewed_at: new Date().toISOString(),
      }, { onConflict: "user_id,note_id" });
      
      if (viewLogErr) {
        console.warn("[recordRecentlyViewedAction] Supabase recently viewed upsert failed:", viewLogErr);
        return { success: false };
      }
    }

    return { success: true };
  } catch (error) {
    console.warn("[recordRecentlyViewedAction] Failed to log recently viewed:", error);
    return { success: false }; // Never throw
  }
}

/**
 * Clears the recently viewed history for the logged-in user.
 */
export async function clearRecentlyViewedNotesAction() {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AppError("You must be logged in to clear history.", 401, "UNAUTHORIZED");
    }

    const supabase = createServiceRoleSupabaseClient();
    
    const { error } = await (supabase as any)
      .from("recently_viewed_notes")
      .delete()
      .eq("user_id", userId);

    if (error) {
      console.error("[clearRecentlyViewedNotesAction] Error:", error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Logs a download event in the downloads table and increments the downloads count on the note.
 */
export async function logDownloadAction(noteId: string) {
  try {
    console.log(`[DEBUG logDownloadAction] Entered for noteId: ${noteId}`);
    if (!noteId) {
      throw new AppError("Note ID is required", 400, "INVALID_INPUT");
    }

    const { userId } = await auth(); // Clerk user ID (can be null if anonymous)
    const requestHeaders = await headers();
    const ipAddress = requestHeaders.get("x-forwarded-for")?.split(",")[0].trim() || requestHeaders.get("x-real-ip") || null;

    console.log("[DEBUG logDownloadAction] Context:", { userId, ipAddress });

    const supabase = createServiceRoleSupabaseClient();
    console.log("[DEBUG logDownloadAction] Supabase service-role client created");

    // 1. Fetch note to verify it exists and get current downloads_count
    const { data: note, error: fetchError } = await supabase
      .from("notes")
      .select("downloads_count, file_url, status")
      .eq("id", noteId)
      .single();

    console.log("[DEBUG logDownloadAction] Fetch note result:", {
      note,
      error: fetchError ? { code: fetchError.code, message: fetchError.message } : null
    });

    if (fetchError || !note) {
      console.error("[Database Operations Failure - logDownloadAction - fetch note]:", fetchError);
      throw new AppError("Note not found.", 404, "NOT_FOUND");
    }

    if (note.status !== "approved") {
      throw new AppError("Note is not approved for download.", 403, "FORBIDDEN");
    }

    // Verify if Clerk user exists in public.profiles to prevent foreign key violations
    let finalUserId = null;
    if (userId) {
      const { data: profileExists } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .single();
        
      if (profileExists) {
        finalUserId = userId;
      } else {
        console.warn(`[DEBUG logDownloadAction] Clerk user ${userId} does not have a corresponding record in public.profiles table. Logging download with user_id = null.`);
      }
    }

    // 2. Insert record in downloads table
    const { data: insertData, error: insertError } = await supabase
      .from("downloads")
      .insert({
        note_id: noteId,
        user_id: finalUserId,
        ip_address: ipAddress
      })
      .select();

    console.log("[DEBUG logDownloadAction] Insert download result:", {
      insertData,
      error: insertError ? { code: insertError.code, message: insertError.message } : null
    });

    if (insertError) {
      console.error("[Database Operations Failure - logDownloadAction - insert download]:", insertError);
    }

    // 3. Increment downloads_count
    const { data: updateData, error: updateError } = await supabase
      .from("notes")
      .update({ downloads_count: note.downloads_count + 1 })
      .eq("id", noteId)
      .select();

    console.log("[DEBUG logDownloadAction] Update note result:", {
      updateData,
      error: updateError ? { code: updateError.code, message: updateError.message } : null
    });

    if (updateError) {
      console.error("[Database Operations Failure - logDownloadAction - increment count]:", updateError);
    }

    return {
      success: true,
      data: {
        fileUrl: note.file_url
      }
    };
  } catch (error) {
    console.error("[DEBUG logDownloadAction] Caught error:", error);
    return handleError(error);
  }
}

/**
 * Fetches personalized recommendations using the RPC function.
 */
export async function fetchRecommendedNotesAction(limit = 6) {
  try {
    const { userId } = await auth();
    const supabase = createServiceRoleSupabaseClient();
    
    // Check if Clerk user exists in public.profiles
    let finalUserId = null;
    if (userId) {
      const { data: profileExists } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .single();
        
      if (profileExists) {
        finalUserId = userId;
      }
    }

    const { data: recommendedNotesData, error: recommendedError } = await (supabase.rpc as any)(
      "get_personalized_recommendations",
      { p_user_id: finalUserId, p_limit: limit }
    );

    if (recommendedError) {
      console.warn("[fetchRecommendedNotesAction]", {
        message: recommendedError?.message ?? String(recommendedError),
        code: recommendedError?.code,
        details: recommendedError?.details,
        hint: recommendedError?.hint
      });
      return { success: false, data: [], error: "Recommended notes unavailable" };
    }

    const notes = ((recommendedNotesData as any[]) || []).map((n: any) => ({
      id: n.id,
      title: n.title,
      description: n.description,
      semester: n.semester,
      downloads_count: n.downloads_count,
      view_count: n.view_count,
      average_rating: n.average_rating || 0,
      total_ratings: n.total_ratings || 0,
      created_at: n.created_at,
      subjects: {
        name: n.subject_name,
        branches: {
          name: n.branch_name,
          code: n.branch_code
        }
      }
    }));

    return { success: true, data: notes };
  } catch (error: any) {
    console.warn("[fetchRecommendedNotesAction Exception]", {
      message: error?.message ?? String(error),
      code: error?.code,
      details: error?.details,
      hint: error?.hint
    });
    return { success: false, data: [], error: "Recommended notes unavailable" };
  }
}

/**
 * Fetches trending notes using the RPC function.
 */
export async function fetchTrendingNotesAction(limit = 5) {
  try {
    const supabase = createServiceRoleSupabaseClient();
    
    const { data: trendingNotesData, error: trendingError } = await (supabase.rpc as any)(
      "get_trending_notes",
      { p_limit: limit }
    );

    if (trendingError) {
      console.warn("[fetchTrendingNotesAction]", {
        message: trendingError?.message ?? String(trendingError),
        code: trendingError?.code,
        details: trendingError?.details,
        hint: trendingError?.hint
      });
      return { success: false, data: [], error: "Trending notes unavailable" };
    }

    const notes = ((trendingNotesData as any[]) || []).map((n: any) => ({
      id: n.id,
      title: n.title,
      description: n.description,
      semester: n.semester,
      downloads_count: n.downloads_count,
      view_count: n.view_count,
      average_rating: n.average_rating || 0,
      total_ratings: n.total_ratings || 0,
      created_at: n.created_at,
      trending_score: n.trending_score || 0,
      subjects: {
        name: n.subject_name,
        branches: {
          name: n.branch_name,
          code: n.branch_code
        }
      }
    }));

    return { success: true, data: notes };
  } catch (error: any) {
    console.warn("[fetchTrendingNotesAction Exception]", {
      message: error?.message ?? String(error),
      code: error?.code,
      details: error?.details,
      hint: error?.hint
    });
    return { success: false, data: [], error: "Trending notes unavailable" };
  }
}

/**
 * Fetches recently viewed notes for the current user.
 */
export async function fetchRecentlyViewedNotesAction(limit = 4) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: true, data: undefined };

    const supabase = createServiceRoleSupabaseClient();
    
    // Step 1: Fetch recently viewed note IDs
    const { data: views, error: viewsError } = await (supabase as any)
      .from("recently_viewed_notes")
      .select("note_id, viewed_at")
      .eq("user_id", userId)
      .order("viewed_at", { ascending: false })
      .limit(limit);

    if (viewsError) {
      console.warn("[fetchRecentlyViewedNotesAction - Views]", {
        message: viewsError?.message ?? String(viewsError),
        code: viewsError?.code,
        details: viewsError?.details,
        hint: viewsError?.hint
      });
      return { success: false, data: [], error: "Recently viewed notes unavailable" };
    }

    if (!views || views.length === 0) {
      return { success: true, data: [] };
    }

    const noteIds = views.map((v: any) => v.note_id);

    // Step 2: Fetch notes details safely
    const { data: notesData, error: notesError } = await supabase
      .from("notes")
      .select(`
        id,
        title,
        description,
        file_type,
        semester,
        average_rating,
        downloads_count,
        view_count,
        status,
        created_at,
        profiles(name),
        subjects!inner(
          name,
          branches!inner(
            name,
            code
          )
        )
      `)
      .in("id", noteIds)
      .eq("status", "approved");

    if (notesError) {
      console.warn("[fetchRecentlyViewedNotesAction - Notes]", {
        message: notesError?.message ?? String(notesError),
        code: notesError?.code,
        details: notesError?.details,
        hint: notesError?.hint
      });
      return { success: false, data: [], error: "Recently viewed notes unavailable" };
    }

    // Step 3: Preserve original viewed order
    const orderedNotesData = [];
    for (const noteId of noteIds) {
      const noteData = notesData?.find((n) => n.id === noteId);
      if (noteData) orderedNotesData.push(noteData);
    }

    const notes = orderedNotesData.map((n: any) => ({
      id: n.id,
      title: n.title,
      description: n.description,
      file_type: n.file_type,
      semester: n.semester,
      average_rating: n.average_rating,
      downloads_count: n.downloads_count,
      view_count: n.view_count,
      status: n.status,
      created_at: n.created_at,
      profiles: n.profiles,
      subjects: {
        name: n.subjects.name,
        branches: {
          name: n.subjects.branches.name,
          code: n.subjects.branches.code
        }
      }
    }));

    return { success: true, data: notes };
  } catch (error: any) {
    console.warn("[fetchRecentlyViewedNotesAction Exception]", {
      message: error?.message ?? String(error),
      code: error?.code,
      details: error?.details,
      hint: error?.hint
    });
    return { success: false, data: [], error: "Recently viewed notes unavailable" };
  }
}
