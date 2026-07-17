"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  FileText,
  Download,
  Eye,
  Calendar,
  User,
  GraduationCap,
  Sparkles,
  ArrowLeft,
  Star,
  FileWarning,
  Loader2,
  ExternalLink,
  BookOpen,
  Bookmark,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { incrementViewCountAction, logDownloadAction, recordRecentlyViewedAction } from "@/app/actions/notes";
import { addBookmark, removeBookmark } from "@/app/actions/bookmarks";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { submitRating, removeRating } from "@/app/actions/ratings";
import { ReviewsSection } from "./reviews-section";
import { reportNote } from "@/app/actions/reports";
import { STUDY_TOOLS } from "@/lib/ai/study-tools";
interface RelatedNote {
  id: string;
  title: string;
  semester: number;
  downloads_count: number;
  view_count: number;
  created_at: string;
  subjects: {
    name: string;
    branches: {
      name: string;
      code: string;
    } | null;
  } | null;
}

interface NoteDetails {
  id: string;
  title: string;
  description: string | null;
  semester: number;
  college: string | null;
  professor: string | null;
  downloads_count: number;
  bookmarks_count: number;
  view_count: number;
  created_at: string;
  file_url: string;
  file_size: number;
  profiles: {
    name: string | null;
  } | null;
  author_id: string;
  subjects: {
    id: string;
    name: string;
    code: string;
    branches: {
      id: string;
      name: string;
      code: string;
    } | null;
  } | null;
}

