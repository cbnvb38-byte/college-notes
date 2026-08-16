import { Skeleton } from "@/components/ui/skeleton";

export default function StudyCopilotLoading() {
  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-50 overflow-hidden flex flex-col font-sans animate-pulse">
      {/* Decorative background skeleton */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none opacity-10 z-0">
        <div className="absolute top-[10%] left-[15%] w-[450px] h-[450px] rounded-full bg-indigo-600 blur-[130px]" />
      </div>

      <main className="flex-grow z-10 pt-6 pb-16 px-4 sm:px-6 max-w-7xl mx-auto w-full flex flex-col">
        {/* ── Desktop Layout ── */}
        <div className="hidden lg:flex flex-col gap-12 w-full">
          {/* ── A. Hero Section ── */}
          <div className="flex flex-col lg:flex-row gap-12 items-center justify-between relative mb-8">
            <div className="flex flex-col gap-6 w-full lg:w-[55%] relative z-10">
              <Skeleton className="h-6 w-32 rounded-full bg-zinc-900" />
              <Skeleton className="h-16 w-3/4 bg-zinc-900 rounded-2xl" />
              <Skeleton className="h-6 w-5/6 bg-zinc-900" />
              
              <div className="flex flex-wrap gap-3 mt-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-36 bg-zinc-900 rounded-xl" />
                ))}
              </div>
            </div>

            <div className="w-full lg:w-[45%] relative h-[280px] sm:h-[340px] flex items-center justify-center">
              <div className="relative w-full h-full flex items-center justify-center">
                <Skeleton className="absolute w-48 h-56 rounded-2xl bg-zinc-900/50" style={{ transform: "rotateX(15deg) rotateY(-25deg) rotateZ(-5deg) translateZ(-80px) translateX(30px)" }} />
                <Skeleton className="absolute w-56 h-64 rounded-3xl bg-zinc-800" style={{ transform: "rotateX(10deg) rotateY(-15deg) translateZ(0px)" }} />
              </div>
            </div>
          </div>

          {/* ── B. Plan Status Area ── */}
          <div className="mb-4">
            <Skeleton className="h-40 w-full rounded-3xl bg-zinc-900" />
          </div>

          {/* ── B.5 Exam Sprint Mode ── */}
          <div className="mb-10">
            <div className="flex items-center gap-3 px-2 mb-6">
              <Skeleton className="h-10 w-10 rounded-xl bg-zinc-900" />
              <Skeleton className="h-8 w-48 bg-zinc-900" />
            </div>
            <Skeleton className="h-48 w-full rounded-3xl bg-zinc-900" />
          </div>

          {/* ── C. AI Tool Dock ── */}
          <div className="flex flex-col gap-5 mt-4 mb-14">
            <div className="flex items-center gap-3 px-2 mb-2">
              <Skeleton className="h-10 w-10 rounded-xl bg-zinc-900" />
              <Skeleton className="h-8 w-40 bg-zinc-900" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-56 rounded-3xl bg-zinc-900" />
              ))}
            </div>
          </div>

          {/* ── C. Saved Study Library ── */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between px-2">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl bg-zinc-900" />
                  <Skeleton className="h-8 w-56 bg-zinc-900" />
                </div>
                <Skeleton className="h-5 w-96 bg-zinc-900" />
              </div>
            </div>
            <Skeleton className="h-64 w-full rounded-3xl bg-zinc-900/50 border border-zinc-800/50" />
          </div>

          {/* ── D. Premium Study Boosters ── */}
          <div className="flex flex-col gap-6 mt-8">
            <div className="mb-2 flex items-start justify-between gap-4 px-2">
              <div>
                <Skeleton className="h-8 w-64 bg-zinc-900 mb-2" />
                <Skeleton className="h-5 w-80 bg-zinc-900" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-2xl bg-zinc-900/60" />
              ))}
            </div>
          </div>
        </div>

        {/* ── Mobile Layout ── */}
        <div className="flex lg:hidden flex-col gap-6 w-full pt-4">
          <div className="flex flex-col gap-3 relative z-10">
            <Skeleton className="h-6 w-32 rounded-full bg-zinc-900" />
            <Skeleton className="h-10 w-48 bg-zinc-900" />
            <Skeleton className="h-5 w-64 bg-zinc-900" />
          </div>
          
          <Skeleton className="h-32 w-full rounded-3xl bg-zinc-900" />
          <Skeleton className="h-48 w-full rounded-3xl bg-zinc-900/60 border border-zinc-800/80" />
          
          <div className="flex flex-col gap-6 mt-6">
            <div className="flex items-center gap-2 pl-1 mb-1">
              <Skeleton className="h-8 w-8 rounded-lg bg-zinc-900" />
              <Skeleton className="h-6 w-32 bg-zinc-900" />
            </div>
            <div className="flex flex-col gap-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-3xl bg-zinc-900/40" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
