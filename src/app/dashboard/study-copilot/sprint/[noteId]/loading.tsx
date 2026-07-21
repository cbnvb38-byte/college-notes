import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Rocket, Loader2 } from "lucide-react";

export default function LoadingSprintDashboard() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans selection:bg-indigo-500/30">
      <Header />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 md:py-12 flex flex-col gap-8 items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-6 text-center animate-pulse">
          <div className="relative">
            <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl animate-pulse" />
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-amber-500 relative z-10">
              <Rocket className="h-10 w-10 animate-bounce" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-black text-white flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />
              Building your sprint dashboard...
            </h2>
            <p className="text-zinc-500 text-sm max-w-md mx-auto">
              Please wait while we check for existing study materials and construct your custom exam path.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
