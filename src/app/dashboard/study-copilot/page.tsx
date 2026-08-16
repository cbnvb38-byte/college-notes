import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

import { Button } from "@/components/ui/button";
import {
  Sparkles,
  FileText,
  Library,
  Zap,
  Clock,
  BookOpen,
  ArrowRight,
  Crown,
  Eye,
  FileWarning,
  Rocket,
  Lock,
  User,
  GraduationCap,
  HelpCircle
} from "lucide-react";
import { STUDY_TOOLS, StudyToolGroup } from "@/lib/ai/study-tools";
import { getMyAIGenerations } from "@/app/actions/copilot-history";
import { getUserAIUsage } from "@/app/actions/ai-usage";
import { SavedResultsLibrary } from "@/components/study-copilot/saved-results-library";
import { createClient } from "@supabase/supabase-js";
import { MultiPdfStudyPackClient } from "@/components/study-copilot/multi-pdf-client";
import { getAccessibleNotesForSelectorAction } from "@/app/actions/multi-pdf";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Study Copilot - College Notes",
  description:
    "Your AI study command center for summaries, quizzes, flashcards, revision plans, important questions, and note-based doubt solving.",
};

export default async function StudyCopilotPage() {
  const { userId } = await auth();

  // Parallelize AI usage and saved generations fetching
  const [usageResult, savedGenerations] = await Promise.all([
    getUserAIUsage(),
    userId ? getMyAIGenerations() : Promise.resolve({ success: true, data: [] })
  ]);
  
  const usageState = usageResult.success ? usageResult.data : null;

    // Fetch accessible notes for Multi-PDF if premium is active
  let accessibleNotes: {id: string, title: string, subject: string, semester: string}[] = [];
  if (usageState?.isPremiumActive && userId) {
    const res = await getAccessibleNotesForSelectorAction();
    if (res.success && res.data) {
      accessibleNotes = res.data.map((n: any) => ({
        id: n.id,
        title: n.title,
        subject: n.subjects?.name ?? "",
        semester: String(n.semester ?? ""),
      }));
    }
  }

  const activeTools = STUDY_TOOLS.filter((t) => t.enabled);

  const groupedTools = STUDY_TOOLS.reduce((acc, tool) => {
    if (!acc[tool.group]) acc[tool.group] = [];
    acc[tool.group].push(tool);
    return acc;
  }, {} as Record<StudyToolGroup, typeof STUDY_TOOLS>);

  const groupOrder: StudyToolGroup[] = ["Understand", "Practice", "Exam Prep", "Doubt Solving"];

  // Saved generations already fetched in parallel above

  // Narrow to the data array once, safe for all downstream JSX
  const savedData = savedGenerations.success ? savedGenerations.data : [];
  const hasSaved = savedData.length > 0;

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-50 overflow-hidden flex flex-col font-sans">
      {/* Decorative background */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none opacity-10 z-0">
        <div className="absolute top-[10%] left-[15%] w-[450px] h-[450px] rounded-full bg-indigo-600 blur-[130px] animate-pulse duration-[8000ms]" />
        <div className="absolute top-[20%] right-[15%] w-[400px] h-[400px] rounded-full bg-violet-600 blur-[140px] animate-pulse duration-[10000ms]" />
      </div>

      <main className="flex-grow z-10 pt-6 pb-16 px-4 sm:px-6 max-w-7xl mx-auto w-full flex flex-col">
        {/* ── Desktop Layout ── */}
        <div className="hidden lg:flex flex-col gap-12 w-full">
        {/* ── A. Hero Section ── */}
        <div className="flex flex-col lg:flex-row gap-12 items-center justify-between relative mb-8">
          <div className="flex flex-col gap-6 w-full lg:w-[55%] relative z-10">
            {usageState?.plan === "premium" && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 w-fit shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                <Crown className="h-4 w-4 text-amber-400" />
                <span className="text-[11px] font-black text-amber-400 uppercase tracking-widest">Premium AI Workspace</span>
              </div>
            )}
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] drop-shadow-2xl">
              Study Copilot
            </h1>
            <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-xl font-medium">
              Turn your notes into summaries, quizzes, flashcards, important questions, and doubt answers.
            </p>
            
            {/* Micro-Benefits Row */}
            <div className="flex flex-wrap gap-3 mt-2">
              <div className="flex items-center gap-2 bg-zinc-950/80 backdrop-blur-sm border border-zinc-800/80 px-4 py-2 rounded-xl shadow-lg">
                <FileText className="h-4 w-4 text-indigo-400" />
                <span className="text-xs font-bold text-zinc-300">Built for uploaded notes</span>
              </div>
              <div className="flex items-center gap-2 bg-zinc-950/80 backdrop-blur-sm border border-zinc-800/80 px-4 py-2 rounded-xl shadow-lg">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-bold text-zinc-300">Source-grounded answers</span>
              </div>
              <div className="flex items-center gap-2 bg-zinc-950/80 backdrop-blur-sm border border-zinc-800/80 px-4 py-2 rounded-xl shadow-lg">
                <Clock className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-bold text-zinc-300">Fast exam revision</span>
              </div>
              <div className="flex items-center gap-2 bg-zinc-950/80 backdrop-blur-sm border border-zinc-800/80 px-4 py-2 rounded-xl shadow-lg">
                <BookOpen className="h-4 w-4 text-violet-400" />
                <span className="text-xs font-bold text-zinc-300">Saved result history</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Art */}
          <div className="w-full lg:w-[45%] relative h-[280px] sm:h-[340px] flex items-center justify-center pointer-events-none">
            {/* Glowing Orb Background */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] rounded-full blur-[100px] ${usageState?.plan === "premium" ? "bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-indigo-500/20" : "bg-indigo-500/20"}`} />
            
            {/* 3D Floating UI Composition */}
            <div className="relative w-full h-full flex items-center justify-center" style={{ perspective: "1000px" }}>
              {/* Back Card */}
              <div 
                className={`absolute w-48 h-56 rounded-2xl shadow-2xl backdrop-blur-md border flex flex-col p-4 transition-transform duration-1000 ${usageState?.plan === "premium" ? "bg-zinc-950/80 border-purple-500/20" : "bg-zinc-950/80 border-zinc-800/80"}`}
                style={{ transform: "rotateX(15deg) rotateY(-25deg) rotateZ(-5deg) translateZ(-80px) translateX(30px)", opacity: 0.7 }}
              >
                <div className="h-2 w-1/2 bg-zinc-800 rounded-full mb-3" />
                <div className="h-1.5 w-full bg-zinc-800/80 rounded-full mb-2" />
                <div className="h-1.5 w-4/5 bg-zinc-800/80 rounded-full mb-2" />
                <div className="h-1.5 w-full bg-zinc-800/80 rounded-full mb-2" />
              </div>

              {/* Main Center Card */}
              <div 
                className={`absolute w-56 h-64 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl flex flex-col p-6 transition-transform duration-1000 border ${usageState?.plan === "premium" ? "bg-zinc-950/90 border-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.15)]" : "bg-zinc-950/90 border-indigo-500/30 shadow-[0_0_40px_rgba(99,102,241,0.15)]"}`}
                style={{ transform: "rotateX(10deg) rotateY(-15deg) translateZ(0px)" }}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className={`p-2.5 rounded-xl ${usageState?.plan === "premium" ? "bg-amber-500/10 text-amber-400" : "bg-indigo-500/10 text-indigo-400"}`}>
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className={`text-[9px] font-black px-2.5 py-1 rounded-full border tracking-widest ${usageState?.plan === "premium" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"}`}>GENERATED</div>
                </div>
                <div className="flex-1 flex flex-col gap-3">
                  <div className="h-2 w-3/4 bg-zinc-700 rounded-full mb-1" />
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full" />
                  <div className="h-1.5 w-11/12 bg-zinc-800 rounded-full" />
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full" />
                  <div className="h-1.5 w-4/5 bg-zinc-800 rounded-full" />
                </div>
              </div>

              {/* Top Right Floating Chip */}
              <div 
                className={`absolute rounded-xl shadow-2xl backdrop-blur-xl p-3.5 flex items-center gap-2 border transition-transform duration-1000 ${usageState?.plan === "premium" ? "bg-zinc-950/90 border-purple-500/30" : "bg-zinc-950/90 border-violet-500/30"}`}
                style={{ transform: "rotateX(5deg) rotateY(-5deg) translateZ(50px) translateY(-70px) translateX(90px)" }}
              >
                <BookOpen className={`h-4.5 w-4.5 ${usageState?.plan === "premium" ? "text-purple-400" : "text-violet-400"}`} />
                <span className="text-xs font-black text-zinc-200 uppercase tracking-widest">Practice Quiz</span>
              </div>

              {/* Bottom Left Floating Stack */}
              <div 
                className="absolute w-32 h-20 bg-zinc-950/90 border border-emerald-500/30 rounded-2xl shadow-2xl backdrop-blur-xl p-3.5 flex flex-col items-center justify-center transition-transform duration-1000"
                style={{ transform: "rotateX(20deg) rotateY(15deg) translateZ(40px) translateY(80px) translateX(-90px)" }}
              >
                <Library className="h-5 w-5 text-emerald-400 mb-1.5" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Cards Ready</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── B. Plan Status Area ── */}
        <div className="mb-4">
          {usageState && usageState.isPremiumActive && (
            <div className="godmode-card bg-gradient-to-r from-zinc-950 to-zinc-900/80 border-amber-500/20 p-6 sm:p-8 rounded-3xl shadow-[0_8px_30px_rgba(245,158,11,0.06)] relative overflow-hidden flex flex-col md:flex-row gap-8 items-center justify-between group">
               {/* Decorative watermark */}
               <div className="absolute -right-6 -bottom-10 opacity-[0.03] transform -rotate-12 pointer-events-none transition-transform group-hover:scale-110 duration-1000">
                 <Crown className="h-64 w-64 text-amber-500" />
               </div>
               
               <div className="flex flex-col gap-2 z-10 w-full md:w-auto">
                 <div className="flex items-center gap-3">
                   {usageState.isPremiumEndingSoon ? (
                     <span className="bg-gradient-to-r from-red-500 to-orange-400 text-zinc-950 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-lg flex items-center gap-1.5 w-fit">
                       <FileWarning className="h-4 w-4" /> PREMIUM ENDING SOON
                     </span>
                   ) : (
                     <span className="bg-gradient-to-r from-amber-500 to-amber-300 text-zinc-950 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-lg flex items-center gap-1.5 w-fit">
                       <Crown className="h-4 w-4" /> PREMIUM MEMBER
                     </span>
                   )}
                 </div>
                 
                 <h3 className="text-2xl font-black text-white mt-2 tracking-tight">
                   {usageState.isPremiumEndingSoon ? "Your premium membership ends soon." : "Your premium Study Copilot is active."}
                 </h3>
                 <p className="text-sm text-zinc-400 font-medium">
                   {usageState.isPremiumEndingSoon 
                     ? "Your plan will switch to Free if it expires. Renew to keep your limits." 
                     : "Unlocks higher monthly limits and advanced study workflows."}
                 </p>
                 
                 {usageState.premiumExpiresAt && (
                   <p className="text-xs text-zinc-500 mt-2 font-bold uppercase tracking-widest">
                     Valid until {new Date(usageState.premiumExpiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                   </p>
                 )}
               </div>
               
               <div className="flex flex-col gap-3 z-10 w-full md:w-[360px] bg-zinc-950/80 backdrop-blur-xl p-5 rounded-2xl border border-zinc-800/80 shadow-2xl">
                 <div className="flex items-center justify-between text-sm font-black uppercase tracking-widest">
                   <span className="text-zinc-500">AI Usage</span>
                   <span className={usageState.usedThisMonth >= usageState.monthlyLimit ? "text-red-400" : "text-amber-400"}>
                     {usageState.usedThisMonth} <span className="text-zinc-600 font-bold">/ {usageState.monthlyLimit}</span>
                   </span>
                 </div>
                 <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/80 relative shadow-inner">
                   <div 
                     className={`absolute top-0 left-0 h-full transition-all duration-700 bg-gradient-to-r ${usageState.usedThisMonth >= usageState.monthlyLimit ? "from-red-500 to-amber-500" : "from-amber-600 via-amber-400 to-amber-200"}`}
                     style={{ width: `${Math.min(100, (usageState.usedThisMonth / usageState.monthlyLimit) * 100)}%` }}
                   >
                     <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]" />
                   </div>
                 </div>
               </div>
            </div>
          )}

          {usageState && usageState.isPremiumExpired && !usageState.isPremiumActive && (
            <div className="godmode-card bg-zinc-950 border-zinc-800/80 p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-8 items-center justify-between">
               <div className="flex flex-col gap-2 z-10 w-full md:w-auto">
                 <div className="flex items-center gap-3">
                   <span className="bg-zinc-900 text-zinc-400 border border-zinc-700/80 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest w-fit shadow-inner">
                     Premium Expired
                   </span>
                 </div>
                 <h3 className="text-2xl font-black text-white mt-2 tracking-tight">Your premium membership has ended.</h3>
                 <p className="text-sm text-zinc-400 font-medium">You are now on the Free Plan. Renew Premium to restore higher limits.</p>
                 <Link href="/pricing" className="mt-4 block w-fit">
                   <Button variant="outline" className="text-zinc-300 border-zinc-700/80 hover:bg-zinc-800 hover:text-white font-bold h-11 text-sm rounded-xl transition-all px-8">
                     Renew Premium
                   </Button>
                 </Link>
               </div>
               
               <div className="flex flex-col gap-3 z-10 w-full md:w-[360px] bg-zinc-900/50 p-5 rounded-2xl border border-zinc-800/50 shadow-inner">
                 <div className="flex items-center justify-between text-sm font-black uppercase tracking-widest">
                   <span className="text-zinc-500">AI Usage</span>
                   <span className={usageState.usedThisMonth >= usageState.monthlyLimit ? "text-red-400" : "text-white"}>
                     {usageState.usedThisMonth} <span className="text-zinc-600 font-bold">/ {usageState.monthlyLimit}</span>
                   </span>
                 </div>
                 <div className="h-3 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/80 relative shadow-inner">
                   <div 
                     className={`absolute top-0 left-0 h-full transition-all duration-700 ${
                       usageState.usedThisMonth >= usageState.monthlyLimit 
                         ? "bg-red-500" 
                         : usageState.usedThisMonth >= (usageState.monthlyLimit * 0.8)
                           ? "bg-amber-500"
                           : "bg-indigo-500"
                     }`}
                     style={{ width: `${Math.min(100, (usageState.usedThisMonth / usageState.monthlyLimit) * 100)}%` }}
                   />
                 </div>
               </div>
            </div>
          )}

          {usageState && !usageState.isPremiumActive && !usageState.isPremiumExpired && (
            <div className="godmode-card bg-zinc-950 border-zinc-800/80 p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-8 items-center justify-between">
               <div className="flex flex-col gap-2 z-10 w-full md:w-auto">
                 <div className="flex items-center gap-3">
                   <span className="bg-zinc-900 text-zinc-400 border border-zinc-700/80 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest w-fit shadow-inner">
                     Free Plan
                   </span>
                 </div>
                 <h3 className="text-2xl font-black text-white mt-2 tracking-tight">Study Copilot is ready.</h3>
                 <p className="text-sm text-zinc-400 font-medium">Unlock 100 monthly AI generations and advanced study workflows with Premium.</p>
                 <Link href="/pricing" className="mt-4 block w-fit">
                   <Button className="glow-border bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold h-11 text-sm rounded-xl transition-all shadow-xl shadow-indigo-500/20 px-8">
                     Upgrade to Premium
                   </Button>
                 </Link>
               </div>
               
               <div className="flex flex-col gap-3 z-10 w-full md:w-[360px] bg-zinc-900/50 p-5 rounded-2xl border border-zinc-800/50 shadow-inner">
                 <div className="flex items-center justify-between text-sm font-black uppercase tracking-widest">
                   <span className="text-zinc-500">AI Usage</span>
                   <span className={usageState.usedThisMonth >= usageState.monthlyLimit ? "text-red-400" : "text-white"}>
                     {usageState.usedThisMonth} <span className="text-zinc-600 font-bold">/ {usageState.monthlyLimit}</span>
                   </span>
                 </div>
                 <div className="h-3 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/80 relative shadow-inner">
                   <div 
                     className={`absolute top-0 left-0 h-full transition-all duration-700 ${
                       usageState.usedThisMonth >= usageState.monthlyLimit 
                         ? "bg-red-500" 
                         : usageState.usedThisMonth >= (usageState.monthlyLimit * 0.8)
                           ? "bg-amber-500"
                           : "bg-indigo-500"
                     }`}
                     style={{ width: `${Math.min(100, (usageState.usedThisMonth / usageState.monthlyLimit) * 100)}%` }}
                   />
                 </div>
                 {usageState.usedThisMonth >= usageState.monthlyLimit ? (
                   <div className="mt-2 text-red-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                     <FileWarning className="h-4 w-4" /> Limit reached.
                   </div>
                 ) : usageState.usedThisMonth >= usageState.monthlyLimit * 0.8 ? (
                   <div className="mt-2 text-amber-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                     <FileWarning className="h-4 w-4" /> Close to free limit.
                   </div>
                 ) : null}
               </div>
            </div>
          )}
        </div>

        {/* ── B.5 Exam Sprint Mode (Premium Workflow) ── */}
        <div className="mb-10">
          <div className="flex items-center gap-3 px-2 mb-6">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
              <Rocket className="h-5 w-5 text-amber-500" />
            </div>
            <h2 className="text-2xl font-black text-zinc-100 tracking-tight">Exam Sprint Mode</h2>
          </div>
          
          {usageState && usageState.isPremiumActive ? (
            <div className="godmode-card bg-gradient-to-r from-zinc-900/90 to-zinc-950 border border-amber-500/30 hover:border-amber-500/50 transition-colors p-8 sm:p-10 rounded-3xl shadow-[0_15px_40px_rgba(245,158,11,0.1)] relative overflow-hidden flex flex-col md:flex-row gap-8 items-center justify-between group">
              <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="absolute -right-4 -bottom-8 opacity-[0.03] transform -rotate-12 pointer-events-none transition-transform group-hover:scale-110 duration-1000">
                <Rocket className="h-64 w-64 text-amber-500" />
              </div>
              
              <div className="flex flex-col gap-4 z-10 w-full md:w-auto">
                <h3 className="text-3xl font-black text-white tracking-tight leading-tight">Build your exam route from a single note.</h3>
                <p className="text-base text-zinc-400 max-w-lg leading-relaxed font-medium">
                  A guided revision workflow. Select a note, reuse saved results, and sprint through Summary, Important Questions, Flashcards, and Practice Quizzes seamlessly.
                </p>
                <div className="flex flex-wrap gap-4 mt-2">
                  <div className="flex items-center gap-2 text-xs text-amber-200/90 font-black bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/20 w-fit shadow-inner uppercase tracking-widest">
                    <Sparkles className="h-4 w-4" /> 4-Step Guided Revision
                  </div>
                </div>
              </div>
              
              <div className="z-10 shrink-0 w-full md:w-auto mt-4 md:mt-0">
                <Link href="/dashboard/study-copilot/sprint" className="block w-full">
                  <Button className="w-full md:w-auto glow-border bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-zinc-950 font-black h-14 px-10 rounded-2xl transition-all shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:shadow-[0_0_40px_rgba(245,158,11,0.4)] text-base group/btn">
                    Start Exam Sprint <ArrowRight className="ml-3 h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="godmode-card bg-zinc-950/50 backdrop-blur-md border border-zinc-800/80 p-8 sm:p-10 rounded-3xl relative overflow-hidden flex flex-col md:flex-row gap-8 items-center justify-between group grayscale hover:grayscale-[50%] transition-all duration-700">
              <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-zinc-800/20 to-transparent pointer-events-none" />
              <div className="absolute -right-4 -bottom-8 opacity-[0.02] transform -rotate-12 pointer-events-none">
                <Rocket className="h-64 w-64 text-zinc-500" />
              </div>
              
              <div className="flex flex-col gap-4 z-10 w-full md:w-auto">
                <div className="flex items-center gap-3">
                  <h3 className="text-3xl font-black text-zinc-300 tracking-tight">Exam Sprint Mode</h3>
                  <span className="bg-zinc-900 text-zinc-500 border border-zinc-800 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest flex items-center gap-1.5 w-fit shadow-inner">
                    <Lock className="h-3 w-3" /> Locked
                  </span>
                </div>
                <p className="text-base text-zinc-500 max-w-lg leading-relaxed font-medium">
                  Premium workflow for guided revision. Select a note and automatically build a 4-step study path from Summary to Practice Quiz.
                </p>
                <div className="flex flex-wrap gap-4 mt-2 opacity-60 pointer-events-none">
                  <div className="flex items-center gap-2 text-xs text-amber-200/50 font-black bg-amber-500/5 px-4 py-2 rounded-xl border border-amber-500/10 w-fit uppercase tracking-widest">
                    <Sparkles className="h-4 w-4" /> 4-Step Guided Revision
                  </div>
                </div>
              </div>
              
              <div className="z-10 shrink-0 w-full md:w-auto mt-4 md:mt-0">
                <Link href="/pricing" className="block w-full">
                  <Button variant="outline" className="w-full md:w-auto glass-panel border-amber-500/20 text-amber-500/80 hover:text-amber-400 font-bold h-14 px-10 rounded-2xl transition-all hover:border-amber-500/40 text-base">
                    Unlock with Premium
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ── C. AI Tool Dock ── */}
        <div className="flex flex-col gap-5 mt-4 mb-14">
          <div className="flex items-center gap-3 px-2 mb-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
              <Zap className="h-5 w-5 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-black text-zinc-100 tracking-tight">AI Tool Dock</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            {activeTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.id}
                  className="hover-lift premium-glass rounded-3xl p-6 flex flex-col gap-4 transition-all h-full group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800/80 text-indigo-400 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/30 group-hover:text-indigo-300 transition-colors shadow-inner group-hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-[9px] px-2.5 py-1 rounded-md border whitespace-nowrap font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-inner">
                      Active
                    </span>
                  </div>
                  <div className="mt-2">
                    <h3 className="font-black text-zinc-100 text-base mb-2 group-hover:text-white transition-colors">{tool.title}</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed font-medium">{tool.description}</p>
                  </div>
                  <div className="mt-auto pt-5 flex flex-col gap-3">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest text-center bg-zinc-950/60 py-1.5 rounded-lg border border-zinc-800/50">Open note to use</span>
                    <Link href="/dashboard/browse">
                      <button className="w-full py-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 font-black text-xs uppercase tracking-widest transition-colors border border-zinc-700/80 group-hover:border-zinc-600 shadow-lg">
                        Browse Notes
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── C. Saved Study Library ── */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 shadow-[0_0_15px_rgba(139,92,246,0.15)]">
                  <BookOpen className="h-5 w-5 text-violet-400" />
                </div>
                <h2 className="text-2xl font-black text-zinc-100 tracking-tight">Saved Study Library</h2>
              </div>
              <p className="text-sm text-zinc-400 font-medium">Your summaries, quizzes, flashcards, important questions, and doubt answers stay ready here.</p>
            </div>
            {hasSaved && (
              <span className="text-xs text-zinc-400 bg-zinc-950/80 backdrop-blur-sm border border-zinc-800/80 px-4 py-1.5 rounded-full font-black uppercase tracking-widest shadow-inner shrink-0">
                {savedData.length} saved
              </span>
            )}
          </div>

          {!userId ? (
            <div className="flex items-center justify-center py-12 text-zinc-500 text-sm font-bold bg-zinc-950/30 rounded-3xl border border-zinc-800/50">
              Sign in to view your saved study material.
            </div>
          ) : !hasSaved ? (
            <div className="border border-dashed border-zinc-800/80 bg-zinc-950/30 rounded-3xl py-16 flex flex-col items-center gap-4 text-center group transition-colors hover:border-zinc-700 hover:bg-zinc-950/50">
              <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 shadow-inner group-hover:scale-110 transition-transform duration-500">
                <Sparkles className="h-8 w-8 text-zinc-500" />
              </div>
              <p className="text-lg font-black text-zinc-300">No saved results yet</p>
              <p className="text-sm text-zinc-500 max-w-sm leading-relaxed font-medium">
                Open any approved note and use{" "}
                <span className="text-zinc-300 font-bold">Smart Summary</span> or{" "}
                <span className="text-zinc-300 font-bold">Practice Quiz</span> to generate your first AI study material.
              </p>
              <Link
                href="/dashboard/browse"
                className="mt-4 inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-6 py-3 rounded-xl border border-indigo-500/20"
              >
                Browse Notes <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <SavedResultsLibrary savedData={savedData} />
          )}
        </div>

        {/* ── C.5 Multi-PDF Study Pack ── */}
        <div className="flex flex-col gap-6 mt-8">
          <MultiPdfStudyPackClient 
            isPremiumActive={usageState?.isPremiumActive || false} 
            accessibleNotes={accessibleNotes} 
          />
        </div>

        {/* ── D. Premium Study Boosters ── */}
        <div className="flex flex-col gap-6 mt-8">
          <div className="mb-2 flex items-start justify-between gap-4 px-2">
            <div>
              <h2 className="text-2xl font-black text-zinc-100 tracking-tight flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                  <Crown className="h-5 w-5 text-amber-400" /> 
                </div>
                Premium Study Boosters
              </h2>
              <p className="text-sm text-zinc-400 mt-2 font-medium">
                {usageState?.plan === "premium" ? "Unlocked benefits for faster exam preparation." : "Upgrade to unlock a stronger Study Copilot."}
              </p>
            </div>
            {usageState?.plan === "free" && (
              <Link href="/pricing" className="shrink-0 mt-2">
                <Button variant="outline" className="h-10 px-6 text-sm font-black uppercase tracking-widest border-amber-500/20 text-amber-500 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/40 transition-all rounded-xl">
                  View Plans
                </Button>
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            <div className="godmode-card bg-zinc-950/60 backdrop-blur-sm border-zinc-800/80 p-6 rounded-2xl flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 text-base font-black text-zinc-100">
                  <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                    <Zap className="h-4.5 w-4.5" /> 
                  </div>
                  100 AI Generations
                </div>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-medium">More room for summaries, quizzes, flashcards, important questions, and doubts.</p>
              <div className="mt-auto pt-4">
                {usageState?.plan === "premium" ? (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg font-black uppercase tracking-widest shadow-inner inline-block">Active</span>
                ) : (
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-lg font-black uppercase tracking-widest shadow-inner inline-block">Unlock with Premium</span>
                )}
              </div>
            </div>
            
            <div className="godmode-card bg-zinc-950/60 backdrop-blur-sm border-zinc-800/80 p-6 rounded-2xl flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 text-base font-black text-zinc-100">
                  <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                    <Eye className="h-4.5 w-4.5" /> 
                  </div>
                  Extended Scanned PDF
                </div>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-medium">Better support for scanned and handwritten notes.</p>
              <div className="mt-auto pt-4">
                {usageState?.plan === "premium" ? (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg font-black uppercase tracking-widest shadow-inner inline-block">Active</span>
                ) : (
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-lg font-black uppercase tracking-widest shadow-inner inline-block">Unlock with Premium</span>
                )}
              </div>
            </div>

            <div className="godmode-card bg-zinc-950/60 backdrop-blur-sm border-zinc-800/80 p-6 rounded-2xl flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 text-base font-black text-zinc-100">
                  <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                    <Rocket className="h-4.5 w-4.5" /> 
                  </div>
                  Exam Sprint Mode
                </div>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-medium">Guided exam revision from summary to quiz.</p>
              <div className="mt-auto pt-4">
                {usageState?.plan === "premium" ? (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg font-black uppercase tracking-widest shadow-inner inline-block">Active</span>
                ) : (
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-lg font-black uppercase tracking-widest shadow-inner inline-block">Unlock with Premium</span>
                )}
              </div>
            </div>

            <div className="godmode-card bg-zinc-950/60 backdrop-blur-sm border-zinc-800/80 p-6 rounded-2xl flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 text-base font-black text-zinc-100">
                  <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                    <Library className="h-4.5 w-4.5" /> 
                  </div>
                  Multi-PDF Study Pack
                </div>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-medium">Combine multiple notes into one study pack.</p>
              <div className="mt-auto pt-4">
                {usageState?.plan === "premium" ? (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg font-black uppercase tracking-widest shadow-inner inline-block">Active</span>
                ) : (
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-lg font-black uppercase tracking-widest shadow-inner inline-block">Unlock with Premium</span>
                )}
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* ── Mobile Layout ── */}
        <div className="flex lg:hidden flex-col gap-6 w-full pt-4">
          
          {/* 1. Premium compact hero */}
          <div className="flex flex-col gap-3 relative z-10">
            {usageState?.plan === "premium" && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 w-fit shadow-inner">
                <Crown className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">AI Study Workspace</span>
              </div>
            )}
            <h1 className="text-3xl font-black text-white tracking-tight leading-tight">
              Study Copilot
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed font-medium">
              Turn notes into summaries, quizzes, flashcards, and exam prep.
            </p>
          </div>

          {/* 2. Usage/status card */}
          {usageState && (
            <div className={`p-5 rounded-3xl flex flex-col gap-3 shadow-2xl border ${usageState.plan === "premium" ? (usageState.isPremiumEndingSoon ? "bg-amber-950/30 border-amber-500/30" : "bg-zinc-950/80 border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.05)]") : "bg-zinc-950/60 border-zinc-800/80"}`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border shadow-inner ${usageState.plan === "premium" ? (usageState.isPremiumEndingSoon ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20") : "bg-zinc-900 text-zinc-400 border-zinc-700/80"}`}>
                  {usageState.plan === "premium" ? (usageState.isPremiumEndingSoon ? "Premium Ending Soon" : "Premium Member") : "Free Plan"}
                </span>
                <span className={`text-xs font-black tracking-widest uppercase ${usageState.usedThisMonth >= usageState.monthlyLimit ? "text-red-400" : (usageState.plan === "premium" ? "text-amber-300" : "text-zinc-300")}`}>
                  {usageState.usedThisMonth} <span className={usageState.plan === "premium" ? "text-amber-500/50" : "text-zinc-600"}>/ {usageState.monthlyLimit}</span>
                </span>
              </div>
              <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden shadow-inner border border-zinc-800/80">
                <div 
                  className={`h-full transition-all duration-700 ${usageState.usedThisMonth >= usageState.monthlyLimit ? "bg-red-500" : (usageState.plan === "premium" ? "bg-gradient-to-r from-amber-600 via-amber-400 to-amber-200" : "bg-indigo-500")}`}
                  style={{ width: `${Math.min(100, (usageState.usedThisMonth / usageState.monthlyLimit) * 100)}%` }}
                />
              </div>
              {usageState.plan === "free" && (
                <Link href="/pricing" className="mt-2">
                  <Button className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold h-10 rounded-xl shadow-lg border border-indigo-500/20">
                    Upgrade to Premium
                  </Button>
                </Link>
              )}
            </div>
          )}

          {/* 3. Current note/source card (Empty State) */}
          <div className="bg-zinc-950/60 backdrop-blur-xl border border-zinc-800/80 p-6 rounded-3xl flex flex-col items-center justify-center text-center gap-4 shadow-inner">
            <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800/50 shadow-inner group-hover:scale-110 transition-transform">
              <FileText className="h-6 w-6 text-zinc-500" />
            </div>
            <div>
              <h3 className="text-base font-black text-zinc-200 tracking-tight">Choose a note to unlock AI tools</h3>
            </div>
            <div className="flex flex-col gap-2 w-full mt-2">
              <Link href="/dashboard/browse" className="w-full">
                <Button className="w-full bg-zinc-800/80 hover:bg-zinc-700 text-white font-black text-xs uppercase tracking-widest h-12 rounded-2xl transition-all shadow-md border border-zinc-700/80">
                  Browse Notes
                </Button>
              </Link>
              <Link href="/dashboard/upload" className="w-full">
                <Button variant="outline" className="w-full border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-300 font-black text-xs uppercase tracking-widest h-12 rounded-2xl transition-all">
                  Upload Note
                </Button>
              </Link>
            </div>
          </div>

          {/* 4. AI tool launcher */}
          <div className="flex flex-col gap-6 mt-6">
            <div className="flex items-center gap-2 pl-1 mb-1">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                <Zap className="h-4 w-4 text-indigo-400" />
              </div>
              <h2 className="text-xl font-black text-zinc-100 tracking-tight">AI Tools</h2>
            </div>
            
            {/* Core Study Section */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest pl-2 mb-1">Core Study</h3>
              
              {/* Smart Summary */}
              <Link href="/dashboard/browse" className="block w-full">
                <div className="bg-zinc-950/40 border border-zinc-800/50 p-4 rounded-3xl flex flex-col gap-2 shadow-sm relative overflow-hidden group hover:bg-zinc-900/60 transition-colors opacity-70">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-900/80 rounded-xl border border-zinc-800/80">
                      <FileText className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-zinc-300">Smart Summary</h3>
                      <p className="text-[11px] text-zinc-500 font-medium line-clamp-1">Key points and exam-ready explanation</p>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Grid Compact - Practice Quiz & Flashcards */}
              <div className="grid grid-cols-2 gap-3">
                <Link href="/dashboard/browse" className="block w-full">
                  <div className="bg-zinc-950/40 border border-zinc-800/50 p-4 rounded-3xl flex flex-col shadow-sm gap-2 opacity-70 hover:bg-zinc-900/60 transition-colors h-full">
                    <div className="p-2 bg-zinc-900/80 rounded-xl border border-zinc-800/80 w-fit">
                      <BookOpen className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-zinc-300 mt-1">Practice Quiz</h3>
                      <p className="text-[10px] text-zinc-500 leading-tight font-medium mt-0.5">Test yourself</p>
                    </div>
                  </div>
                </Link>
                <Link href="/dashboard/browse" className="block w-full">
                  <div className="bg-zinc-950/40 border border-zinc-800/50 p-4 rounded-3xl flex flex-col shadow-sm gap-2 opacity-70 hover:bg-zinc-900/60 transition-colors h-full">
                    <div className="p-2 bg-zinc-900/80 rounded-xl border border-zinc-800/80 w-fit">
                      <GraduationCap className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-zinc-300 mt-1">Flashcards</h3>
                      <p className="text-[10px] text-zinc-500 leading-tight font-medium mt-0.5">Revise faster</p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Exam Prep Section */}
            <div className="flex flex-col gap-3 mt-2">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest pl-2 mb-1">Exam Prep</h3>
              
              {/* Important Questions */}
              <Link href="/dashboard/browse" className="block w-full">
                <div className="bg-zinc-950/40 border border-zinc-800/50 p-4 rounded-3xl flex flex-col gap-2 shadow-sm relative overflow-hidden group hover:bg-zinc-900/60 transition-colors opacity-70">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-900/80 rounded-xl border border-zinc-800/80">
                      <HelpCircle className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-zinc-300">Important Questions</h3>
                      <p className="text-[11px] text-zinc-500 font-medium line-clamp-1">Prepare likely exam questions from this note.</p>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Exam Sprint */}
              <Link href={usageState?.isPremiumActive ? "/dashboard/study-copilot/sprint" : "/pricing"} className="block w-full">
                <div className={`border p-4 rounded-3xl flex flex-col gap-2 shadow-sm relative overflow-hidden group ${usageState?.isPremiumActive ? "bg-zinc-950/60 border-amber-500/20 opacity-90" : "bg-zinc-950/40 border-zinc-800/50 grayscale opacity-70"}`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-[40px]" />
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-zinc-900/80 rounded-xl border border-zinc-800/80">
                        <Rocket className={`h-5 w-5 ${usageState?.isPremiumActive ? "text-amber-500" : "text-indigo-400"}`} />
                      </div>
                      <div>
                        <h3 className={`text-sm font-black ${usageState?.isPremiumActive ? "text-amber-100" : "text-zinc-300"}`}>Exam Sprint</h3>
                        <p className="text-[11px] text-zinc-500 font-medium line-clamp-1">Create a quick exam-prep plan.</p>
                      </div>
                    </div>
                    {!usageState?.isPremiumActive && (
                      <span className="text-[9px] font-black uppercase tracking-widest bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-md text-zinc-500 flex items-center gap-1 shrink-0"><Lock className="h-3 w-3"/> Locked</span>
                    )}
                  </div>
                </div>
              </Link>
            </div>

            {/* Advanced Section */}
            <div className="flex flex-col gap-3 mt-2">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest pl-2 mb-1">Advanced</h3>
              
              {/* Ask Doubt */}
              <Link href="/dashboard/browse" className="block w-full">
                <div className="bg-zinc-950/40 border border-zinc-800/50 p-4 rounded-3xl flex flex-col gap-2 shadow-sm relative overflow-hidden group hover:bg-zinc-900/60 transition-colors opacity-70">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-900/80 rounded-xl border border-zinc-800/80">
                      <User className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-zinc-300">Ask Doubt</h3>
                      <p className="text-[11px] text-zinc-500 font-medium line-clamp-1">Ask anything from this material</p>
                    </div>
                  </div>
                </div>
              </Link>
              
              {/* Multi-PDF Study Pack */}
              <div>
                <MultiPdfStudyPackClient 
                  isPremiumActive={usageState?.isPremiumActive || false} 
                  accessibleNotes={accessibleNotes}
                  isMobile={true} 
                />
              </div>
            </div>
          </div>

          {/* 6. Saved results preview/link */}
          <div className="flex flex-col gap-4 mt-8 bg-zinc-900/30 p-5 rounded-3xl border border-zinc-800/60 relative overflow-hidden shadow-inner">
            <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-violet-500/10 rounded-full blur-[40px]" />
            <div className="relative z-10 flex flex-col gap-2">
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 shadow-inner">
                  <BookOpen className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-base font-black text-zinc-100 tracking-tight">Your AI Study Library</h2>
                  <p className="text-[11px] text-zinc-400 font-medium mt-0.5 max-w-[200px]">Open saved summaries, quizzes, flashcards, doubts, exam sprints, and study packs.</p>
                </div>
              </div>
            </div>
            
            <div className="relative z-10 mt-2">
              {!userId ? (
                <div className="text-center py-6 text-zinc-500 text-xs font-bold bg-zinc-950/50 rounded-2xl border border-zinc-800/50">
                  Sign in to view saved results.
                </div>
              ) : !hasSaved ? (
                <div className="text-center py-6 text-zinc-500 bg-zinc-950/50 rounded-2xl border border-zinc-800/50 flex flex-col items-center gap-2">
                  <Sparkles className="h-5 w-5 text-zinc-600 mb-0.5" />
                  <span className="text-xs font-bold text-zinc-400">No results yet</span>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400 bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/50">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {savedData.length} items saved
                  </div>
                  <SavedResultsLibrary savedData={savedData} />
                </div>
              )}
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}

