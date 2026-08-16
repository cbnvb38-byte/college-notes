import { Skeleton } from "@/components/ui/skeleton";

export default function BrowseNotesLoading() {
  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-12 animate-pulse">
      {/* Hero Section Skeleton */}
      <div className="relative overflow-hidden rounded-3xl bg-zinc-950/60 border border-zinc-800/80 p-8 md:p-12 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
          <div className="flex flex-col gap-4 max-w-2xl w-full">
            <Skeleton className="h-12 w-3/4 bg-zinc-800 rounded-xl" />
            <Skeleton className="h-6 w-full bg-zinc-800/80 rounded-lg mt-2" />
            <Skeleton className="h-6 w-5/6 bg-zinc-800/80 rounded-lg" />
            <div className="flex flex-wrap items-center gap-4 mt-4">
              <Skeleton className="h-12 w-40 bg-zinc-800 rounded-xl" />
              <Skeleton className="h-12 w-48 bg-zinc-800 rounded-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Discovery Sections Skeleton (Recommended/Trending) */}
      <div className="flex flex-col gap-10 mt-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex flex-col gap-4">
            <Skeleton className="h-8 w-64 bg-zinc-800 rounded-lg" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, j) => (
                <Skeleton key={j} className="h-64 bg-zinc-800/50 rounded-2xl" />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filters Area Skeleton */}
      <div className="flex flex-col gap-6 mt-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <Skeleton className="h-12 w-full md:w-96 bg-zinc-800 rounded-xl" />
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Skeleton className="h-10 w-24 bg-zinc-800 rounded-lg" />
            <Skeleton className="h-10 w-24 bg-zinc-800 rounded-lg" />
            <Skeleton className="h-10 w-24 bg-zinc-800 rounded-lg" />
          </div>
        </div>

        {/* Notes Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-72 bg-zinc-800/40 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
