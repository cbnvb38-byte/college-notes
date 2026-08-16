import { fetchBranches, fetchRecommendedNotesAction, fetchTrendingNotesAction, fetchRecentlyViewedNotesAction } from "@/app/actions/notes";
import { getCurrentUserBookmarkedNoteIds } from "@/app/actions/bookmarks";
import BrowseNotesClient from "./browse-client";
import { DiscoverySections } from "./discovery-sections";
import { Sparkles, FileWarning, UploadCloud, Bot } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Browse Study Notes - College Notes",
  description: "Browse verified academic guides, study handouts, and lecture notes from your peers.",
};

export default async function BrowseNotesPage() {
  // Fetch engineering branches, bookmarks, recommendations, trending, and recently viewed on server
  const [branchResult, recResult, trendResult, recentResult, bookmarksResult] = await Promise.allSettled([
    fetchBranches(),
    fetchRecommendedNotesAction(3),
    fetchTrendingNotesAction(3),
    fetchRecentlyViewedNotesAction(4),
    getCurrentUserBookmarkedNoteIds()
  ]);

  const branchRes = branchResult.status === "fulfilled" ? branchResult.value : { success: false, error: "Failed to load branches" };
  const recRes = recResult.status === "fulfilled" ? recResult.value : { success: false, data: [] };
  const trendRes = trendResult.status === "fulfilled" ? trendResult.value : { success: false, data: [] };
  const recentRes = recentResult.status === "fulfilled" ? recentResult.value : { success: false, data: undefined };
  const bookmarksRes = bookmarksResult.status === "fulfilled" ? bookmarksResult.value : { success: false, data: [] };

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
  
  // Extract bookmarked notes for initial UI state
  const initialBookmarkedIds = bookmarksRes.success && "data" in bookmarksRes ? bookmarksRes.data : [];

  const recommendedNotes = recRes.success && "data" in recRes ? recRes.data : [];
  const trendingNotes = trendRes.success && "data" in trendRes ? trendRes.data : [];
  const recentlyViewedNotes = recentRes.success && "data" in recentRes ? recentRes.data : undefined;

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-zinc-950/60 border border-zinc-800/80 p-8 md:p-12 shadow-2xl backdrop-blur-xl">
        {/* Background elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none transform translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-violet-600/10 rounded-full blur-[80px] pointer-events-none transform -translate-x-1/2 translate-y-1/2" />
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
          <div className="flex flex-col gap-4 max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white flex items-center gap-3">
              Explore College Notes <Sparkles className="h-8 w-8 text-indigo-400" />
            </h1>
            <p className="text-zinc-400 text-base md:text-lg font-medium leading-relaxed">
              Find approved notes by branch, semester, subject, and topic. Access a growing library of verified academic materials curated for your coursework.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <Link href="/dashboard/upload">
                <Button className="bg-white text-zinc-950 hover:bg-zinc-200 font-bold rounded-xl h-12 px-6 shadow-xl transition-all">
                  <UploadCloud className="mr-2 h-5 w-5" /> Upload Note
                </Button>
              </Link>
              <Link href="/dashboard/study-copilot">
                <Button variant="outline" className="border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 font-bold rounded-xl h-12 px-6 transition-all">
                  <Bot className="mr-2 h-5 w-5" /> Open Study Copilot
                </Button>
              </Link>
            </div>
          </div>
        </div>
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
