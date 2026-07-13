"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  MessageSquare, 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  ThumbsUp,
  UserCheck,
  EyeOff,
  Trash2,
  ListFilter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface Review {
  id: string;
  rating: number;
  review_title: string | null;
  review_text: string | null;
  is_verified_downloader: boolean;
  helpful_count: number;
  status: "visible" | "hidden" | "removed";
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  reviewer_name: string;
  reviewer_avatar: string | null;
  note_title: string;
  note_id: string;
}

interface NoteItem {
  id: string;
  title: string;
}

interface ReviewsReceivedData {
  reviews: Review[];
  notesList: NoteItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export default function ReviewsReceivedClient({
  initialData,
  activeFilters,
}: {
  initialData: ReviewsReceivedData;
  activeFilters: {
    noteId?: string;
    star?: number;
    sortBy?: string;
    page?: number;
  };
}) {
  const router = useRouter();
  const { reviews, notesList, totalCount, totalPages, currentPage } = initialData;

  const [noteId, setNoteId] = useState(activeFilters.noteId || "");
  const [star, setStar] = useState(activeFilters.star ? String(activeFilters.star) : "");
  const [sortBy, setSortBy] = useState(activeFilters.sortBy || "newest");

  const applyFilters = (newNoteId = noteId, newStar = star, newSortBy = sortBy, newPage = 1) => {
    const params = new URLSearchParams();
    if (newNoteId) params.set("noteId", newNoteId);
    if (newStar) params.set("star", newStar);
    if (newSortBy) params.set("sortBy", newSortBy);
    if (newPage > 1) params.set("page", String(newPage));

    router.push(`/dashboard/my-uploads/reviews?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    applyFilters(noteId, star, sortBy, page);
  };

  const handleReset = () => {
    setNoteId("");
    setStar("");
    setSortBy("newest");
    router.push("/dashboard/my-uploads/reviews");
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-12 w-full">
      {/* Header Back Button */}
      <div className="flex items-center justify-between">
        <LinkButton href="/dashboard/my-uploads" icon={ChevronLeft} label="Back to My Uploads" />
        <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
          Uploader Reviews
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold tracking-tight text-zinc-100 flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-indigo-400" />
          Reviews Received
        </h1>
        <p className="text-zinc-400 text-xs">Read and analyze feedback received across all your uploaded notes.</p>
      </div>

      {/* Filter Bar */}
      <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-md">
        <CardContent className="p-4 flex flex-wrap gap-4 items-end">
          {/* Note selector */}
          <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Filter by Note</label>
            <select
              value={noteId}
              onChange={(e) => {
                setNoteId(e.target.value);
                applyFilters(e.target.value, star, sortBy, 1);
              }}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-300 focus:border-indigo-500/50 focus:outline-none"
            >
              <option value="">All Uploaded Notes</option>
              {notesList.map((n) => (
                <option key={n.id} value={n.id}>{n.title}</option>
              ))}
            </select>
          </div>

          {/* Star selector */}
          <div className="flex flex-col gap-1.5 w-full sm:w-[120px]">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Rating</label>
            <select
              value={star}
              onChange={(e) => {
                setStar(e.target.value);
                applyFilters(noteId, e.target.value, sortBy, 1);
              }}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-300 focus:border-indigo-500/50 focus:outline-none"
            >
              <option value="">All Stars</option>
              {[5, 4, 3, 2, 1].map((s) => (
                <option key={s} value={s}>{s} Stars</option>
              ))}
            </select>
          </div>

          {/* Sort selector */}
          <div className="flex flex-col gap-1.5 w-full sm:w-[150px]">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                applyFilters(noteId, star, e.target.value, 1);
              }}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-300 focus:border-indigo-500/50 focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
              <option value="helpful">Most Helpful</option>
            </select>
          </div>

          <Button
            variant="ghost"
            onClick={handleReset}
            className="text-xs h-10 px-4 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-200"
          >
            Reset
          </Button>
        </CardContent>
      </Card>

      {/* Review Count Summary */}
      <div className="text-xs text-zinc-500 font-semibold pl-1">
        Showing {reviews.length} of {totalCount} reviews
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <MessageSquare className="h-8 w-8 text-zinc-600" />
            <p className="text-zinc-400 text-sm font-semibold">No reviews found matching these filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.map((review) => (
            <Card 
              key={review.id} 
              className={`bg-zinc-900/30 border-zinc-800/60 hover:border-zinc-700/60 backdrop-blur-sm shadow-md transition-colors overflow-hidden ${
                review.status !== "visible" ? "opacity-60" : ""
              }`}
            >
              <CardContent className="p-5 flex flex-col gap-4">
                
                {/* Header: Reviewer Info + Rating */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-zinc-950 p-0.5 border border-zinc-800 flex items-center justify-center">
                      {review.reviewer_avatar ? (
                        <img 
                          src={review.reviewer_avatar} 
                          alt="Reviewer Avatar" 
                          className="h-full w-full rounded-full object-cover" 
                        />
                      ) : (
                        <span className="text-xs font-bold text-zinc-500">
                          {review.reviewer_name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200">{review.reviewer_name}</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        on note <span className="font-semibold text-zinc-450">{review.note_title}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5 bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1 rounded-lg">
                      <span className="text-xs font-extrabold text-yellow-500">{review.rating}</span>
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500 shrink-0" />
                    </div>
                  </div>
                </div>

                {/* Body: Title + Text */}
                <div className="flex flex-col gap-1.5 pl-1">
                  {review.review_title && (
                    <h5 className="font-bold text-sm text-zinc-100">{review.review_title}</h5>
                  )}
                  {review.review_text ? (
                    <p className="text-xs text-zinc-300 leading-relaxed italic">
                      &quot;{review.review_text}&quot;
                    </p>
                  ) : (
                    <p className="text-[10px] text-zinc-650 italic">No text provided for this review rating.</p>
                  )}
                </div>

                {/* Footer Badges & Stats */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800/40 text-[10px] text-zinc-500">
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Date */}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span suppressHydrationWarning>
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Edited Badge */}
                    {review.is_edited && (
                      <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-450 text-[9px] font-medium">
                        Edited
                      </span>
                    )}

                    {/* Verified Downloader Badge */}
                    {review.is_verified_downloader && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-bold uppercase tracking-wider text-[8px]">
                        <UserCheck className="h-3 w-3" /> Verified Downloader
                      </span>
                    )}

                    {/* Moderation Status */}
                    {review.status === "hidden" && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/25 font-bold uppercase tracking-wider text-[8px]">
                        <EyeOff className="h-3 w-3" /> Hidden text
                      </span>
                    )}

                    {review.status === "removed" && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/25 font-bold uppercase tracking-wider text-[8px]">
                        <Trash2 className="h-3 w-3" /> Removed from aggregates
                      </span>
                    )}
                  </div>

                  {/* Helpful votes */}
                  <div className="flex items-center gap-1 font-semibold text-zinc-400">
                    <ThumbsUp className="h-3.5 w-3.5 text-zinc-500" />
                    <span>{review.helpful_count} helpful</span>
                  </div>
                </div>

              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="border-zinc-800 text-zinc-400 h-8 text-xs gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
              </Button>
              <span className="text-xs text-zinc-500 font-bold">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="border-zinc-800 text-zinc-400 h-8 text-xs gap-1"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Simple Helper Button component to handle icon + text link rendering
function LinkButton({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  return (
    <Link href={href}>
      <Button
        variant="ghost"
        className="text-zinc-400 hover:text-zinc-50 hover:bg-zinc-900/50 rounded-xl gap-2 font-semibold h-10 px-4"
      >
        <Icon className="h-4 w-4" /> {label}
      </Button>
    </Link>
  );
}
import Link from "next/link";