export default function NoteDetailsClient({
  initialNote,
  initialAverageRating,
  initialRatingCount,
  initialRelatedNotes,
  initialIsBookmarked,
  initialUserRating,
  initialTotalReviews,
  initialDistribution,
  initialUserReviewTitle,
  initialUserReviewText,
}: {
  initialNote: NoteDetails;
  initialAverageRating: number;
  initialRatingCount: number;
  initialTotalReviews: number;
  initialDistribution: Record<number, number>;
  initialRelatedNotes: RelatedNote[];
  initialIsBookmarked: boolean;
  initialUserRating: number;
  initialUserReviewTitle: string;
  initialUserReviewText: string;
}) {
  const { userId } = useAuth();
  const isAuthor = userId === initialNote.author_id;
  const [showMoreTools, setShowMoreTools] = useState(false);

  // Counters & Interactive States
  const [note, setNote] = useState<NoteDetails>(initialNote);
  const [averageRating, setAverageRating] = useState<number>(initialAverageRating);
  const [ratingCount, setRatingCount] = useState<number>(initialRatingCount);
  const [totalReviews, setTotalReviews] = useState<number>(initialTotalReviews);
  const [distribution, setDistribution] = useState<Record<number, number>>(initialDistribution);
  
  const [userRating, setUserRating] = useState<number>(initialUserRating);
  const [userReviewTitle, setUserReviewTitle] = useState<string>(initialUserReviewTitle);
  const [userReviewText, setUserReviewText] = useState<string>(initialUserReviewText);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [isRating, setIsRating] = useState(false);
  const [relatedNotes] = useState<RelatedNote[]>(initialRelatedNotes);

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [isBookmarking, setIsBookmarking] = useState(false);

  // Report Note state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const handleToggleBookmark = async () => {
    if (isBookmarking) return; // Guard against rapid clicks

    try {
      setIsBookmarking(true);
      const currentlyBookmarked = isBookmarked;
      
      // Optimistic Update
      setIsBookmarked(!currentlyBookmarked);
      setNote((prev) => ({
        ...prev,
        bookmarks_count: prev.bookmarks_count + (currentlyBookmarked ? -1 : 1),
      }));

      const res = currentlyBookmarked
        ? await removeBookmark(note.id)
        : await addBookmark(note.id);

      if (!res.success) {
        // Revert Optimistic Update
        setIsBookmarked(currentlyBookmarked);
        setNote((prev) => ({
          ...prev,
          bookmarks_count: prev.bookmarks_count + (currentlyBookmarked ? 1 : -1),
        }));
        toast.error(`Failed to ${currentlyBookmarked ? "remove" : "add"} bookmark.`);
      } else {
        toast.success(currentlyBookmarked ? "Bookmark removed" : "Bookmark added");
      }
    } catch {
      toast.error("An error occurred while bookmarking.");
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleRatingUpdate = (avg: number, count: number, totalRevs: number, dist: Record<number, number>) => {
    setAverageRating(avg);
    setRatingCount(count);
    setTotalReviews(totalRevs);
    setDistribution(dist);
  };
  // Record recently viewed once per page load for logged in users
  const hasRecordedView = useRef(false);
  useEffect(() => {
    if (hasRecordedView.current || !userId) return;
    hasRecordedView.current = true;
    
    // Fire and forget, failure won't break page
    recordRecentlyViewedAction(note.id).catch(() => {});
  }, [note.id, userId]);


  // Increment view count exactly once per session
  useEffect(() => {
    const sessionKey = `viewed_note_${note.id}`;
    if (sessionStorage.getItem(sessionKey)) {
      return;
    }
    
    // Set synchronously to prevent React Strict Mode from firing it twice concurrently
    sessionStorage.setItem(sessionKey, "pending");

    async function incrementView() {
      try {
        const res = await incrementViewCountAction(note.id);
        if (res.success) {
          // Increment locally
          setNote((prev) => ({ ...prev, view_count: prev.view_count + 1 }));
          sessionStorage.setItem(sessionKey, "true");
        } else {
          sessionStorage.removeItem(sessionKey);
        }
      } catch (err) {
        console.error("Failed to increment view count:", err);
        sessionStorage.removeItem(sessionKey);
      }
    }

    incrementView();
  }, [note.id]);

  // Handle Note Download
  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      setDownloadError("");

      const res = await logDownloadAction(note.id);

      if (res.success && "data" in res && res.data) {
        const fileUrl = res.data.fileUrl;
        
        // Trigger direct browser download
        const link = document.createElement("a");
        link.href = fileUrl;
        link.setAttribute("download", `${note.title.replace(/\s+/g, "_")}.pdf`);
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Increment local download counter
        setNote((prev) => ({ ...prev, downloads_count: prev.downloads_count + 1 }));
      } else {
        const errObj = "error" in res ? res.error : null;
        throw new Error(errObj?.message || "Failed to log download.");
      }
    } catch (err) {
      console.error("[Download Error]:", err);
      setDownloadError(err instanceof Error ? err.message : "Unable to download note. Please try again later.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason) {
      toast.error("Please select a reason for reporting.");
      return;
    }
    if (reportReason === "Other" && !reportDetails.trim()) {
      toast.error("Please provide additional details for the 'Other' reason.");
      return;
    }
    if (reportDetails.length > 1000) {
      toast.error("Details cannot exceed 1000 characters.");
      return;
    }

    try {
      setIsSubmittingReport(true);
      const res = await reportNote(note.id, reportReason, reportDetails);
      if (res.success) {
        toast.success("Note reported successfully. Thank you for your feedback.");
        setIsReportModalOpen(false);
        setReportReason("");
        setReportDetails("");
      } else {
        const err = "error" in res ? res.error : null;
        toast.error(err?.message || "Failed to submit report.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred while submitting the report.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Convert bytes to MB helper
  const formatFileSize = (bytes: number) => {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header Back Button */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/browse">
          <Button
            variant="ghost"
            className="text-zinc-400 hover:text-zinc-50 hover:bg-zinc-900/50 rounded-xl gap-2 font-semibold h-10 px-4"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Library
          </Button>
        </Link>

        <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
          {note.subjects?.branches?.code || "Branch"} &bull; Sem {note.semester}
        </span>
      </div>

      {downloadError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 text-sm font-semibold">
          <FileWarning className="h-5 w-5 shrink-0" />
          {downloadError}
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: PDF Preview (2 Columns on large screens) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-md overflow-hidden h-[600px] flex flex-col shadow-2xl relative">
            <CardHeader className="pb-4 border-b border-zinc-800/40 flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-400" />
                <CardTitle className="text-sm font-bold text-zinc-100 font-sans">Document Preview</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={isDownloading}
                className="border-zinc-800 text-zinc-300 hover:bg-zinc-850 h-8 gap-1 text-xs rounded-lg font-bold disabled:opacity-50"
              >
                {isDownloading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>Open in New Tab <ExternalLink className="h-3.5 w-3.5" /></>
                )}
              </Button>
            </CardHeader>
            <CardContent className="flex-1 p-0 relative">
              {!previewError ? (
                <iframe
                  src={`${note.file_url}#toolbar=0`}
                  onError={() => setPreviewError(true)}
                  className="w-full h-full border-none"
                  title={note.title}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center gap-4">
                  <div className="bg-zinc-950/60 p-4 rounded-full border border-zinc-800/50">
                    <FileText className="h-8 w-8 text-zinc-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-200">Unable to load preview</h3>
                    <p className="text-xs text-zinc-500 max-w-xs mt-1">
                      Your browser does not support inline PDF previews or blocks them. Click below to view the document.
                    </p>
                  </div>
                  <Button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-2 rounded-xl font-bold h-9 disabled:opacity-50"
                  >
                    {isDownloading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    ) : null}
                    Open PDF Document
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Note Metadata & Info */}
        <div className="flex flex-col gap-6">
          <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-md shadow-2xl overflow-hidden flex flex-col justify-between">
            <CardHeader className="pb-4 border-b border-zinc-800/40 flex flex-col gap-2">
              <h1 className="text-xl font-extrabold text-zinc-100 leading-tight">
                {note.title}
              </h1>
              {note.description && (
                <p className="text-zinc-400 text-xs leading-relaxed mt-1">
                  {note.description}
                </p>
              )}
            </CardHeader>

            <CardContent className="pt-6 flex flex-col gap-5">
              {/* Info Rows */}
              <div className="flex flex-col gap-3.5 text-xs">
                {/* Subject Info */}
                <div className="flex items-center justify-between py-2 border-b border-zinc-800/40">
                  <span className="text-zinc-500 font-semibold flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4 shrink-0 text-zinc-600" /> Subject
                  </span>
                  <span className="text-zinc-200 font-bold text-right truncate max-w-[180px]">
                    {note.subjects?.name || "N/A"}
                  </span>
                </div>

                {/* Branch Info */}
                <div className="flex items-center justify-between py-2 border-b border-zinc-800/40">
                  <span className="text-zinc-500 font-semibold flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 shrink-0 text-zinc-600" /> Branch
                  </span>
                  <span className="text-zinc-200 font-bold text-right truncate max-w-[180px]">
                    {note.subjects?.branches?.name || "N/A"}
                  </span>
                </div>

                {/* College Info */}
                {note.college && (
                  <div className="flex items-center justify-between py-2 border-b border-zinc-800/40">
                    <span className="text-zinc-500 font-semibold flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4 shrink-0 text-zinc-600" /> College
                    </span>
                    <span className="text-zinc-200 font-bold text-right truncate max-w-[180px]">
                      {note.college}
                    </span>
                  </div>
                )}

                {/* Professor Info */}
                {note.professor && (
                  <div className="flex items-center justify-between py-2 border-b border-zinc-800/40">
                    <span className="text-zinc-500 font-semibold flex items-center gap-1.5">
                      <User className="h-4 w-4 shrink-0 text-zinc-600" /> Professor
                    </span>
                    <span className="text-zinc-200 font-bold text-right truncate max-w-[180px]">
                      {note.professor}
                    </span>
                  </div>
                )}

                {/* Uploader Info */}
                <div className="flex items-center justify-between py-2 border-b border-zinc-800/40">
                  <span className="text-zinc-500 font-semibold flex items-center gap-1.5">
                    <User className="h-4 w-4 shrink-0 text-zinc-600" /> Contributor
                  </span>
                  <span className="text-zinc-200 font-bold text-right truncate max-w-[180px]">
                    {note.author_id ? (
                      <Link 
                        href={`/contributors/${note.author_id}`}
                        className="text-indigo-400 hover:text-indigo-300 hover:underline font-semibold"
                      >
                        {note.profiles?.name || "Anonymous"}
                      </Link>
                    ) : (
                      note.profiles?.name || "Anonymous"
                    )}
                  </span>
                </div>

                {/* File Details */}
                <div className="flex items-center justify-between py-2 border-b border-zinc-800/40">
                  <span className="text-zinc-500 font-semibold flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 shrink-0 text-zinc-600" /> Upload Date
                  </span>
                  <span className="text-zinc-200 font-bold" suppressHydrationWarning>
                    {new Date(note.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-zinc-800/40">
                  <span className="text-zinc-500 font-semibold flex items-center gap-1.5">
                    <FileText className="h-4 w-4 shrink-0 text-zinc-600" /> File Size
                  </span>
                  <span className="text-zinc-200 font-bold">
                    {formatFileSize(note.file_size)}
                  </span>
                </div>

              </div>

              {/* Statistics Grid */}
              <div className="bg-zinc-950/60 px-5 py-4 border border-zinc-800/50 rounded-xl grid grid-cols-2 gap-2 divide-x divide-zinc-800/50 text-center">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-zinc-200 flex items-center justify-center gap-1">
                    <Eye className="h-4 w-4 text-zinc-500" /> {note.view_count}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 mt-1">Total Views</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-zinc-200 flex items-center justify-center gap-1">
                    <Download className="h-4 w-4 text-zinc-500" /> {note.downloads_count}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 mt-1">Downloads</span>
                </div>
              </div>

              {/* Actions Grid */}
              <div className="flex flex-col gap-3 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={handleToggleBookmark}
                    disabled={isBookmarking}
                    variant="outline"
                    className={`w-full font-bold flex items-center justify-center gap-2 rounded-xl text-sm py-6 shadow-xl transition-all active:scale-[0.98] ${
                      isBookmarked 
                        ? "bg-pink-500/10 text-pink-500 border-pink-500/20 hover:bg-pink-500/20" 
                        : "border-zinc-800 text-zinc-300 hover:bg-zinc-800/30"
                    }`}
                  >
                    {isBookmarking ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Bookmark className={`h-5 w-5 ${isBookmarked ? "fill-pink-500" : ""}`} /> 
                        {isBookmarked ? "Saved" : "Save Note"}
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-2 rounded-xl text-sm py-6 shadow-xl shadow-indigo-500/10 disabled:opacity-50 transition-all active:scale-[0.98]"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" /> Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="h-5 w-5" /> Download PDF
                      </>
                    )}
                  </Button>
                </div>
                {userId && (
                  <Button
                    onClick={() => setIsReportModalOpen(true)}
                    disabled={isAuthor}
                    variant="outline"
                    className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 font-bold flex items-center justify-center gap-2 rounded-xl text-sm py-6 shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    title={isAuthor ? "You cannot report your own note." : undefined}
                  >
                    <FileWarning className="h-5 w-5" /> Report Note
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Study Copilot Foundation Panel */}
          <Card className="bg-zinc-900/40 border-zinc-800/60 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col mt-2">
            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/5 pointer-events-none" />
            
            <CardHeader className="pb-4 border-b border-zinc-800/40 relative z-10 flex flex-row items-start gap-3">
              <div className="bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-500/20 shrink-0">
                <Sparkles className="h-5 w-5 text-indigo-400" />
              </div>
              <div className="flex flex-col">
                <CardTitle className="text-sm font-bold text-zinc-100 leading-tight">Study Copilot for this note</CardTitle>
                <p className="text-[10px] text-zinc-400 mt-1">Generate study material from this uploaded PDF.</p>
              </div>
            </CardHeader>

            <CardContent className="pt-4 pb-5 flex flex-col gap-4 relative z-10">
              
              {/* Primary Tools */}
              <div className="flex flex-col gap-2.5">
                {STUDY_TOOLS.filter(t => t.priority === "primary").map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <Button
                      key={tool.id}
                      disabled={!tool.enabled}
                      variant="outline"
                      className="w-full justify-start border-zinc-800/60 text-zinc-300 h-auto py-3 px-3.5 relative overflow-hidden bg-zinc-950/50 flex flex-col items-start gap-1.5 hover:bg-zinc-900/80 hover:border-indigo-500/30 transition-all"
                      onClick={() => {
                        if (!tool.enabled) {
                          toast.info(`This tool will be enabled in a later Phase 8 step.`);
                        }
                      }}
                    >
                      <span className="flex items-center justify-between w-full">
                        <span className="flex items-center gap-2 font-bold text-xs text-zinc-100">
                          <Icon className="h-4 w-4 text-indigo-400" /> {tool.title}
                        </span>
                        <span className="text-[9px] bg-zinc-800/80 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700 font-bold uppercase tracking-wider">
                          {tool.status}
                        </span>
                      </span>
                      <span className="text-[10px] text-zinc-500 text-left pl-6 w-full whitespace-normal">
                        {tool.description}
                      </span>
                    </Button>
                  );
                })}
              </div>

              {/* Secondary Tools Toggle */}
              <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800/40">
                <button 
                  onClick={() => setShowMoreTools(!showMoreTools)}
                  className="flex items-center justify-between w-full py-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  <span>More study tools</span>
                  {showMoreTools ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {showMoreTools && (
                  <div className="grid grid-cols-2 gap-2 mt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    {STUDY_TOOLS.filter(t => t.priority === "secondary").map((tool) => {
                      const Icon = tool.icon;
                      return (
                        <Button
                          key={tool.id}
                          disabled={!tool.enabled}
                          variant="outline"
                          className="w-full justify-start border-zinc-800/50 text-zinc-400 h-auto py-2.5 px-3 bg-zinc-950/30 flex flex-col items-start gap-1 hover:bg-zinc-900/60"
                          onClick={() => {
                            if (!tool.enabled) {
                              toast.info("This tool will be enabled in a later Phase 8 step.");
                            }
                          }}
                        >
                          <span className="flex items-center gap-1.5 font-bold text-[11px] text-zinc-300">
                            <Icon className="h-3 w-3" /> <span className="truncate">{tool.title}</span>
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
              
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reviews Section */}
      <ReviewsSection 
        noteId={note.id}
        isAuthor={isAuthor}
        averageRating={averageRating}
        ratingCount={ratingCount}
        totalReviews={totalReviews}
        distribution={distribution}
        initialUserRating={userRating}
        initialUserReviewTitle={userReviewTitle}
        initialUserReviewText={userReviewText}
        onRatingUpdate={handleRatingUpdate}
      />

      {/* Related Notes Section */}
      <div className="flex flex-col gap-5 pt-8 border-t border-zinc-800/40">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-500/10 text-indigo-400 p-2 rounded-xl border border-indigo-500/20">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-base text-zinc-100 font-sans">Related Study Materials</h3>
            <p className="text-xs text-zinc-500">Other approved notes matching this subject or semester.</p>
          </div>
        </div>

        {relatedNotes.length === 0 ? (
          <div className="text-sm text-zinc-500 py-6 text-center border border-dashed border-zinc-800 rounded-2xl">
            No related notes available at this time.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {relatedNotes.map((relNote) => (
              <Link key={relNote.id} href={`/notes/${relNote.id}`}>
                <Card className="border border-zinc-800/60 bg-zinc-900/20 hover:bg-zinc-900/45 hover:border-indigo-500/25 p-4 rounded-xl flex flex-col justify-between h-full transition-all duration-200 group cursor-pointer shadow-md">
                  <div className="flex flex-col gap-2">
                    <span className="text-[8px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider self-start">
                      {relNote.subjects?.branches?.code || "Branch"} &bull; Sem {relNote.semester}
                    </span>
                    <h5 className="font-bold text-zinc-200 text-xs line-clamp-1 group-hover:text-indigo-400 transition-colors duration-200">
                      {relNote.title}
                    </h5>
                    <p className="text-[10px] text-zinc-500 truncate">
                      {relNote.subjects?.name}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-zinc-500 pt-3 mt-3 border-t border-zinc-800/40">
                    <span>{relNote.downloads_count} downloads</span>
                    <span suppressHydrationWarning>{new Date(relNote.created_at).toLocaleDateString()}</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {isReportModalOpen && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-zinc-900 border-zinc-800 w-full max-w-md shadow-2xl overflow-hidden">
            <CardHeader className="border-b border-zinc-800/40">
              <CardTitle className="text-sm font-bold text-red-400 flex items-center gap-2">
                <FileWarning className="h-4 w-4" /> Report Note
              </CardTitle>
            </CardHeader>
            <form onSubmit={handleSubmitReport}>
              <CardContent className="pt-4 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-400">Reason</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-sm text-zinc-200 focus:border-red-500/50 focus:outline-none"
                  >
                    <option value="" disabled>Select a reason...</option>
                    <option value="Incorrect information">Incorrect information</option>
                    <option value="Copyright concern">Copyright concern</option>
                    <option value="Duplicate content">Duplicate content</option>
                    <option value="Inappropriate content">Inappropriate content</option>
                    <option value="Broken or unreadable file">Broken or unreadable file</option>
                    <option value="Wrong subject or semester">Wrong subject or semester</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-400">
                    Details {reportReason !== "Other" && <span className="text-zinc-650 font-normal">(optional)</span>}
                  </label>
                  <textarea
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    required={reportReason === "Other"}
                    maxLength={1000}
                    placeholder={
                      reportReason === "Other"
                        ? "Please specify the details (required)..."
                        : "Provide additional details (optional)..."
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-red-500/50 focus:outline-none min-h-[120px] resize-none"
                  />
                  <div className="text-[10px] text-zinc-600 text-right">
                    {reportDetails.length}/1000 characters
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-2 border-t border-zinc-800/40">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsReportModalOpen(false);
                      setReportReason("");
                      setReportDetails("");
                    }}
                    className="border-zinc-800 text-zinc-400 text-xs h-8"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmittingReport || !reportReason || (reportReason === "Other" && !reportDetails.trim())}
                    className="bg-red-600 hover:bg-red-500 text-white text-xs h-8 gap-1 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingReport ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" /> Submitting...
                      </>
                    ) : (
                      "Submit Report"
                    )}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
