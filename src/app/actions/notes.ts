"use server";

import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
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
      .select("id, name, code")
      .order("name", { ascending: true });

    if (error) throw error;
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
      .select("id, name, code, semester")
      .eq("branch_id", branchId)
      .eq("semester", semester)
      .order("name", { ascending: true });

    if (error) throw error;
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

    // 4. Initialize Supabase client
    const supabase = await createServerSupabaseClient();

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
