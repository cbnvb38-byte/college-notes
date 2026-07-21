import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserAIUsage } from "@/app/actions/ai-usage";
import { fetchRecentlyViewedNotesAction } from "@/app/actions/notes";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Rocket, FileText, ArrowRight, Lock, BookOpen } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Exam Sprint Mode - College Notes",
  description: "Guided premium exam revision workflow.",
};

export default async function SprintSelectorPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const usageResult = await getUserAIUsage();
  if (!usageResult.success || !usageResult.data) {
    redirect("/dashboard/study-copilot");
  }

  const { isPremiumActive } = usageResult.data;

  if (!isPremiumActive) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col font-sans selection:bg-indigo-500/30">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
          <div className="bg-zinc-900/50 border border-zinc-800/80 p-8 rounded-3xl flex flex-col items-center gap-6">
            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 text-amber-500">
              <Lock className="h-10 w-10" />
            </div>
            <h1 className="text-2xl font-black text-white">Exam Sprint Mode is Locked</h1>
            <p className="text-zinc-400 text-sm">
              Upgrade to Premium to unlock the guided revision workflow that builds a complete exam path from a single note.
            </p>
            <Link href="/pricing" className="w-full">
              <Button className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black h-12 rounded-xl">
                View Premium Plans
              </Button>
            </Link>
            <Link href="/dashboard/study-copilot" className="text-sm text-zinc-500 hover:text-zinc-300 font-bold transition-colors">
              Return to Study Copilot
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const recentNotesResult = await fetchRecentlyViewedNotesAction(10);
  const recentNotes = recentNotesResult?.success ? recentNotesResult.data : [];

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans selection:bg-indigo-500/30">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-12 md:py-20 flex flex-col gap-8">
        
        <div className="flex flex-col gap-4 text-center items-center">
          <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-500 mb-2">
            <Rocket className="h-8 w-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Select a Note to Sprint</h1>
          <p className="text-zinc-400 max-w-lg text-sm md:text-base leading-relaxed">
            Choose a note from your recent history to start the 4-step guided revision workflow.
          </p>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 flex flex-col gap-6 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-zinc-300 font-bold pb-4 border-b border-zinc-800/80">
            <BookOpen className="h-5 w-5 text-indigo-400" /> Recently Viewed Notes
          </div>

          {!recentNotes || recentNotes.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center gap-4 border border-dashed border-zinc-800 rounded-2xl">
              <FileText className="h-10 w-10 text-zinc-600" />
              <p className="text-zinc-400 font-medium">No recent notes found.</p>
              <Link href="/dashboard/browse">
                <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800">
                  Browse Notes First
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentNotes.map((note: any) => {
                if (!note) return null;
                return (
                  <Link href={`/dashboard/study-copilot/sprint/${note.id}`} key={note.id}>
                    <div className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 p-4 rounded-2xl flex items-center justify-between gap-4 transition-all group">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2.5 bg-zinc-900 rounded-xl border border-zinc-800 text-zinc-400 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-colors shrink-0">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col truncate">
                          <span className="text-sm font-bold text-zinc-200 truncate group-hover:text-white transition-colors">{note.title}</span>
                          {note.subjects && (
                            <span className="text-xs text-zinc-500 truncate">{note.subjects.name}</span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-indigo-400 transition-colors shrink-0" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
