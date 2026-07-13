"use server";

import { auth } from "@clerk/nextjs/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { AppError, handleError } from "@/lib/errors";

export interface ReviewsReceivedFilterOptions {
  noteId?: string;
  star?: number;
  sortBy?: "newest" | "oldest" | "highest" | "lowest" | "helpful";
  page?: number;
  limit?: number;
}

export async function getReviewsReceivedAction(filters: ReviewsReceivedFilterOptions = {}) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AppError("You must be logged in to view reviews.", 401, "UNAUTHORIZED");
    }

    const supabase = createServiceRoleSupabaseClient();

    // 1. Fetch note IDs owned by the current user
    const { data: userNotes, error: notesError } = await supabase
      .from("notes")
      .select("id, title")
      .eq("author_id", userId);

    if (notesError) throw notesError;

    const ownedNoteIds = userNotes?.map(n => n.id) || [];
    if (ownedNoteIds.length === 0) {
      return {
        success: true,
        data: {
          reviews: [],
          notesList: [],
          totalCount: 0,
        }
      };
    }

    // 2. Query ratings table for reviews belonging to these notes
    // We allow fetching visible, hidden, or removed reviews for owner moderation view.
    // If the review status is hidden or removed, we still show it to the uploader so they see moderation status,
    // but the uploader cannot edit/delete them.
    let query = supabase
      .from("ratings")
      .select(`
        id,
        rating,
        review_title,
        review_text,
        is_verified_downloader,
        helpful_count,
        status,
        created_at,
        updated_at,
        note_id,
        profiles (
          name,
          avatar_url
        )
      `, { count: "exact" })
      .in("note_id", ownedNoteIds);

    // Filters
    if (filters.noteId) {
      query = query.eq("note_id", filters.noteId);
    }
    if (filters.star) {
      query = query.eq("rating", filters.star);
    }

    // Sorting
    const sortBy = filters.sortBy || "newest";
    if (sortBy === "newest") {
      query = query.order("created_at", { ascending: false });
    } else if (sortBy === "oldest") {
      query = query.order("created_at", { ascending: true });
    } else if (sortBy === "highest") {
      query = query.order("rating", { ascending: false }).order("created_at", { ascending: false });
    } else if (sortBy === "lowest") {
      query = query.order("rating", { ascending: true }).order("created_at", { ascending: false });
    } else if (sortBy === "helpful") {
      query = query.order("helpful_count", { ascending: false }).order("created_at", { ascending: false });
    }

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;
    
    query = query.range(offset, offset + limit - 1);

    const { data: reviewsData, count, error: reviewsError } = await query;
    if (reviewsError) throw reviewsError;

    const formattedReviews = (reviewsData || []).map((r: any) => {
      const associatedNote = userNotes?.find(n => n.id === r.note_id);
      return {
        id: r.id,
        rating: r.rating,
        review_title: r.review_title,
        review_text: r.review_text,
        is_verified_downloader: r.is_verified_downloader,
        helpful_count: r.helpful_count,
        status: r.status,
        created_at: r.created_at,
        updated_at: r.updated_at,
        is_edited: new Date(r.updated_at).getTime() > new Date(r.created_at).getTime() + 1000, // 1s buffer
        reviewer_name: r.profiles?.name || "Anonymous Reviewer",
        reviewer_avatar: r.profiles?.avatar_url || null,
        note_title: associatedNote?.title || "Unknown Note",
        note_id: r.note_id,
      };
    });

    return {
      success: true,
      data: {
        reviews: formattedReviews,
        notesList: userNotes || [],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        currentPage: page,
      }
    };
  } catch (error) {
    return handleError(error);
  }
}
