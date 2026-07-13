"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { AppError, handleError } from "@/lib/errors";
import { revalidatePath } from "next/cache";

export async function ensureCurrentUserProfile() {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createServiceRoleSupabaseClient();
  const user = await currentUser();
  if (!user) {
    return { success: false, error: "Clerk user not found" };
  }

  const email = user.primaryEmailAddress?.emailAddress;
  if (!email) {
    return { success: false, error: "User has no primary email" };
  }

  const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
  const avatar_url = user.imageUrl || null;

  // 1. Check if the user's profile already exists
  const { data: existingProfile, error: selectError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (existingProfile) {
    // SELF-HEALING: If profile exists, guarantee it perfectly matches Clerk (except role)
    // This fixes any previous identity overwrites.
    const { data: healedProfile, error: updateError } = await supabase
      .from("profiles")
      .update({
        email,
        name,
        avatar_url,
        updated_at: new Date().toISOString()
      })
      .eq("id", userId)
      .select()
      .single();

    if (updateError) {
      console.error("Error healing profile:", updateError);
      return { success: true, data: existingProfile }; // Fallback to existing
    }
    
    return { success: true, data: healedProfile };
  }

  if (selectError && selectError.code !== "PGRST116") { // PGRST116 is 'not found'
    console.error("Error fetching profile in ensureCurrentUserProfile:", selectError);
    return { success: false, error: "Database error" };
  }

  // 2. Profile doesn't exist, we need to create it
  // Check if it's the very first user in the DB
  let initialRole = "student";
  try {
    const { count, error: countError } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    if (!countError && (count === 0 || count === null)) {
      initialRole = "admin";
    }
  } catch (e) {
    console.warn("Failed to query profile count, defaulting to student:", e);
  }

  // Insert the row
  const { data: newProfile, error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      email,
      name,
      avatar_url,
      role: initialRole as any,
    })
    .select()
    .single();

  if (insertError) {
    // Handle potential duplicate insert race conditions safely
    if (insertError.code === '23505') { // unique violation
      const { data: recoveredProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      
      if (recoveredProfile) {
         return { success: true, data: recoveredProfile };
      }
    }
    console.error("Error inserting profile in ensureCurrentUserProfile:", insertError);
    return { success: false, error: "Failed to create profile" };
  }

  return { success: true, data: newProfile };
}

export async function updateProfileSettings(input: {
  college?: string | null;
  branch?: string | null;
  bio?: string | null;
  is_college_public?: boolean;
  is_branch_public?: boolean;
  is_bio_public?: boolean;
  is_avatar_public?: boolean;
}) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const supabase = createServiceRoleSupabaseClient();

    const { data, error } = await supabase
      .from("profiles")
      .update({
        college: input.college !== undefined ? input.college : undefined,
        branch: input.branch !== undefined ? input.branch : undefined,
        bio: input.bio !== undefined ? input.bio : undefined,
        is_college_public: input.is_college_public !== undefined ? input.is_college_public : undefined,
        is_branch_public: input.is_branch_public !== undefined ? input.is_branch_public : undefined,
        is_bio_public: input.is_bio_public !== undefined ? input.is_bio_public : undefined,
        is_avatar_public: input.is_avatar_public !== undefined ? input.is_avatar_public : undefined,
        updated_at: new Date().toISOString()
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating profile settings:", error);
      throw new AppError(error.message, 500, "DATABASE_ERROR");
    }

    revalidatePath("/dashboard/profile");
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function getPublicContributorProfile(profileId: string) {
  try {
    if (!profileId) {
      throw new AppError("Profile ID is required", 400, "INVALID_INPUT");
    }

    const supabase = createServiceRoleSupabaseClient();

    // 1. Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .single();

    if (profileError || !profile) {
      throw new AppError("Contributor profile not found.", 404, "NOT_FOUND");
    }

    // 2. Fetch approved notes
    const { data: approvedNotes, error: notesError } = await supabase
      .from("notes")
      .select(`
        id,
        title,
        description,
        semester,
        downloads_count,
        view_count,
        bookmarks_count,
        average_rating,
        total_ratings,
        total_reviews,
        created_at,
        subjects (
          name,
          branches (
            name
          )
        )
      `)
      .eq("author_id", profileId)
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (notesError) {
      console.error("[getPublicContributorProfile] error fetching notes:", notesError);
      throw new AppError("Failed to load contributor notes.", 500, "DATABASE_ERROR");
    }

    const notes = approvedNotes || [];
    const totalApprovedNotes = notes.length;
    
    // Aggregates across approved notes
    const totalDownloads = notes.reduce((sum, n) => sum + (n.downloads_count || 0), 0);
    const totalViews = notes.reduce((sum, n) => sum + (n.view_count || 0), 0);
    const totalRatingsReceived = notes.reduce((sum, n) => sum + (n.total_ratings || 0), 0);
    
    // Average rating across approved uploaded notes (only include notes with ratings)
    const ratedNotes = notes.filter(n => n.total_ratings > 0);
    const averageRating = ratedNotes.length > 0
      ? parseFloat((ratedNotes.reduce((sum, n) => sum + (n.average_rating || 0), 0) / ratedNotes.length).toFixed(1))
      : 0;

    // 3. Clean private data based on flags
    const sanitizedProfile = {
      id: profile.id,
      name: profile.name || "Anonymous Contributor",
      avatar_url: profile.is_avatar_public ? profile.avatar_url : null,
      college: profile.is_college_public ? profile.college : null,
      branch: profile.is_branch_public ? profile.branch : null,
      bio: profile.is_bio_public ? profile.bio : null,
    };

    return {
      success: true,
      data: {
        profile: sanitizedProfile,
        stats: {
          totalApprovedNotes,
          totalDownloads,
          totalViews,
          totalRatingsReceived,
          averageRating,
        },
        notes: notes.map(n => ({
          id: n.id,
          title: n.title,
          description: n.description,
          semester: n.semester,
          downloads_count: n.downloads_count,
          view_count: n.view_count,
          bookmarks_count: n.bookmarks_count,
          average_rating: n.average_rating,
          total_ratings: n.total_ratings,
          created_at: n.created_at,
          subject_name: n.subjects?.name || null,
          branch_name: n.subjects?.branches?.name || null,
        })),
      }
    };
  } catch (error) {
    return handleError(error);
  }
}

export async function getContributorDashboardSummary() {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const supabase = createServiceRoleSupabaseClient();

    // Fetch all notes of uploader to calculate statistics
    const { data: notes, error: notesError } = await supabase
      .from("notes")
      .select("status, downloads_count, view_count, bookmarks_count, average_rating, total_ratings, total_reviews")
      .eq("author_id", userId);

    if (notesError) {
      console.error("[getContributorDashboardSummary] error:", notesError);
      throw new AppError("Failed to fetch statistics", 500, "DATABASE_ERROR");
    }

    const allNotes = notes || [];

    const totalNotes = allNotes.length;
    const approvedNotes = allNotes.filter(n => n.status === "approved");
    const pendingNotes = allNotes.filter(n => n.status === "pending_review");
    const rejectedNotes = allNotes.filter(n => n.status === "rejected");
    const removedNotes = allNotes.filter(n => n.status === "removed");

    const totalViews = allNotes.reduce((sum, n) => sum + (n.view_count || 0), 0);
    const totalDownloads = allNotes.reduce((sum, n) => sum + (n.downloads_count || 0), 0);
    const totalBookmarks = allNotes.reduce((sum, n) => sum + (n.bookmarks_count || 0), 0);
    const totalRatings = allNotes.reduce((sum, n) => sum + (n.total_ratings || 0), 0);
    const totalReviews = allNotes.reduce((sum, n) => sum + (n.total_reviews || 0), 0);

    const ratedApprovedNotes = approvedNotes.filter(n => n.total_ratings > 0);
    const averageRating = ratedApprovedNotes.length > 0
      ? parseFloat((ratedApprovedNotes.reduce((sum, n) => sum + (n.average_rating || 0), 0) / ratedApprovedNotes.length).toFixed(1))
      : 0;

    return {
      success: true,
      data: {
        totalNotes,
        approvedCount: approvedNotes.length,
        pendingCount: pendingNotes.length,
        rejectedCount: rejectedNotes.length,
        removedCount: removedNotes.length,
        totalViews,
        totalDownloads,
        totalBookmarks,
        totalRatings,
        totalReviews,
        averageRating,
      }
    };
  } catch (error) {
    return handleError(error);
  }
}
