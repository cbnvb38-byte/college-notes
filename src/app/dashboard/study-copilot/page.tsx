import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import { STUDY_TOOLS, StudyToolGroup } from "@/lib/ai/study-tools";
import { getMyAIGenerations } from "@/app/actions/copilot-history";
import { SavedResultsLibrary } from "@/components/study-copilot/saved-results-library";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Study Copilot - College Notes",
  description:
    "Your AI study command center for summaries, quizzes, flashcards, revision plans, important questions, and note-based doubt solving.",
};

export default async function StudyCopilotPage() {
  const { userId } = await auth();

  const primaryTools = STUDY_TOOLS.filter((t) => t.priority === "primary");

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

        {/* ── A. Hero ── */}
        <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
          <div className="flex flex-col gap-4 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <div className="bg-gradient-to-tr from-indigo-500 to-violet-500 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-500/20">
                <Sparkles className="h-6 w-6" />
              </div>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider hidden sm:block">
                Premium AI Workspace
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-zinc-100 tracking-tight leading-tight">
              Study Copilot
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              Your AI study command center — generate summaries, quizzes, flashcards, revision plans, and doubt answers directly from your uploaded notes.
            </p>
          </div>

          {/* 3D Hero Visual */}
          <div className="relative shrink-0 w-full md:w-[340px] h-[240px] flex items-center justify-center pointer-events-none mt-8 md:mt-0">
            <div 
              className="relative w-full h-full flex items-center justify-center transform-gpu"
              style={{ perspective: "1000px" }}
            >
              {/* Note Card (Bottom) */}
              <div 
                className="absolute w-48 h-64 bg-zinc-900/80 border border-zinc-700/50 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col p-4 transition-transform duration-1000"
                style={{ transform: "rotateX(20deg) rotateY(-20deg) rotateZ(-5deg) translateZ(-60px) translateX(20px)", opacity: 0.5 }}
              >
                <div className="h-2 w-1/3 bg-zinc-700 rounded-full mb-3" />
                <div className="h-1.5 w-full bg-zinc-800 rounded-full mb-2" />
                <div className="h-1.5 w-4/5 bg-zinc-800 rounded-full mb-2" />
                <div className="h-1.5 w-full bg-zinc-800 rounded-full mb-2" />
              </div>

              {/* Glowing Summary Card (Middle) */}
              <div 
                className="absolute w-52 h-64 bg-zinc-950 border border-indigo-500/30 rounded-2xl shadow-[0_0_40px_rgba(99,102,241,0.2)] backdrop-blur-xl flex flex-col p-5 transition-transform duration-1000"
                style={{ transform: "rotateX(15deg) rotateY(-15deg) rotateZ(0deg) translateZ(0px)" }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-indigo-400" />
                  <div className="h-2.5 w-20 bg-indigo-500/20 rounded-full" />
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full" />
                  <div className="h-1.5 w-11/12 bg-zinc-800 rounded-full" />
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full" />
                  <div className="h-1.5 w-4/5 bg-zinc-800 rounded-full" />
                </div>
                <div className="absolute -bottom-3 -right-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg backdrop-blur-md">
                  <CheckCircle2 className="h-3 w-3" /> Saved
                </div>
              </div>

              {/* Quiz Bubble (Top Right) */}
              <div 
                className="absolute bg-zinc-900/90 border border-violet-500/30 rounded-xl shadow-xl backdrop-blur-md p-3 flex items-center gap-2 transition-transform duration-1000"
                style={{ transform: "rotateX(10deg) rotateY(-10deg) translateZ(40px) translateY(-80px) translateX(90px)" }}
              >
                <BookOpen className="h-4 w-4 text-violet-400" />
                <span className="text-[10px] font-bold text-zinc-300">Quiz Gen</span>
              </div>

              {/* Flashcards Stack (Top Left) */}
              <div 
                className="absolute w-24 h-16 bg-zinc-900/90 border border-zinc-700/50 rounded-lg shadow-xl backdrop-blur-md p-2 flex flex-col items-center justify-center transition-transform duration-1000"
                style={{ transform: "rotateX(30deg) rotateY(10deg) rotateZ(-10deg) translateZ(30px) translateY(70px) translateX(-100px)" }}
              >
                <Library className="h-4 w-4 text-zinc-500 mb-1" />
                <span className="text-[9px] font-bold text-zinc-500 uppercase">Cards</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── B. Quick Start ── */}
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-2 px-1">
            <Zap className="h-5 w-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Quick Start</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {primaryTools.map((tool, idx) => {
              const Icon = tool.icon;
              const isActive = tool.enabled;
              const isFirst = idx === 0;
              return (
                <Card
                  key={tool.id}
                  className={`bg-zinc-900/40 border-zinc-800/60 backdrop-blur-md shadow-lg flex flex-col h-full relative overflow-hidden transition-colors ${
                    isFirst ? "border-indigo-500/30 shadow-indigo-500/5 hover:bg-zinc-900/60" : "opacity-70"
                  }`}
                >
                  {isFirst && (
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
                  )}
                  <CardHeader className="pb-3 relative z-10">
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className={`p-3 rounded-xl border ${
                          isFirst
                            ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                            : "bg-zinc-950 border-zinc-800 text-zinc-500"
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded border whitespace-nowrap font-bold uppercase tracking-wider ${
                          isActive
                            ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
                            : "bg-zinc-800/80 text-zinc-500 border-zinc-700"
                        }`}
                      >
                        {tool.status}
                      </span>
                    </div>
                    <CardTitle
                      className={`font-bold text-zinc-100 mt-5 leading-tight ${isFirst ? "text-xl" : "text-lg"}`}
                    >
                      {tool.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2 flex-1 flex flex-col justify-between relative z-10">
                    <p className={`${isFirst ? "text-sm" : "text-xs"} text-zinc-400 leading-relaxed`}>
                      {tool.description}
                    </p>
                    <div className="mt-6">
                      {isActive ? (
                        <Link href="/dashboard/browse">
                          <button className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2">
                            <Search className="h-3.5 w-3.5" /> Choose a Note
                          </button>
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="w-full py-2.5 rounded-lg bg-zinc-800/50 text-zinc-500 font-bold text-xs uppercase tracking-wider border border-zinc-800 cursor-not-allowed"
                        >
                          Coming Later
                        </button>
                      )}
                    </div>
                    {isActive && (
                      <p className="text-[10px] text-zinc-600 text-center mt-2">
                        Open any approved PDF note to generate.
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* ── B.5 Study Flow Section ── */}
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex items-center gap-2 px-1">
            <Activity className="h-5 w-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-zinc-100 tracking-tight">AI Study Flow</h2>
          </div>
          <div className="bg-zinc-900/30 border border-zinc-800/60 backdrop-blur-md rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 overflow-hidden relative">
            {/* Connecting Line */}
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-zinc-800/80 hidden md:block z-0" />
            
            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center text-center gap-2 bg-zinc-950 px-4 py-3 rounded-xl border border-zinc-800/80 w-full md:w-1/4 shadow-lg shadow-black/20">
              <div className="h-8 w-8 bg-zinc-900 border border-zinc-700 text-zinc-400 rounded-full flex items-center justify-center font-bold text-xs mb-1">1</div>
              <span className="text-xs font-bold text-zinc-200">Upload Note</span>
              <span className="text-[10px] text-zinc-500">PDF Document</span>
            </div>
            
            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center text-center gap-2 bg-zinc-950 px-4 py-3 rounded-xl border border-indigo-500/30 w-full md:w-1/4 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
              <div className="h-8 w-8 bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 rounded-full flex items-center justify-center font-bold text-xs mb-1 shadow-[0_0_15px_rgba(99,102,241,0.2)]">2</div>
              <span className="text-xs font-bold text-indigo-100">Smart Summary</span>
              <span className="text-[10px] text-indigo-300/70">Understand Core</span>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center text-center gap-2 bg-zinc-950 px-4 py-3 rounded-xl border border-zinc-800/80 w-full md:w-1/4 shadow-lg shadow-black/20 opacity-80">
              <div className="h-8 w-8 bg-zinc-900 border border-zinc-700 text-zinc-400 rounded-full flex items-center justify-center font-bold text-xs mb-1">3</div>
              <span className="text-xs font-bold text-zinc-300">Practice Quiz</span>
              <span className="text-[10px] text-zinc-500">Test Knowledge</span>
            </div>

            {/* Step 4 */}
            <div className="relative z-10 flex flex-col items-center text-center gap-2 bg-zinc-950 px-4 py-3 rounded-xl border border-zinc-800/80 w-full md:w-1/4 shadow-lg shadow-black/20 opacity-60">
              <div className="h-8 w-8 bg-zinc-900 border border-zinc-700 text-zinc-400 rounded-full flex items-center justify-center font-bold text-xs mb-1">4</div>
              <span className="text-xs font-bold text-zinc-400">Revise Weak Topics</span>
              <span className="text-[10px] text-zinc-600">Master Concepts</span>
            </div>
          </div>
        </div>

        {/* ── C. Saved Summaries ── */}
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between px-1">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-400" />
                <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Saved Results</h2>
              </div>
              <p className="text-xs text-zinc-500">Your generated summaries and practice quizzes.</p>
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

        {/* ── D. Tool Library ── */}
        <div className="flex flex-col gap-5 mt-4">
          <div className="flex items-center gap-2 px-1 mb-2">
            <Library className="h-5 w-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Tool Library</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
            {groupOrder.map((group) => {
              const tools = groupedTools[group] || [];
              if (tools.length === 0) return null;
              return (
                <div key={group} className="flex flex-col gap-3">
                  <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800/50 pb-2">
                    {group}
                  </h3>
                  <div className="flex flex-col gap-2">
                    {tools.map((tool) => {
                      const Icon = tool.icon;
                      return (
                        <div
                          key={tool.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/30 border border-zinc-800/40 hover:bg-zinc-900/60 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-lg border ${
                                tool.enabled
                                  ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                                  : "bg-zinc-950 border-zinc-800 text-zinc-500"
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-zinc-200">{tool.title}</span>
                              <span className="text-[10px] text-zinc-500 line-clamp-1">{tool.description}</span>
                            </div>
                          </div>
                          <span
                            className={`shrink-0 ml-4 text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${
                              tool.enabled
                                ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
                                : "bg-zinc-800/50 text-zinc-500 border-zinc-800"
                            }`}
                          >
                            {tool.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── E. Usage & Limits ── */}
        <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-md shadow-lg">
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5">
            <div className="bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-500/20 shrink-0">
              <Activity className="h-5 w-5 text-indigo-400" />
            </div>
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <span className="text-sm font-bold text-zinc-200">Usage &amp; Limits</span>
              <span className="text-xs text-zinc-500">
                Usage tracking is active for all Study Copilot tools.{" "}
                {hasSaved && (
                  <span className="text-zinc-400">
                    You have {savedData.length} saved result{savedData.length === 1 ? "" : "s"} so far.
                  </span>
                )}
              </span>
            </div>
            {hasSaved && (
              <div className="flex items-center gap-2 shrink-0">
                <Clock className="h-3.5 w-3.5 text-zinc-500" />
                <span className="text-[11px] text-zinc-500">
                  Last:{" "}
                  {new Date(savedData[0].created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

      </main>
      <Footer />
    </div>
  );
}
