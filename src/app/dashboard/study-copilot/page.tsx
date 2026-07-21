import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Activity,
  FileText,
  Library,
  CheckCircle2,
  Zap,
  Clock,
  Search,
  BookOpen,
  ArrowRight,
  Crown,
  Eye,
  Timer,
  Brain,
  FileWarning
} from "lucide-react";
import { STUDY_TOOLS, StudyToolGroup } from "@/lib/ai/study-tools";
import { getMyAIGenerations } from "@/app/actions/copilot-history";
import { getUserAIUsage } from "@/app/actions/ai-usage";
import { SavedResultsLibrary } from "@/components/study-copilot/saved-results-library";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Study Copilot - College Notes",
  description:
    "Your AI study command center for summaries, quizzes, flashcards, revision plans, important questions, and note-based doubt solving.",
};

export default async function StudyCopilotPage() {
  const { userId } = await auth();
  const usageResult = await getUserAIUsage();
  const usageState = usageResult.success ? usageResult.data : null;

  const activeTools = STUDY_TOOLS.filter((t) => t.enabled);

  const groupedTools = STUDY_TOOLS.reduce((acc, tool) => {
    if (!acc[tool.group]) acc[tool.group] = [];
    acc[tool.group].push(tool);
    return acc;
  }, {} as Record<StudyToolGroup, typeof STUDY_TOOLS>);

  const groupOrder: StudyToolGroup[] = ["Understand", "Practice", "Exam Prep", "Doubt Solving"];

  // Fetch saved summaries server-side (no Gemini call, no usage increment)
  let savedGenerations: Awaited<ReturnType<typeof getMyAIGenerations>> = { success: true, data: [] };
  if (userId) {
    savedGenerations = await getMyAIGenerations();
  }

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

      <Header />
      <main className="flex-grow z-10 pt-24 pb-16 px-6 max-w-7xl mx-auto w-full flex flex-col gap-12">

        {/* ── A. Hero Section ── */}
        <div className="flex flex-col lg:flex-row gap-12 items-center justify-between relative mb-8">
          <div className="flex flex-col gap-6 w-full lg:w-[55%] relative z-10">
            {usageState?.plan === "premium" && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 to-purple-500/10 border border-amber-500/20 w-fit">
                <Crown className="h-4 w-4 text-amber-400" />
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest">Premium AI Workspace</span>
              </div>
            )}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
              Study Copilot
            </h1>
            <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-xl">
              Turn your notes into summaries, quizzes, flashcards, important questions, and doubt answers.
            </p>
            
            {/* Micro-Benefits Row */}
            <div className="flex flex-wrap gap-2.5 mt-2">
              <div className="flex items-center gap-1.5 bg-zinc-900/60 border border-zinc-800 px-3 py-1.5 rounded-lg">
                <FileText className="h-3.5 w-3.5 text-indigo-400" />
                <span className="text-xs font-medium text-zinc-300">Built for uploaded notes</span>
              </div>
              <div className="flex items-center gap-1.5 bg-zinc-900/60 border border-zinc-800 px-3 py-1.5 rounded-lg">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-xs font-medium text-zinc-300">Source-grounded answers</span>
              </div>
              <div className="flex items-center gap-1.5 bg-zinc-900/60 border border-zinc-800 px-3 py-1.5 rounded-lg">
                <Clock className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xs font-medium text-zinc-300">Fast exam revision</span>
              </div>
              <div className="flex items-center gap-1.5 bg-zinc-900/60 border border-zinc-800 px-3 py-1.5 rounded-lg">
                <BookOpen className="h-3.5 w-3.5 text-violet-400" />
                <span className="text-xs font-medium text-zinc-300">Saved result history</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Art */}
          <div className="w-full lg:w-[45%] relative h-[280px] sm:h-[340px] flex items-center justify-center pointer-events-none">
            {/* Glowing Orb Background */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] rounded-full blur-[80px] ${usageState?.plan === "premium" ? "bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-indigo-500/20" : "bg-indigo-500/20"}`} />
            
            {/* 3D Floating UI Composition */}
            <div className="relative w-full h-full flex items-center justify-center" style={{ perspective: "1000px" }}>
              {/* Back Card */}
              <div 
                className={`absolute w-48 h-56 rounded-2xl shadow-2xl backdrop-blur-md border flex flex-col p-4 transition-transform duration-1000 ${usageState?.plan === "premium" ? "bg-zinc-950/80 border-purple-500/20" : "bg-zinc-900/80 border-zinc-800"}`}
                style={{ transform: "rotateX(15deg) rotateY(-25deg) rotateZ(-5deg) translateZ(-80px) translateX(30px)", opacity: 0.7 }}
              >
                <div className="h-2 w-1/2 bg-zinc-800 rounded-full mb-3" />
                <div className="h-1.5 w-full bg-zinc-800/80 rounded-full mb-2" />
                <div className="h-1.5 w-4/5 bg-zinc-800/80 rounded-full mb-2" />
                <div className="h-1.5 w-full bg-zinc-800/80 rounded-full mb-2" />
              </div>

              {/* Main Center Card */}
              <div 
                className={`absolute w-56 h-64 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-xl flex flex-col p-5 transition-transform duration-1000 border ${usageState?.plan === "premium" ? "bg-zinc-950/90 border-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.15)]" : "bg-zinc-950/90 border-indigo-500/30 shadow-[0_0_40px_rgba(99,102,241,0.15)]"}`}
                style={{ transform: "rotateX(10deg) rotateY(-15deg) translateZ(0px)" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-lg ${usageState?.plan === "premium" ? "bg-amber-500/10 text-amber-400" : "bg-indigo-500/10 text-indigo-400"}`}>
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${usageState?.plan === "premium" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"}`}>AI GENERATED</div>
                </div>
                <div className="flex-1 flex flex-col gap-2.5">
                  <div className="h-2 w-3/4 bg-zinc-700 rounded-full mb-1" />
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full" />
                  <div className="h-1.5 w-11/12 bg-zinc-800 rounded-full" />
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full" />
                  <div className="h-1.5 w-4/5 bg-zinc-800 rounded-full" />
                </div>
              </div>

              {/* Top Right Floating Chip */}
              <div 
                className={`absolute rounded-xl shadow-xl backdrop-blur-md p-3 flex items-center gap-2 border transition-transform duration-1000 ${usageState?.plan === "premium" ? "bg-zinc-900/90 border-purple-500/30" : "bg-zinc-900/90 border-violet-500/30"}`}
                style={{ transform: "rotateX(5deg) rotateY(-5deg) translateZ(50px) translateY(-70px) translateX(90px)" }}
              >
                <BookOpen className={`h-4 w-4 ${usageState?.plan === "premium" ? "text-purple-400" : "text-violet-400"}`} />
                <span className="text-[10px] font-bold text-zinc-200">Practice Quiz</span>
              </div>

              {/* Bottom Left Floating Stack */}
              <div 
                className="absolute w-28 h-16 bg-zinc-900/90 border border-zinc-700/50 rounded-xl shadow-xl backdrop-blur-md p-3 flex flex-col items-center justify-center transition-transform duration-1000"
                style={{ transform: "rotateX(20deg) rotateY(15deg) translateZ(40px) translateY(80px) translateX(-90px)" }}
              >
                <Library className="h-4 w-4 text-emerald-400 mb-1" />
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Cards Ready</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── B. Plan Status Area ── */}
        <div className="mb-4">
          {usageState && usageState.isPremiumActive && (
            <div className="bg-gradient-to-r from-zinc-950 to-zinc-900/80 border border-amber-500/20 p-5 sm:p-6 rounded-2xl shadow-[0_8px_30px_rgba(245,158,11,0.06)] relative overflow-hidden flex flex-col md:flex-row gap-6 items-center justify-between group">
               {/* Decorative watermark */}
               <div className="absolute -right-6 -bottom-10 opacity-[0.02] transform -rotate-12 pointer-events-none transition-transform group-hover:scale-110 duration-1000">
                 <Crown className="h-48 w-48 text-amber-500" />
               </div>
               
               <div className="flex flex-col gap-2 z-10 w-full md:w-auto">
                 <div className="flex items-center gap-3">
                   {usageState.isPremiumEndingSoon ? (
                     <span className="bg-gradient-to-r from-red-500 to-orange-400 text-zinc-950 text-xs px-3 py-1 rounded-full font-extrabold uppercase tracking-widest shadow-md flex items-center gap-1.5 w-fit">
                       <FileWarning className="h-4 w-4" /> PREMIUM ENDING SOON
                     </span>
                   ) : (
                     <span className="bg-gradient-to-r from-amber-500 to-amber-300 text-zinc-950 text-xs px-3 py-1 rounded-full font-extrabold uppercase tracking-widest shadow-md flex items-center gap-1.5 w-fit">
                       <Crown className="h-4 w-4" /> PREMIUM MEMBER
                     </span>
                   )}
                 </div>
                 
                 <h3 className="text-xl font-bold text-zinc-100 mt-1">
                   {usageState.isPremiumEndingSoon ? "Your premium membership ends soon." : "Your premium Study Copilot is active."}
                 </h3>
                 <p className="text-sm text-zinc-400">
                   {usageState.isPremiumEndingSoon 
                     ? "Renewal coming soon. You'll switch to the free plan if it expires." 
                     : "Unlocks higher monthly limits and advanced study workflows."}
                 </p>
                 
                 {usageState.premiumExpiresAt && (
                   <p className="text-xs text-zinc-500 mt-1 font-medium">
                     Valid until {new Date(usageState.premiumExpiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                   </p>
                 )}
               </div>
               
               <div className="flex flex-col gap-2 z-10 w-full md:w-[320px] bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80">
                 <div className="flex items-center justify-between text-sm font-bold">
                   <span className="text-zinc-400">AI Usage</span>
                   <span className={usageState.usedThisMonth >= usageState.monthlyLimit ? "text-red-400" : "text-amber-400"}>
                     {usageState.usedThisMonth} <span className="text-zinc-500 font-medium">/ {usageState.monthlyLimit} generations</span>
                   </span>
                 </div>
                 <div className="h-2.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/80 relative">
                   <div 
                     className={`absolute top-0 left-0 h-full transition-all duration-700 bg-gradient-to-r ${usageState.usedThisMonth >= usageState.monthlyLimit ? "from-red-500 to-amber-500" : "from-amber-600 via-amber-400 to-amber-200"}`}
                     style={{ width: `${Math.min(100, (usageState.usedThisMonth / usageState.monthlyLimit) * 100)}%` }}
                   />
                 </div>
               </div>
            </div>
          )}

          {usageState && usageState.isPremiumExpired && !usageState.isPremiumActive && (
            <div className="bg-zinc-950 border border-zinc-800 p-5 sm:p-6 rounded-2xl shadow-lg relative overflow-hidden flex flex-col md:flex-row gap-6 items-center justify-between">
               <div className="flex flex-col gap-2 z-10 w-full md:w-auto">
                 <div className="flex items-center gap-3">
                   <span className="bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider w-fit">
                     Premium Expired
                   </span>
                 </div>
                 <h3 className="text-xl font-bold text-zinc-100 mt-1">Your premium membership has ended.</h3>
                 <p className="text-sm text-zinc-400">You are now on the Free Plan. Renewal options coming soon.</p>
                 <Link href="/pricing" className="mt-2 block w-fit">
                   <Button variant="outline" className="text-zinc-300 border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100 font-bold h-9 text-xs rounded-lg transition-all px-6">
                     View Plans
                   </Button>
                 </Link>
               </div>
               
               <div className="flex flex-col gap-2 z-10 w-full md:w-[320px] bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
                 <div className="flex items-center justify-between text-sm font-bold">
                   <span className="text-zinc-400">AI Usage</span>
                   <span className={usageState.usedThisMonth >= usageState.monthlyLimit ? "text-red-400" : "text-zinc-200"}>
                     {usageState.usedThisMonth} <span className="text-zinc-500 font-medium">/ {usageState.monthlyLimit} generations</span>
                   </span>
                 </div>
                 <div className="h-2.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/80 relative">
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
            <div className="bg-zinc-950 border border-zinc-800 p-5 sm:p-6 rounded-2xl shadow-lg relative overflow-hidden flex flex-col md:flex-row gap-6 items-center justify-between">
               <div className="flex flex-col gap-2 z-10 w-full md:w-auto">
                 <div className="flex items-center gap-3">
                   <span className="bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider w-fit">
                     Free Plan
                   </span>
                 </div>
                 <h3 className="text-xl font-bold text-zinc-100 mt-1">Study Copilot is ready.</h3>
                 <p className="text-sm text-zinc-400">Unlock 100 monthly AI generations and advanced study workflows with Premium.</p>
                 <Link href="/pricing" className="mt-2 block w-fit">
                   <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-9 text-xs rounded-lg transition-all shadow-md shadow-indigo-500/10 px-6">
                     Upgrade to Premium
                   </Button>
                 </Link>
               </div>
               
               <div className="flex flex-col gap-2 z-10 w-full md:w-[320px] bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
                 <div className="flex items-center justify-between text-sm font-bold">
                   <span className="text-zinc-400">AI Usage</span>
                   <span className={usageState.usedThisMonth >= usageState.monthlyLimit ? "text-red-400" : "text-zinc-200"}>
                     {usageState.usedThisMonth} <span className="text-zinc-500 font-medium">/ {usageState.monthlyLimit} generations</span>
                   </span>
                 </div>
                 <div className="h-2.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/80 relative">
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
                   <div className="mt-2 text-red-400 text-xs font-bold flex items-center gap-1.5">
                     <FileWarning className="h-4 w-4" /> You have used all free generations.
                   </div>
                 ) : usageState.usedThisMonth >= usageState.monthlyLimit * 0.8 ? (
                   <div className="mt-2 text-amber-400 text-xs font-bold flex items-center gap-1.5">
                     <FileWarning className="h-4 w-4" /> You are close to your free limit.
                   </div>
                 ) : null}
               </div>
            </div>
          )}
        </div>

        {/* ── C. AI Tool Dock ── */}
        <div className="flex flex-col gap-4 mt-2 mb-12">
          <div className="flex items-center gap-2 px-1">
            <Zap className="h-5 w-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-zinc-100 tracking-tight">AI Tool Dock</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
            {activeTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.id}
                  className="bg-zinc-900/40 border border-zinc-800/60 hover:bg-zinc-900/80 hover:border-indigo-500/40 hover:shadow-[0_4px_20px_rgba(99,102,241,0.05)] backdrop-blur-md rounded-2xl p-4 flex flex-col gap-3 transition-all h-full group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-indigo-400 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 group-hover:text-indigo-300 transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded-full border whitespace-nowrap font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      Active
                    </span>
                  </div>
                  <div className="mt-1">
                    <h3 className="font-bold text-zinc-100 text-sm mb-1.5 group-hover:text-white transition-colors">{tool.title}</h3>
                    <p className="text-xs text-zinc-400 leading-snug">{tool.description}</p>
                  </div>
                  <div className="mt-auto pt-4 flex flex-col gap-2">
                    <span className="text-[10px] text-zinc-500 font-medium text-center bg-zinc-950 py-1 rounded-md border border-zinc-800/50">Open a note to use this tool</span>
                    <Link href="/dashboard/browse">
                      <button className="w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs uppercase tracking-wider transition-colors border border-zinc-700 group-hover:border-zinc-600">
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
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between px-1">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-400" />
                <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Saved Study Library</h2>
              </div>
              <p className="text-xs text-zinc-500">Your summaries, quizzes, flashcards, important questions, and doubt answers stay ready here.</p>
            </div>
            {hasSaved && (
              <span className="text-[10px] text-zinc-500 bg-zinc-900/50 border border-zinc-800 px-2.5 py-1 rounded-full font-medium shrink-0">
                {savedData.length} saved
              </span>
            )}
          </div>

          {!userId ? (
            <div className="flex items-center justify-center py-10 text-zinc-600 text-sm">
              Sign in to view your saved study material.
            </div>
          ) : !hasSaved ? (
            <div className="border border-dashed border-zinc-800/60 rounded-2xl py-12 flex flex-col items-center gap-3 text-center">
              <div className="bg-zinc-900/50 p-4 rounded-full border border-zinc-800">
                <Sparkles className="h-6 w-6 text-zinc-600" />
              </div>
              <p className="text-sm font-semibold text-zinc-400">No saved results yet</p>
              <p className="text-xs text-zinc-600 max-w-xs">
                Open any approved note and use{" "}
                <span className="text-zinc-400 font-medium">Smart Summary</span> or{" "}
                <span className="text-zinc-400 font-medium">Practice Quiz</span> to generate your first AI study material.
              </p>
              <Link
                href="/dashboard/browse"
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Browse Notes <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <SavedResultsLibrary savedData={savedData} />
          )}
        </div>

        {/* ── D. Premium Study Boosters ── */}
        <div className="flex flex-col gap-5 mt-4">
          <div className="mb-2 flex items-start justify-between gap-4 px-1">
            <div>
              <h2 className="text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-400" /> Premium Study Boosters
              </h2>
              <p className="text-sm text-zinc-400 mt-1">
                {usageState?.plan === "premium" ? "Unlocked benefits for faster exam preparation." : "Upgrade to unlock a stronger Study Copilot."}
              </p>
            </div>
            {usageState?.plan === "free" && (
              <Link href="/pricing" className="shrink-0 mt-1">
                <Button variant="outline" className="h-8 text-xs font-bold border-amber-500/20 text-amber-400 bg-amber-500/5 hover:bg-amber-500/10">
                  View Plans
                </Button>
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-zinc-950/40 border border-zinc-800/60 p-4 rounded-xl hover:border-amber-500/20 transition-all flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-zinc-200">
                  <Zap className="h-4 w-4 text-amber-400" /> 100 AI Generations
                </div>
              </div>
              <p className="text-xs text-zinc-400 leading-snug">More room for summaries, quizzes, flashcards, important questions, and doubts.</p>
              <div className="mt-auto pt-2">
                {usageState?.plan === "premium" ? (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded font-bold uppercase tracking-wider">Active</span>
                ) : (
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded font-bold uppercase tracking-wider">Unlock with Premium</span>
                )}
              </div>
            </div>
            
            <div className="bg-zinc-950/40 border border-zinc-800/60 p-4 rounded-xl hover:border-amber-500/20 transition-all flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-zinc-200">
                  <Eye className="h-4 w-4 text-amber-400" /> Extended Scanned PDF Reading
                </div>
              </div>
              <p className="text-xs text-zinc-400 leading-snug">Better support for scanned and handwritten notes.</p>
              <div className="mt-auto pt-2">
                {usageState?.plan === "premium" ? (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded font-bold uppercase tracking-wider">Active</span>
                ) : (
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded font-bold uppercase tracking-wider">Unlock with Premium</span>
                )}
              </div>
            </div>

            <div className="bg-zinc-950/20 border border-zinc-800/40 opacity-70 p-4 rounded-xl flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-zinc-300">
                  <Timer className="h-4 w-4 text-zinc-500" /> Exam Sprint Mode
                </div>
              </div>
              <p className="text-xs text-zinc-500 leading-snug">Guided exam revision from summary to quiz to weak areas.</p>
              <div className="mt-auto pt-2">
                <span className="text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700 px-2 py-1 rounded font-bold uppercase tracking-wider">Coming Soon</span>
              </div>
            </div>

            <div className="bg-zinc-950/20 border border-zinc-800/40 opacity-70 p-4 rounded-xl flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-zinc-300">
                  <Library className="h-4 w-4 text-zinc-500" /> Multi-PDF Study Pack
                </div>
              </div>
              <p className="text-xs text-zinc-500 leading-snug">Combine multiple notes into one complete study pack.</p>
              <div className="mt-auto pt-2">
                <span className="text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700 px-2 py-1 rounded font-bold uppercase tracking-wider">Coming Soon</span>
              </div>
            </div>

            <div className="bg-zinc-950/20 border border-zinc-800/40 opacity-70 p-4 rounded-xl flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-zinc-300">
                  <Brain className="h-4 w-4 text-zinc-500" /> Memory Booster
                </div>
              </div>
              <p className="text-xs text-zinc-500 leading-snug">Smarter flashcard review and revision reminders.</p>
              <div className="mt-auto pt-2">
                <span className="text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700 px-2 py-1 rounded font-bold uppercase tracking-wider">Coming Soon</span>
              </div>
            </div>

            <div className="bg-zinc-950/20 border border-zinc-800/40 opacity-70 p-4 rounded-xl flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-zinc-300">
                  <CheckCircle2 className="h-4 w-4 text-zinc-500" /> Final Revision Sheet
                </div>
              </div>
              <p className="text-xs text-zinc-500 leading-snug">One clean last-minute sheet with formulas, definitions, and important questions.</p>
              <div className="mt-auto pt-2">
                <span className="text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700 px-2 py-1 rounded font-bold uppercase tracking-wider">Coming Soon</span>
              </div>
            </div>
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}
