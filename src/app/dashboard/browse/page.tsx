import { fetchBranches, fetchRecommendedNotesAction, fetchTrendingNotesAction, fetchRecentlyViewedNotesAction } from "@/app/actions/notes";
import BrowseNotesClient from "./browse-client";
import { DiscoverySections } from "./discovery-sections";
import { Sparkles, FileWarning } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Browse Study Notes - College Notes",
  description: "Browse verified academic guides, study handouts, and lecture notes from your peers.",
};

export default async function BrowseNotesPage() {
  // Fetch engineering branches, bookmarks, recommendations, trending, and recently viewed on server
  const [branchResult, recResult, trendResult, recentResult] = await Promise.allSettled([
    fetchBranches(),
    fetchRecommendedNotesAction(3),
    fetchTrendingNotesAction(3),
    fetchRecentlyViewedNotesAction(4)
  ]);

  const branchRes = branchResult.status === "fulfilled" ? branchResult.value : { success: false, error: "Failed to load branches" };
  const recRes = recResult.status === "fulfilled" ? recResult.value : { success: false, data: [] };
  const trendRes = trendResult.status === "fulfilled" ? trendResult.value : { success: false, data: [] };
  const recentRes = recentResult.status === "fulfilled" ? recentResult.value : { success: false, data: undefined };

  if (!branchRes.success || "error" in branchRes) {
    console.error("[BrowseNotesPage Server Fetch Error]:", "error" in branchRes ? branchRes.error : "Unknown error");
    return (
      <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-12">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent flex items-center gap-2">
            Notes Library <Sparkles className="h-5 w-5 text-indigo-400" />
          </h1>
        </div>
        <Card className="bg-red-500/5 border-red-500/20 text-red-400">
          <CardContent className="flex items-center gap-3 p-5 text-sm font-semibold">
            <FileWarning className="h-5 w-5 shrink-0" />
            <span>Failed to load database branches. Please reload the page or try again later.</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  const branches = ("data" in branchRes ? branchRes.data : []) || [];
  
  // Also fetch the current user's bookmarked notes for initial UI state
  const { getCurrentUserBookmarkedNoteIds } = await import("@/app/actions/bookmarks");
  const bookmarksRes = await getCurrentUserBookmarkedNoteIds();
  const initialBookmarkedIds = bookmarksRes.success && "data" in bookmarksRes ? bookmarksRes.data : [];

  const recommendedNotes = recRes.success && "data" in recRes ? recRes.data : [];
  const trendingNotes = trendRes.success && "data" in trendRes ? trendRes.data : [];
  const recentlyViewedNotes = recentRes.success && "data" in recentRes ? recentRes.data : undefined;

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent flex items-center gap-2">
          Notes Library <Sparkles className="h-5 w-5 text-indigo-400" />
        </h1>
        <p className="text-zinc-400 text-sm">
          Browse verified academic guides, study handouts, and lecture notes.
        </p>
      </div>

      <DiscoverySections 
        recommendedNotes={recommendedNotes} 
        trendingNotes={trendingNotes} 
        recentlyViewedNotes={recentlyViewedNotes} 
      />

      {/* Render the Client-Side Search, Filter, Sort and Paginated Notes Grid */}
      <BrowseNotesClient initialBranches={branches} initialBookmarkedIds={initialBookmarkedIds as string[]} />
    </div>
  );
}
