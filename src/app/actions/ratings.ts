"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { AppError, handleError } from "@/lib/errors";

export async function getRatingSummary(noteId: string) {
  const supabase = createServiceRoleSupabaseClient();
  
  const { data: ratingsData, error: distError } = await supabase
    .from("ratings")
    .select("rating, review_text, status")
    .eq("note_id", noteId)
    .in("status", ["visible", "hidden"]);

  if (distError) {
    throw distError;
  }

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let ratingCount = 0;
  let totalScore = 0;
  let totalReviews = 0;

  if (ratingsData) {
    ratingCount = ratingsData.length;
    ratingsData.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) {
        distribution[r.rating as 1|2|3|4|5]++;
        totalScore += r.rating;
      }
      if (r.review_text && r.review_text.trim() !== "" && r.status === "visible") {
        totalReviews++;
      }
    });
  }
  
  const averageRating = ratingCount > 0 ? (totalScore / ratingCount) : 0;

  return { 
    averageRating, 
    ratingCount,
    totalReviews,
    distribution
  };
}

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
      .select("rating, review_text, review_title")
      .eq("user_id", userId)
      .eq("note_id", noteId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { success: true, data: null };
      }
      console.error("[getCurrentUserRating] Error:", error);
      throw error;
    }

    return { 
      success: true, 
      data
    };
  } catch (error) {
    return handleError(error);
  }
}

export async function toggleHelpfulVote(reviewId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AppError("You must be logged in to vote", 401, "UNAUTHORIZED");
    }

    if (!reviewId) {
      throw new AppError("Review ID is required", 400, "INVALID_INPUT");
    }

    const supabase = createServiceRoleSupabaseClient();
    
    // Check if review exists and user is not the author
    const { data: review, error: reviewError } = await supabase
      .from("ratings")
      .select("user_id, note_id")
      .eq("id", reviewId)
      .single();
      
    if (reviewError || !review) {
      console.error("[toggleHelpfulVote] Review not found:", reviewError);
      throw new AppError("Review not found", 404, "NOT_FOUND");
    }
    
    if (review.user_id === userId) {
      throw new AppError("You cannot vote on your own review", 403, "FORBIDDEN");
    }

    console.log("[toggleHelpfulVote] User:", userId, "Review:", reviewId);

    // Check if vote exists
    const { data: existingVote } = await supabase
      .from("review_helpful_votes")
      .select("id")
      .eq("review_id", reviewId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingVote) {
      // Remove vote
      const { error: deleteError } = await supabase
        .from("review_helpful_votes")
        .delete()
        .eq("id", existingVote.id);
      
      if (deleteError) {
        console.error("[toggleHelpfulVote] Delete error:", { code: deleteError.code, message: deleteError.message, details: deleteError.details, hint: deleteError.hint });
        throw deleteError;
      }
      return { success: true, isHelpful: false };
    } else {
      // Add vote
      const { error: insertError } = await supabase
        .from("review_helpful_votes")
        .insert({ review_id: reviewId, user_id: userId });
        
      if (insertError) {
        console.error("[toggleHelpfulVote] Insert error:", { code: insertError.code, message: insertError.message, details: insertError.details, hint: insertError.hint });
        throw insertError;
      }
      return { success: true, isHelpful: true };
    }
  } catch (error) {
    return handleError(error);
  }
}

export async function submitRating(noteId: string, value: number, reviewTitle: string | null = null, reviewText: string | null = null) {
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

    const serviceSupabase = createServiceRoleSupabaseClient();
    const { data: note, error: noteError } = await serviceSupabase
      .from("notes")
      .select("status, author_id")
      .eq("id", noteId)
      .single();

    if (noteError || !note) {
      throw new AppError("Note not found", 404, "NOT_FOUND");
    }

    if (note.status !== "approved") {
      throw new AppError("Only approved notes can be rated", 403, "FORBIDDEN");
    }

    if (note.author_id === userId) {
      throw new AppError("You cannot rate your own note", 403, "FORBIDDEN");
    }

    const supabaseClient = createServiceRoleSupabaseClient();
    const { data: existingRating, error: fetchError } = await supabaseClient
      .from("ratings")
      .select("id")
      .eq("user_id", userId)
      .eq("note_id", noteId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      throw fetchError;
    }

    if (existingRating) {
      const { error: updateError } = await supabaseClient
        .from("ratings")
        .update({
          rating: value,
          review_text: reviewText,
          review_title: reviewTitle,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingRating.id);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabaseClient
        .from("ratings")
        .insert({
          user_id: userId,
          note_id: noteId,
          rating: value,
          review_text: reviewText,
          review_title: reviewTitle
        });

      if (insertError) throw insertError;
    }

    const summary = await getRatingSummary(noteId);
    revalidatePath(`/notes/${noteId}`);
    return { success: true, data: summary };
  } catch (error) {
    return handleError(error);
  }
}

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

    if (error) throw error;

    const summary = await getRatingSummary(noteId);
    revalidatePath(`/notes/${noteId}`);
    return { success: true, data: summary };
  } catch (error) {
    return handleError(error);
  }
}

export interface ReviewFilterOptions {
  star?: number;
  writtenOnly?: boolean;
  verifiedOnly?: boolean;
  sortBy?: "helpful" | "recent" | "high" | "low";
  page?: number;
  limit?: number;
}

