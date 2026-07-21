import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserAIUsage } from "@/app/actions/ai-usage";
import { fetchNoteDetailsAction } from "@/app/actions/notes";
import { getMyAIGenerations } from "@/app/actions/copilot-history";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SprintDashboardClient } from "@/components/study-copilot/sprint-dashboard-client";
import { Rocket, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Exam Sprint Mode - College Notes",
  description: "Guided premium exam revision workflow.",
};

export default async function SprintDashboardPage({ params }: { params: { noteId: string } }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const usageResult = await getUserAIUsage();
  if (!usageResult.success || !usageResult.data || !usageResult.data.isPremiumActive) {
    redirect("/dashboard/study-copilot/sprint"); // Sends them back to the locked view
  }

  const { noteId } = params;

  // 1. Fetch note details
  const noteResult = await fetchNoteDetailsAction(noteId);
  if (!noteResult.success || !("data" in noteResult) || !noteResult.data) {
    redirect("/dashboard/study-copilot/sprint");
  }
  const note = noteResult.data.note;

  // 2. Fetch all generations for this user and filter for this note
  const generationsResult = await getMyAIGenerations();
  const allGenerations = generationsResult.success ? generationsResult.data : [];
  const noteGenerations = allGenerations.filter(g => g.note_id === noteId);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans selection:bg-indigo-500/30">
      <Header />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 md:py-12 flex flex-col gap-8">
        
        {/* Back Link */}
        <Link href="/dashboard/study-copilot/sprint" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 font-bold transition-colors w-fit text-sm">
          <ArrowLeft className="h-4 w-4" /> Back to Note Selection
        </Link>
        
        {/* Sprint Header */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-amber-500/20 p-6 md:p-8 rounded-3xl relative overflow-hidden flex flex-col gap-4 shadow-[0_4px_30px_rgba(245,158,11,0.05)]">
          <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-amber-500/5 to-transparent pointer-events-none" />
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] pointer-events-none">
            <Rocket className="h-48 w-48 text-amber-500" />
          </div>

          <div className="flex items-center gap-3 z-10">
            <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest flex items-center gap-1 w-fit">
              <Rocket className="h-3 w-3" /> Exam Sprint Active
            </span>
          </div>

          <div className="z-10 flex flex-col gap-1 max-w-2xl">
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight truncate">
              {note.title}
            </h1>
            {note.subjects && (
              <p className="text-sm text-zinc-400 font-medium">
                {note.subjects.name}
              </p>
            )}
          </div>
        </div>

        {/* Sprint Interactive Client */}
        <SprintDashboardClient 
          noteId={noteId} 
          noteTitle={note.title} 
          existingGenerations={noteGenerations}
          usageData={usageResult.data}
        />

      </main>
      <Footer />
    </div>
  );
}
