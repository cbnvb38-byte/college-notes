"use server";

import { auth } from "@clerk/nextjs/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { AppError, handleError } from "@/lib/errors";

export async function getNoteAnalyticsAction(noteId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AppError("You must be logged in to view analytics.", 401, "UNAUTHORIZED");
    }

    const supabase = createServiceRoleSupabaseClient();

    // 1. Fetch note & verify ownership (or admin/moderator role)
    const { data: note, error: noteError } = await supabase
      .from("notes")
      .select("id, title, status, author_id, created_at, updated_at, average_rating, total_ratings, total_reviews, view_count, downloads_count, bookmarks_count")
      .eq("id", noteId)
      .single();

    if (noteError || !note) {
      throw new AppError("Note not found.", 404, "NOT_FOUND");
    }

    // Verify ownership or check if caller is admin/moderator
    if (note.author_id !== userId) {
      const { data: callerProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();
      
      if (!callerProfile || (callerProfile.role !== "admin" && callerProfile.role !== "moderator")) {
        throw new AppError("You do not have permission to view this note's analytics.", 403, "FORBIDDEN");
      }
    }

    // 2. Fetch rating distribution (rating scores: 1..5)
    const { data: ratings, error: ratingsError } = await supabase
      .from("ratings")
      .select("rating, created_at")
      .eq("note_id", noteId);

    if (ratingsError) throw ratingsError;

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings?.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) {
        distribution[r.rating as 1|2|3|4|5]++;
      }
    });

    // 3. Count helpful votes received
    // Fetch all reviews of this note
    const reviewIds = ratings?.map(r => (r as any).id) || [];
    let totalHelpfulVotes = 0;
    if (reviewIds.length > 0) {
      const { count: helpfulCount, error: helpfulError } = await supabase
        .from("review_helpful_votes")
        .select("id", { count: "exact", head: true })
        .in("review_id", reviewIds);
      
      if (!helpfulError) {
        totalHelpfulVotes = helpfulCount || 0;
      }
    }

    // 4. Count reports (note reports & review reports)
    const { count: noteReportsCount, error: noteReportsError } = await supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("note_id", noteId);

    let reviewReportsCount = 0;
    if (reviewIds.length > 0) {
      const { count: revRepCount, error: revRepError } = await supabase
        .from("review_reports")
        .select("id", { count: "exact", head: true })
        .in("review_id", reviewIds);
      
      if (!revRepError) {
        reviewReportsCount = revRepCount || 0;
      }
    }

    const totalReports = (noteReportsCount || 0) + (reviewReportsCount || 0);

    // 5. Calculate Last Activity Date
    // Query dates of latest download, bookmark, rating, or report
    const [latestDownload, latestBookmark, latestRating, latestReport] = await Promise.all([
      supabase.from("downloads").select("created_at").eq("note_id", noteId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("bookmarks").select("created_at").eq("note_id", noteId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("ratings").select("created_at").eq("note_id", noteId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("reports").select("created_at").eq("note_id", noteId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    const dates = [
      note.created_at,
      latestDownload.data?.created_at,
      latestBookmark.data?.created_at,
      latestRating.data?.created_at,
      latestReport.data?.created_at
    ].filter(Boolean).map(d => new Date(d!).getTime());

    const lastActivityTime = Math.max(...dates);
    const lastActivityDate = new Date(lastActivityTime).toISOString();

    // 6. Fetch recent events list for uploader to view recent activity trends
    // Fetch last 5 downloads
    const { data: recentDownloads } = await supabase
      .from("downloads")
      .select("created_at")
      .eq("note_id", noteId)
      .order("created_at", { ascending: false })
      .limit(5);

    // Fetch last 5 ratings (with reviewer name)
    const { data: recentRatings } = await supabase
      .from("ratings")
      .select("rating, created_at, profiles(name)")
      .eq("note_id", noteId)
      .order("created_at", { ascending: false })
      .limit(5);

    const activityTimeline: any[] = [];
    recentDownloads?.forEach(d => {
      activityTimeline.push({
        type: "download",
        label: "Note Downloaded",
        date: d.created_at,
      });
    });
    recentRatings?.forEach(r => {
      activityTimeline.push({
        type: "rating",
        label: `Rated ${r.rating} stars by ${r.profiles?.name || "Anonymous"}`,
        date: r.created_at,
      });
    });

    activityTimeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      success: true,
      data: {
        note: {
          id: note.id,
          title: note.title,
          status: note.status,
          created_at: note.created_at,
          updated_at: note.updated_at,
          view_count: note.view_count,
          downloads_count: note.downloads_count,
          bookmarks_count: note.bookmarks_count,
          average_rating: note.average_rating,
          total_ratings: note.total_ratings,
          total_reviews: note.total_reviews,
        },
        distribution,
        totalHelpfulVotes,
        totalReports,
        lastActivityDate,
        recentActivity: activityTimeline.slice(0, 10),
      }
    };
  } catch (error) {
    return handleError(error);
  }
}
