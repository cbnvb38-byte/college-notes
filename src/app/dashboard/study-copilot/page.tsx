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
import { SavedSummaryCard } from "@/components/study-copilot/saved-summary-card";

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

          <div className="bg-zinc-900/30 border border-zinc-800/60 backdrop-blur-md rounded-2xl p-5 flex flex-col gap-3 shrink-0 w-full md:w-64">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="text-xs font-medium text-zinc-300">Built for uploaded notes</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="text-xs font-medium text-zinc-300">Source-grounded study tools</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="text-xs font-medium text-zinc-300">Saved study material history</span>
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

        {/* ── C. Saved Summaries ── */}
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-400" />
              <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Saved Summaries</h2>
            </div>
            {hasSaved && (
              <span className="text-[10px] text-zinc-500 bg-zinc-900/50 border border-zinc-800 px-2.5 py-1 rounded-full font-medium">
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
              <p className="text-sm font-semibold text-zinc-400">No saved summaries yet</p>
              <p className="text-xs text-zinc-600 max-w-xs">
                Open any approved note and click{" "}
                <span className="text-zinc-400 font-medium">Smart Summary</span> to generate your first AI study document.
              </p>
              <Link
                href="/dashboard/browse"
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Browse Notes <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {savedData.map((gen) => (
                <SavedSummaryCard key={gen.id} generation={gen} />
              ))}
            </div>
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
                Usage tracking is active for Smart Summary generations.{" "}
                {hasSaved && (
                  <span className="text-zinc-400">
                    You have generated {savedData.length} summar{savedData.length === 1 ? "y" : "ies"} so far.
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