export async function getReviewsForNote(noteId: string, options: ReviewFilterOptions = {}) {
  try {
    const { userId } = await auth();

    const supabase = createServiceRoleSupabaseClient();
    
    let query = supabase
      .from("ratings")
      .select(`
        id,
        user_id,
        rating,
        review_text,
        review_title,
        status,
        helpful_count,
        created_at,
        updated_at,
        profiles (
          name,
          avatar_url
        )
      `, { count: "exact" })
      .eq("note_id", noteId)
      .eq("status", "visible");

    if (options.star) {
      query = query.eq("rating", options.star);
    }
    
    if (options.writtenOnly) {
      query = query.not("review_text", "is", null).neq("review_text", "");
    }
    
    const sort = options.sortBy || "helpful";
    if (sort === "helpful") {
      query = query.order("helpful_count", { ascending: false }).order("created_at", { ascending: false });
    } else if (sort === "recent") {
      query = query.order("created_at", { ascending: false });
    } else if (sort === "high") {
      query = query.order("rating", { ascending: false }).order("created_at", { ascending: false });
    } else if (sort === "low") {
      query = query.order("rating", { ascending: true }).order("created_at", { ascending: false });
    }

    const page = options.page || 1;
    const limit = options.limit || 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: reviews, count, error } = await query.range(from, to);

    if (error) throw error;

    // Fetch dynamic data: is_verified_downloader and isHelpfulByMe
    let downloadsSet = new Set<string>();
    let helpfulSet = new Set<string>();

    if (reviews && reviews.length > 0) {
      const reviewUserIds = Array.from(new Set(reviews.map(r => r.user_id)));
      
      const { data: downloadsData } = await supabase
        .from("downloads")
        .select("user_id")
        .in("user_id", reviewUserIds)
        .eq("note_id", noteId);
        
      if (downloadsData) {
        downloadsData.forEach(d => {
          if (d.user_id) downloadsSet.add(d.user_id);
        });
      }

      if (userId) {
        const reviewIds = reviews.map(r => r.id);
        const { data: helpfulData } = await supabase
          .from("review_helpful_votes")
          .select("review_id")
          .eq("user_id", userId)
          .in("review_id", reviewIds);
          
        if (helpfulData) {
          helpfulData.forEach(h => helpfulSet.add(h.review_id));
        }
      }
    }

    const formattedReviews = reviews ? reviews.map(r => ({
      ...r,
      is_verified_downloader: downloadsSet.has(r.user_id),
      isHelpfulByMe: helpfulSet.has(r.id)
    })) : [];

    let finalReviews = formattedReviews;
    if (options.verifiedOnly) {
      finalReviews = finalReviews.filter(r => r.is_verified_downloader);
    }

    return { 
      success: true, 
      data: {
        reviews: finalReviews,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateReviewStatus(reviewId: string, status: "visible" | "hidden" | "removed") {
  try {
    const { userId } = await auth();
    if (!userId) throw new AppError("You must be logged in", 401, "UNAUTHORIZED");

    const supabase = createServiceRoleSupabaseClient();

    // Verify role
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single();
    if (profile?.role !== "admin" && profile?.role !== "moderator") {
      throw new AppError("Forbidden", 403, "FORBIDDEN");
    }

    // Get existing review
    const { data: review, error: fetchError } = await supabase
      .from("ratings")
      .select("user_id, note_id, status")
      .eq("id", reviewId)
      .single();

    if (fetchError || !review) throw new AppError("Review not found", 404, "NOT_FOUND");

    const { error } = await supabase
      .from("ratings")
      .update({ status })
      .eq("id", reviewId);
    if (error) throw error;

    // Log admin action
    await supabase.from("admin_logs").insert({
      admin_id: userId,
      action: `review_${status}`,
      target_id: reviewId,
      target_type: "review",
      details: { previous_status: review.status },
    });

    // Notify user
    let title = "Review Updated";
    let message = "Your review has been updated by moderation.";
    if (status === "hidden") {
      title = "Review Hidden";
      message = "Your review text has been hidden from public view for violating guidelines, but your rating score remains.";
    } else if (status === "removed") {
      title = "Review Removed";
      message = "Your review and rating have been completely removed by moderation.";
    } else if (status === "visible") {
      title = "Review Restored";
      message = "Your review has been restored and is publicly visible again.";
    }

    await supabase.from("notifications").insert({
      user_id: review.user_id,
      title,
      message,
      type: "report_action",
    });

    revalidatePath(`/notes/${review.note_id}`);
    revalidatePath(`/dashboard/admin/reports`);
    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}

export async function reportReview(reviewId: string, reason: string, details?: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AppError("You must be logged in to report a review", 401, "UNAUTHORIZED");
    }

    if (!reviewId || !reason) {
      throw new AppError("Review ID and reason are required", 400, "INVALID_INPUT");
    }

    const supabase = createServiceRoleSupabaseClient();

    const { data: review, error: reviewError } = await supabase
      .from("ratings")
      .select("user_id")
      .eq("id", reviewId)
      .single();

    if (reviewError || !review) {
      console.error("[reportReview] Review not found:", reviewError);
      throw new AppError("Review not found", 404, "NOT_FOUND");
    }

    if (review.user_id === userId) {
      throw new AppError("You cannot report your own review", 403, "FORBIDDEN");
    }

    console.log("[reportReview] Payload:", { reporter_id: userId, review_id: reviewId, reason, details: details || null });

    const { error: insertError } = await supabase
      .from("review_reports")
      .insert({
        reporter_id: userId,
        review_id: reviewId,
        reason,
        details: details || null
      });

    if (insertError) {
      console.error("[reportReview] Supabase Error:", { code: insertError.code, message: insertError.message, details: insertError.details, hint: insertError.hint });
      if (insertError.code === "23505") { // unique violation
        throw new AppError("You have already reported this review", 400, "DUPLICATE_REPORT");
      }
      throw insertError;
    }

    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}
