import { getCurrentUserBookmarks } from "@/app/actions/bookmarks";
import BookmarksClient from "./bookmarks-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Bookmarks - College Notes",
  description: "Access your bookmarked study materials.",
};

export default async function BookmarksPage() {
  const res = await getCurrentUserBookmarks();
  
  if (!res.success) {
    const errorMsg = "error" in res && res.error ? (res.error as any).message || String(res.error) : "Unknown error";
    return (
      <div className="flex flex-col items-center justify-center pt-24 pb-16 px-6">
        <div className="bg-red-500/10 p-6 rounded-xl border border-red-500/20 max-w-lg text-center">
          <h3 className="text-red-400 font-bold mb-2">Error Loading Bookmarks</h3>
          <p className="text-red-400/80 text-sm">{errorMsg}</p>
        </div>
      </div>
    );
  }

  const bookmarks = "data" in res && res.data ? res.data : [];

  return (
    <Suspense fallback={<BookmarksSkeleton />}>
      <BookmarksClient initialBookmarks={bookmarks as any} />
    </Suspense>
  );
}

function BookmarksSkeleton() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12 animate-pulse">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-10 w-48 bg-zinc-800/50 rounded-lg" />
        <Skeleton className="h-4 w-72 bg-zinc-800/50 rounded-md" />
      </div>
      <div className="grid sm:grid-cols-2 gap-6 mt-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-56 w-full bg-zinc-800/50 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
