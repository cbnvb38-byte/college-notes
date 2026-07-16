import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getStudyCopilotAccess, getAIGenerations } from "@/app/actions/copilot";
import { 
  Sparkles, 
  Crown, 
  Search, 
  BookOpen, 
  CalendarDays, 
  MessageCircleQuestion, 
  FileText, 
  ListChecks, 
  Layers,
  ArrowRight,
  Clock,
  Trash2
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Study Copilot | Dashboard",
};

export default async function StudyCopilotDashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [accessRes, generationsRes] = await Promise.all([
    getStudyCopilotAccess(),
    getAIGenerations(20) // Fetch top 20 recent generations
  ]);

  const access = accessRes.success && "data" in accessRes ? accessRes.data : null;
  const generations = generationsRes.success && "data" in generationsRes ? generationsRes.data : [];

  if (!access) {
    return <div className="p-8 text-center text-red-500">Failed to load copilot access data.</div>;
  }

  const isLocked = !access.hasAccess;
  const progressValue = (access.used / access.limit) * 100;

  return (
    <div className="flex flex-col gap-8 pb-12 animate-in fade-in duration-500">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/80 via-zinc-900 to-violet-950/80 border border-indigo-500/20 p-8 md:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-bold tracking-wide mb-6">
            <Sparkles className="h-4 w-4" /> PREMIUM FEATURE
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 mb-4 tracking-tight">
            Study Copilot
          </h1>
          <p className="text-lg text-zinc-400 font-medium mb-8 max-w-2xl">
            Summaries, quizzes, flashcards, and exam prep generated instantly from your notes. Turn reading into active learning.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/dashboard/browse">
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-12 px-6 rounded-xl shadow-lg shadow-indigo-500/25">
                <Search className="h-5 w-5 mr-2" /> Find a Note to Analyze
              </Button>
            </Link>
            <a href="#saved-materials">
              <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 h-12 px-6 rounded-xl font-bold">
                View Saved Materials
              </Button>
            </a>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Stats & Premium */}
        <div className="flex flex-col gap-6">
          {/* Usage Card */}
          <Card className="bg-zinc-900/50 border-zinc-800/80 shadow-xl overflow-hidden relative">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-bold text-zinc-200 text-lg flex items-center gap-2">
                    Monthly Usage
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">Resets 1st of every month</p>
                </div>
                {access.plan === 'premium' ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2.5 py-1 rounded-full shadow-lg shadow-orange-500/20 flex items-center gap-1">
                    <Crown className="h-3 w-3" /> Premium
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-300 border border-zinc-700 px-2.5 py-1 rounded-full">
                    Free Plan
                  </span>
                )}
              </div>

              <div className="mb-2 flex justify-between items-end">
                <span className={`text-3xl font-black ${isLocked ? 'text-red-400' : 'text-indigo-400'}`}>
                  {access.used} <span className="text-lg text-zinc-500 font-semibold">/ {access.limit}</span>
                </span>
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Generations</span>
              </div>
              <Progress value={progressValue} className="h-2.5 bg-zinc-800 rounded-full" />
              
              {isLocked && (
                <div className="mt-4 text-xs font-semibold text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20 flex items-center gap-2">
                  <span className="flex-1">You've reached your free limit for this month.</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Premium Upsell Card */}
          {access.plan !== 'premium' && (
            <Card className="bg-gradient-to-b from-indigo-950/40 to-zinc-950 border border-indigo-500/20 shadow-xl overflow-hidden relative group">
              <CardContent className="p-6 text-center">
                <div className="bg-indigo-500/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                  <Crown className="h-6 w-6 text-indigo-400" />
                </div>
                <h3 className="font-bold text-xl text-zinc-100 mb-2">Unlock Unlimited</h3>
                <p className="text-sm text-zinc-400 mb-6">
                  Get unlimited exam preparation tools, full PDF exports, and deeper AI analysis.
                </p>
                <Button className="w-full bg-white hover:bg-zinc-200 text-black font-black border-0 shadow-lg">
                  Payments coming in Phase 9
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Quick Tools Overview */}
          <Card className="bg-zinc-900/50 border-zinc-800/80 shadow-xl">
             <CardContent className="p-6">
               <h3 className="font-bold text-zinc-200 mb-4">Quick Tools</h3>
               <div className="flex flex-col gap-2 text-sm font-semibold">
                 <Link href="/dashboard/browse" className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 transition-colors border border-transparent hover:border-zinc-800">
                   <div className="bg-blue-500/10 p-2 rounded-lg"><FileText className="h-4 w-4 text-blue-400" /></div> Summarize a Note <ArrowRight className="h-4 w-4 ml-auto opacity-50" />
                 </Link>
                 <Link href="/dashboard/browse" className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 transition-colors border border-transparent hover:border-zinc-800">
                   <div className="bg-green-500/10 p-2 rounded-lg"><ListChecks className="h-4 w-4 text-green-400" /></div> Generate MCQs <ArrowRight className="h-4 w-4 ml-auto opacity-50" />
                 </Link>
                 <Link href="/dashboard/browse" className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 transition-colors border border-transparent hover:border-zinc-800">
                   <div className="bg-orange-500/10 p-2 rounded-lg"><Layers className="h-4 w-4 text-orange-400" /></div> Create Flashcards <ArrowRight className="h-4 w-4 ml-auto opacity-50" />
                 </Link>
                 <Link href="/dashboard/browse" className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 transition-colors border border-transparent hover:border-zinc-800">
                   <div className="bg-indigo-500/10 p-2 rounded-lg"><CalendarDays className="h-4 w-4 text-indigo-400" /></div> Make Revision Plan <ArrowRight className="h-4 w-4 ml-auto opacity-50" />
                 </Link>
               </div>
             </CardContent>
          </Card>
        </div>

        {/* Right Column: Saved Materials */}
        <div className="lg:col-span-2 flex flex-col gap-6" id="saved-materials">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-400" /> Saved Study Material
            </h2>
          </div>

          {generations.length === 0 ? (
            <Card className="bg-zinc-900/30 border-zinc-800/50 border-dashed shadow-none">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <div className="bg-zinc-800/50 p-4 rounded-full mb-4">
                  <Sparkles className="h-8 w-8 text-zinc-500" />
                </div>
                <h3 className="font-bold text-zinc-300 text-lg mb-2">No materials generated yet</h3>
                <p className="text-sm text-zinc-500 max-w-sm mb-6">
                  Open any approved note from the library and use the Study Copilot panel to generate smart summaries, MCQs, and more.
                </p>
                <Link href="/dashboard/browse">
                  <Button className="bg-indigo-600 hover:bg-indigo-500">Browse Notes</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {generations.map((gen: any) => (
                <Card key={gen.id} className="bg-zinc-900/50 border-zinc-800/80 shadow-md hover:border-zinc-700 transition-colors overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      <div className="p-5 flex-1 border-b sm:border-b-0 sm:border-r border-zinc-800/50">
                        <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
                          {gen.generation_type.replace(/_/g, ' ')}
                        </div>
                        <h4 className="font-bold text-zinc-200 text-lg mb-1 line-clamp-1">
                          {gen.notes?.title || "Unknown Note"}
                        </h4>
                        <div className="text-xs text-zinc-500 font-medium flex items-center gap-3">
                          <span className="flex items-center gap-1.5" suppressHydrationWarning><Clock className="h-3.5 w-3.5" /> {new Date(gen.created_at).toLocaleDateString()}</span>
                          {gen.notes?.subjects && (
                            <span className="bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">{gen.notes.subjects.name}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="p-5 sm:w-48 bg-zinc-950/30 flex flex-col justify-center items-stretch gap-2 shrink-0">
                         <Link href={`/notes/${gen.notes?.id}`}>
                           <Button variant="outline" className="w-full h-9 text-xs font-bold border-zinc-700 hover:bg-zinc-800 hover:text-white">
                             View Note
                           </Button>
                         </Link>
                         {/* Note: In a real app, 'View Generation' might open a modal or dedicated page, but for now we just link back to the note since the panel is there */}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
