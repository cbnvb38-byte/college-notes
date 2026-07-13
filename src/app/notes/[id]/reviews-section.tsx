"use client";

import { useState, useEffect } from "react";
import { Star, MessageSquare, ThumbsUp, Trash2, CheckCircle2, Edit2, AlertCircle, Filter, X, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { submitRating, removeRating, toggleHelpfulVote, getReviewsForNote, reportReview, ReviewFilterOptions } from "@/app/actions/ratings";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@clerk/nextjs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

interface Review {
  id: string;
  user_id: string;
  rating: number;
  review_title: string | null;
  review_text: string | null;
  is_verified_downloader: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  isHelpfulByMe: boolean;
  profiles: {
    name: string | null;
    avatar_url: string | null;
  } | null;
}

export function ReviewsSection({
  noteId,
  isAuthor,
  averageRating,
  ratingCount,
  totalReviews,
  distribution,
  initialUserRating,
  initialUserReviewTitle,
  initialUserReviewText,
  onRatingUpdate
}: {
  noteId: string;
  isAuthor: boolean;
  averageRating: number;
  ratingCount: number;
  totalReviews: number;
  distribution: Record<number, number>;
  initialUserRating: number;
  initialUserReviewTitle: string;
  initialUserReviewText: string;
  onRatingUpdate: (avg: number, count: number, totalRevs: number, dist: Record<number, number>) => void;
}) {
  const { userId } = useAuth();
  const [userRating, setUserRating] = useState(initialUserRating);
  const [userReviewTitle, setUserReviewTitle] = useState(initialUserReviewTitle ?? "");
  const [userReviewText, setUserReviewText] = useState(initialUserReviewText ?? "");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(initialUserReviewText !== "" || initialUserReviewTitle !== "");
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  
  const [filters, setFilters] = useState<ReviewFilterOptions>({
    sortBy: "helpful",
    page: 1,
    limit: 10
  });

  const [reportingReviewId, setReportingReviewId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("Spam");
  const [reportDetails, setReportDetails] = useState("");
  const [isReporting, setIsReporting] = useState(false);

  const loadReviews = async (opts: ReviewFilterOptions = filters, append = false) => {
    try {
      setIsLoadingReviews(true);
      const res = await getReviewsForNote(noteId, opts);
      if (res.success && "data" in res && res.data) {
        if (append) {
          setReviews(prev => [...prev, ...res.data.reviews]);
        } else {
          setReviews(res.data.reviews);
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load reviews");
    } finally {
      setIsLoadingReviews(false);
    }
  };

  useEffect(() => {
    loadReviews(filters);
  }, [filters.sortBy, filters.star, filters.writtenOnly, filters.verifiedOnly]);

  const handleStarClick = async (star: number) => {
    if (isAuthor || isSubmitting) return;
    
    setIsSubmitting(true);
    const prev = userRating;
    setUserRating(star);
    try {
      const res = await submitRating(noteId, star, userReviewTitle.trim() || null, userReviewText.trim() || null);
      if (res.success && "data" in res && res.data) {
        onRatingUpdate(res.data.averageRating, res.data.ratingCount, res.data.totalReviews, res.data.distribution);
        toast.success(prev === 0 ? "Rating saved" : "Rating updated");
        if (prev === 0) setShowReviewForm(true); // Encourage writing a review
        loadReviews(filters, false); // Reload reviews
      } else {
        setUserRating(prev);
        toast.error("Failed to save rating");
      }
    } catch (e) {
      setUserRating(prev);
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (isAuthor || isSubmitting || userRating === 0) return;
    setIsSubmitting(true);
    try {
      const res = await submitRating(noteId, userRating, userReviewTitle.trim() || null, userReviewText.trim() || null);
      if (res.success && "data" in res && res.data) {
        onRatingUpdate(res.data.averageRating, res.data.ratingCount, res.data.totalReviews, res.data.distribution);
        toast.success("Review submitted");
        loadReviews(filters, false);
      } else {
        toast.error("Failed to submit review");
      }
    } catch (e) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleRemoveRating = async () => {
    if (isAuthor || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await removeRating(noteId);
      if (res.success && "data" in res && res.data) {
        setUserRating(0);
        setUserReviewTitle("");
        setUserReviewText("");
        setShowReviewForm(false);
        onRatingUpdate(res.data.averageRating, res.data.ratingCount, res.data.totalReviews, res.data.distribution);
        toast.success("Rating and review removed");
        loadReviews(filters, false);
      }
    } catch (e) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHelpful = async (reviewId: string) => {
    console.log("[Client] handleHelpful started, reviewId:", reviewId);
    try {
      const res = await toggleHelpfulVote(reviewId);
      console.log("[Client] toggleHelpfulVote response:", res);
      if (res.success && "isHelpful" in res) {
        setReviews(prev => prev.map(r => {
          if (r.id === reviewId) {
            return {
              ...r,
              isHelpfulByMe: res.isHelpful as boolean,
              helpful_count: r.helpful_count + (res.isHelpful ? 1 : -1)
            };
          }
          return r;
        }));
      } else {
        toast.error((res as any).error?.message || "Failed to vote");
      }
    } catch (e: any) {
      toast.error(e.message || "An error occurred");
    }
  };

  const handleReportSubmit = async () => {
    console.log("[Client] handleReportSubmit started. Reason:", reportReason, "ReviewID:", reportingReviewId);
    if (!reportingReviewId || isReporting) return;
    setIsReporting(true);
    try {
      const res = await reportReview(reportingReviewId, reportReason, reportDetails);
      console.log("[Client] reportReview response:", res);
      if (res.success) {
        toast.success("Review reported successfully");
        setReportingReviewId(null);
        setReportReason("Spam");
        setReportDetails("");
      } else {
        toast.error((res as any).error?.message || "Failed to report review");
      }
    } catch (e: any) {
      toast.error(e.message || "An error occurred");
    } finally {
      setIsReporting(false);
    }
  };

  const renderStars = (rating: number, interactive = false) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            disabled={!interactive || isAuthor || isSubmitting}
            onClick={() => interactive && handleStarClick(star)}
            className={`${interactive && !isAuthor ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
          >
            <Star 
              className={`h-5 w-5 ${
                rating >= star 
                  ? "text-yellow-500 fill-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]" 
                  : "text-zinc-700 fill-zinc-800/50"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full mt-12 flex flex-col gap-10">
      <div className="border-t border-zinc-800 pt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Rating Summary (Left Column) */}
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Customer Reviews</h2>
            <div className="flex items-center gap-3">
              {renderStars(Math.round(averageRating))}
              <span className="text-lg font-bold text-white">{averageRating.toFixed(1)} out of 5</span>
            </div>
            <p className="text-zinc-400 text-sm mt-1">{ratingCount} global ratings</p>
          </div>
          
          <div className="flex flex-col gap-3">
            {[5, 4, 3, 2, 1].map(star => {
              const count = distribution[star] || 0;
              const pct = ratingCount > 0 ? Math.round((count / ratingCount) * 100) : 0;
              return (
                <button 
                  key={star}
                  onClick={() => setFilters(f => ({ ...f, star: f.star === star ? undefined : star, page: 1 }))}
                  className="flex items-center gap-3 text-sm group"
                >
                  <span className="w-12 text-zinc-400 group-hover:text-yellow-500 transition-colors">{star} star</span>
                  <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-10 text-right text-zinc-400">{pct}%</span>
                </button>
              );
            })}
          </div>
          
          <div className="mt-4 pt-6 border-t border-zinc-800">
            <h3 className="font-semibold text-white mb-2">Review this note</h3>
            <p className="text-sm text-zinc-400 mb-4">Share your thoughts with other students</p>
            {isAuthor ? (
               <p className="text-sm text-red-400 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> You cannot rate your own note.</p>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  {renderStars(userRating, true)}
                  {userRating > 0 && (
                    <Button variant="ghost" size="sm" onClick={handleRemoveRating} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8">
                      Clear
                    </Button>
                  )}
                </div>
                {userRating > 0 && !showReviewForm && (
                  <Button variant="outline" className="w-full bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-white" onClick={() => setShowReviewForm(true)}>
                    Write a review
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Review Form & List (Right Column) */}
        <div className="md:col-span-2 flex flex-col gap-6">
          
          {/* Write Review Form */}
          {showReviewForm && !isAuthor && (
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl flex flex-col gap-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500" />
              <h3 className="font-semibold text-white">Write a Review</h3>
              
              <Input 
                placeholder="Review Title (e.g., Extremely helpful for midterms!)" 
                value={userReviewTitle ?? ""}
                onChange={e => setUserReviewTitle(e.target.value.substring(0, 100))}
                className="bg-zinc-950 border-zinc-800 text-white focus-visible:ring-yellow-500/50"
              />
              <Textarea 
                placeholder="What did you like or dislike? What should other students know before downloading?"
                value={userReviewText ?? ""}
                onChange={e => setUserReviewText(e.target.value.substring(0, 1000))}
                className="bg-zinc-950 border-zinc-800 text-white min-h-[120px] resize-none focus-visible:ring-yellow-500/50"
              />
              
              <div className="flex justify-end gap-3 mt-2">
                <Button variant="ghost" onClick={() => setShowReviewForm(false)} className="text-zinc-400 hover:text-white">
                  Cancel
                </Button>
                <Button 
                  onClick={handleReviewSubmit}
                  disabled={isSubmitting || userRating === 0}
                  className="bg-yellow-600 hover:bg-yellow-500 text-white font-semibold"
                >
                  {initialUserReviewText ? "Update Review" : "Submit Review"}
                </Button>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-zinc-800">
            <span className="text-sm font-medium text-zinc-400 flex items-center gap-2"><Filter className="w-4 h-4" /> Filter by:</span>
            {filters.star && (
              <span className="bg-yellow-500/20 text-yellow-500 text-xs px-3 py-1 rounded-full flex items-center gap-1 font-medium border border-yellow-500/20">
                {filters.star} Stars
                <button onClick={() => setFilters(f => ({ ...f, star: undefined, page: 1 }))}><X className="w-3 h-3 hover:text-yellow-300" /></button>
              </span>
            )}
            
            <select 
              value={filters.sortBy}
              onChange={e => setFilters(f => ({ ...f, sortBy: e.target.value as any, page: 1 }))}
              className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-1.5 outline-none focus:border-zinc-600"
            >
              <option value="helpful">Top Reviews</option>
              <option value="recent">Most Recent</option>
              <option value="high">Positive First</option>
              <option value="low">Critical First</option>
            </select>
          </div>

          {/* Reviews List */}
          <div className="flex flex-col gap-6">
            {isLoadingReviews && reviews.length === 0 ? (
              <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div></div>
            ) : reviews.length > 0 ? (
              reviews.filter(r => r.review_text || r.review_title).map(review => (
                <div key={review.id} className="flex flex-col gap-2 pb-6 border-b border-zinc-800/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border border-zinc-800">
                      <AvatarImage src={review.profiles?.avatar_url || ""} />
                      <AvatarFallback className="bg-zinc-800 text-xs text-zinc-400">
                        {review.profiles?.name?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-zinc-300">
                      {review.user_id ? (
                        <Link 
                          href={`/contributors/${review.user_id}`}
                          className="text-indigo-400 hover:text-indigo-300 hover:underline"
                        >
                          {review.profiles?.name || "Anonymous Student"}
                        </Link>
                      ) : (
                        review.profiles?.name || "Anonymous Student"
                      )}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 mt-1">
                    {renderStars(review.rating)}
                    {review.review_title && <span className="font-bold text-white text-sm">{review.review_title}</span>}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-zinc-500">Reviewed on {new Date(review.created_at).toLocaleDateString()}</span>
                    {review.is_verified_downloader && (
                      <span className="text-xs text-orange-400 font-medium flex items-center gap-1 bg-orange-500/10 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Verified Downloader
                      </span>
                    )}
                    {review.created_at !== review.updated_at && <span className="text-xs text-zinc-600">(Edited)</span>}
                  </div>
                  
                  {review.review_text && (
                    <p className="text-sm text-zinc-300 mt-2 whitespace-pre-wrap leading-relaxed">{review.review_text}</p>
                  )}
                  
                  <div className="flex items-center gap-4 mt-3">
                    <button 
                      onClick={() => handleHelpful(review.id)}
                      disabled={!userId || review.user_id === userId}
                      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors border ${
                        review.isHelpfulByMe 
                          ? "bg-zinc-800 text-white border-zinc-700" 
                          : "bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-zinc-200"
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${review.isHelpfulByMe ? "fill-white text-white" : ""}`} />
                      Helpful {review.helpful_count > 0 && `(${review.helpful_count})`}
                    </button>
                    
                    <button 
                      onClick={() => setReportingReviewId(review.id)}
                      disabled={!userId || review.user_id === userId}
                      className="text-xs text-zinc-500 hover:text-zinc-300 px-2 disabled:opacity-50"
                    >
                      Report Review
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 flex flex-col items-center gap-3">
                <MessageSquare className="w-12 h-12 text-zinc-800" />
                <p className="text-zinc-500 text-sm">No written reviews yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={!!reportingReviewId} onOpenChange={(open) => !open && setReportingReviewId(null)}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-50 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report Review</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Please select a reason for reporting this review.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-4 py-4">
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-zinc-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-zinc-600"
            >
              <option value="Spam">Spam</option>
              <option value="Abuse">Abuse</option>
              <option value="Irrelevant content">Irrelevant content</option>
              <option value="Offensive language">Offensive language</option>
              <option value="False or misleading information">False or misleading information</option>
              <option value="Other">Other</option>
            </select>
            
            {reportReason === "Other" && (
              <Textarea 
                placeholder="Please provide details..."
                value={reportDetails}
                onChange={e => setReportDetails(e.target.value.substring(0, 500))}
                className="bg-zinc-900 border-zinc-800 text-white min-h-[100px] resize-none focus-visible:ring-yellow-500/50"
              />
            )}
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReportingReviewId(null)} className="text-zinc-400 hover:text-white">
              Cancel
            </Button>
            <Button 
              onClick={handleReportSubmit}
              disabled={isReporting || (reportReason === "Other" && !reportDetails.trim())}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
