import { Card } from "@/components/ui/card";
import { Sparkles, TrendingUp, Download, Eye, GraduationCap, History } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export function DiscoverySections({
  recommendedNotes,
  trendingNotes,
  recentlyViewedNotes,
}: {
  recommendedNotes: any[];
  trendingNotes: any[];
  recentlyViewedNotes?: any[];
}) {
  // If everything is completely empty or unavailable, and recently viewed is undefined, we could return null,
  // but we want to show the empty state for recently viewed if it's an empty array.
  if (recommendedNotes.length === 0 && trendingNotes.length === 0 && recentlyViewedNotes === undefined) return null;

  return (
    <div className="flex flex-col gap-8 mb-4">
      {recentlyViewedNotes !== undefined && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            Recently Viewed <History className="h-4 w-4 text-zinc-400" />
          </h2>
          {recentlyViewedNotes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {recentlyViewedNotes.slice(0, 4).map(note => <NoteMiniCard key={note.id} note={note} />)}
            </div>
          ) : (
            <Card className="border border-zinc-800/60 bg-zinc-900/35 p-6 rounded-xl flex items-center justify-center text-zinc-400 text-sm">
              No recently viewed notes yet.
            </Card>
          )}
        </div>
      )}

      {recommendedNotes.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            Recommended for You <Sparkles className="h-4 w-4 text-indigo-400" />
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendedNotes.slice(0, 3).map(note => <NoteMiniCard key={note.id} note={note} />)}
          </div>
        </div>
      )}

      {trendingNotes.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            Trending / Popular Notes <TrendingUp className="h-4 w-4 text-pink-400" />
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {trendingNotes.slice(0, 3).map(note => <NoteMiniCard key={note.id} note={note} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function NoteMiniCard({ note }: { note: any }) {
  return (
    <Card className="border border-zinc-800/60 bg-zinc-900/35 hover:bg-zinc-900/50 hover:border-indigo-500/25 p-4 rounded-xl flex flex-col justify-between transition-all duration-200 shadow-md group">
      <div className="flex flex-col gap-2">
        <h4 className="font-bold text-zinc-100 text-sm leading-snug line-clamp-1 group-hover:text-indigo-400 transition-colors duration-200">
          {note.title}
        </h4>
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
          <GraduationCap className="h-3 w-3" />
          <span className="truncate">{note.subjects?.name || "Unknown Subject"}</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">
          <span className="flex items-center gap-1"><Download className="h-3 w-3" /> {note.downloads_count}</span>
          <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {note.view_count}</span>
        </div>
      </div>
      <div className="mt-4 border-t border-zinc-800/50 pt-3">
        <Link
          href={`/notes/${note.id}`}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "w-full bg-zinc-800/30 text-zinc-300 hover:bg-indigo-600 hover:text-white border-zinc-800 text-[10px] py-1 h-7 rounded-lg"
          )}
        >
          View Note
        </Link>
      </div>
    </Card>
  );
}
