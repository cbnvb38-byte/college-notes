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
  sortBy?: "newest" | "downloads" | "views" | "highest_rated" | "most_reviewed";
  page?: number;
  limit?: number;
}

/**
 * Searches, filters, sorts, and paginates approved study notes.
 */
export async function browseNotesAction(filters: BrowseNotesFilters) {
  try {
    const search = filters.search?.trim();
    const branchId = filters.branchId;
    const semester = filters.semester;
    const subjectId = filters.subjectId;
    const sortBy = filters.sortBy || "newest";
    const page = filters.page || 1;
    const limit = filters.limit || 10;

    // Use service-role client to bypass Profiles RLS so we can retrieve uploader names.
    const supabase = createServiceRoleSupabaseClient();

    let matchedSubjectIds: string[] = [];

    // Step 1: Search by subject name if search text is provided
    if (search) {
      const { data: matchedSubjects, error: subjectError } = await supabase
        .from("subjects")
        .select("id")
        .ilike("name", `%${search}%`);

      if (subjectError) {
        console.error("[Database Operations Failure - browseNotesAction - subject search]:", subjectError);
        throw subjectError;
      }

      if (matchedSubjects) {
        matchedSubjectIds = matchedSubjects.map((s) => s.id);
      }
    }

    // Step 2: Build main query
    let query = supabase
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
        average_rating,
        total_ratings,
        total_reviews,
        created_at,
        file_url,
        profiles (
          name
        ),
        subjects!inner (
          id,
          name,
          code,
          branches!inner (
            id,
            name,
            code
          )
        )
      `, { count: "exact" })
      .eq("status", "approved");

    // Search condition across title, professor, college, or subject names
    if (search) {
      let orConditions = [
        `title.ilike.%${search}%`,
        `professor.ilike.%${search}%`,
        `college.ilike.%${search}%`
      ];

      if (matchedSubjectIds.length > 0) {
        orConditions.push(`subject_id.in.(${matchedSubjectIds.map(id => `"${id}"`).join(",")})`);
      }

      query = query.or(orConditions.join(","));
    }

    // Dynamic filtering
    if (branchId && branchId !== "all") {
      query = query.eq("subjects.branch_id", branchId);
    }
    if (semester && semester !== 0) {
      query = query.eq("semester", semester);
    }
    if (subjectId && subjectId !== "all") {
      query = query.eq("subject_id", subjectId);
    }

    // Sorting & Pagination Strategy
    if (sortBy === "newest") {
      query = query.order("created_at", { ascending: false });
    } else if (sortBy === "downloads") {
      query = query.order("downloads_count", { ascending: false });
    } else if (sortBy === "views") {
      query = query.order("view_count", { ascending: false });
    } else if (sortBy === "highest_rated") {
      query = query.order("average_rating", { ascending: false }).order("total_ratings", { ascending: false });
    } else if (sortBy === "most_reviewed") {
      query = query.order("total_reviews", { ascending: false });
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: pagedNotes, count, error: notesError } = await query.range(from, to);
    if (notesError) {
      console.error("[Database Operations Failure - browseNotesAction - notes query]:", notesError);
      throw notesError;
    }
    
    let totalCount = count || 0;
    
    // Ensure safe defaults
    let notes = (pagedNotes || []).map((n: any) => ({
      ...n,
      average_rating: n.average_rating || 0,
      total_ratings: n.total_ratings || 0,
      total_reviews: n.total_reviews || 0,
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

    // 3. Fetch related notes (same subject OR same semester), excluding the current note
    const subjectId = note.subjects.id;
    const sem = note.semester;

    const { data: relatedNotes, error: relatedError } = await supabase
      .from("notes")
      .select(`
        id,
        title,
        semester,
        downloads_count,
        view_count,
        created_at,
        subjects!inner (
          name,
          branches!inner (
            name,
            code
          )
        )
      `)
      .eq("status", "approved")
      .neq("id", noteId)
      .or(`subject_id.eq.${subjectId},semester.eq.${sem}`)
      .limit(4);

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


