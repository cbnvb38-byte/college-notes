import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";

export default function MyUploadsLoading() {
  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent flex items-center gap-2">
          My Uploads
          <Sparkles className="h-5 w-5 text-indigo-400" />
        </h1>
        <p className="text-zinc-400 text-sm">
          Manage your contributed study materials, check their review status, and track engagement.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl overflow-hidden flex flex-col h-[280px]">
            <div className="p-5 flex-1 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <Skeleton className="h-12 w-12 rounded-xl bg-zinc-800/80 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-full bg-zinc-800/80" />
                  <Skeleton className="h-3 w-1/2 bg-zinc-800/80" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-6 w-24 rounded-full bg-zinc-800/80" />
                <Skeleton className="h-6 w-16 rounded-full bg-zinc-800/80" />
              </div>
              <div className="mt-auto space-y-2">
                <Skeleton className="h-3 w-3/4 bg-zinc-800/80" />
                <Skeleton className="h-3 w-1/3 bg-zinc-800/80" />
              </div>
            </div>
            <div className="bg-zinc-950/50 px-5 py-3 border-y border-zinc-800/50 flex gap-4">
              <Skeleton className="h-8 w-12 bg-zinc-800/80" />
              <Skeleton className="h-8 w-12 bg-zinc-800/80" />
              <Skeleton className="h-8 w-12 bg-zinc-800/80" />
            </div>
            <div className="p-3 bg-zinc-900/60 flex justify-between">
              <div className="flex gap-2">
                <Skeleton className="h-8 w-16 bg-zinc-800/80" />
                <Skeleton className="h-8 w-16 bg-zinc-800/80" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full bg-zinc-800/80" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
