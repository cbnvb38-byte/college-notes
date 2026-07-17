import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Activity, FileText, Bot, Zap, Library, CheckCircle2 } from "lucide-react";
import { STUDY_TOOLS, StudyToolGroup } from "@/lib/ai/study-tools";

export const metadata = {
  title: "Study Copilot - College Notes",
  description: "Your AI study command center for summaries, quizzes, flashcards, revision plans, important questions, and note-based doubt solving.",
};

export default function StudyCopilotPage() {
  const primaryTools = STUDY_TOOLS.filter(t => t.priority === "primary");
  
  // Group tools for the library
  const groupedTools = STUDY_TOOLS.reduce((acc, tool) => {
    if (!acc[tool.group]) {
      acc[tool.group] = [];
    }
    acc[tool.group].push(tool);
    return acc;
  }, {} as Record<StudyToolGroup, typeof STUDY_TOOLS>);

  const groupOrder: StudyToolGroup[] = ["Understand", "Practice", "Exam Prep", "Doubt Solving"];

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-50 overflow-hidden flex flex-col font-sans">
      {/* Decorative background blur */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none opacity-10 z-0">
        <div className="absolute top-[10%] left-[15%] w-[450px] h-[450px] rounded-full bg-indigo-600 blur-[130px] animate-pulse duration-[8000ms]" />
        <div className="absolute top-[20%] right-[15%] w-[400px] h-[400px] rounded-full bg-violet-600 blur-[140px] animate-pulse duration-[10000ms]" />
      </div>

      <Header />
      <main className="flex-grow z-10 pt-24 pb-16 px-6 max-w-7xl mx-auto w-full flex flex-col gap-12">
        
        {/* A. Hero Section */}
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
              Your AI study command center for summaries, quizzes, flashcards, revision plans, important questions, and note-based doubt solving.
            </p>
          </div>
          
          <div className="bg-zinc-900/30 border border-zinc-800/60 backdrop-blur-md rounded-2xl p-5 flex flex-col gap-3 shrink-0 w-full md:w-64">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-medium text-zinc-300">Built for uploaded notes</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-medium text-zinc-300">Source-grounded study tools</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-medium text-zinc-300">Saved study material history</span>
            </div>
          </div>
        </div>

        {/* B. Quick Start Row */}
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-2 px-1">
            <Zap className="h-5 w-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Quick Start</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {primaryTools.map((tool, idx) => {
              const Icon = tool.icon;
              const isFirst = idx === 0;
              return (
                <Card 
                  key={tool.id} 
                  className={`bg-zinc-900/40 border-zinc-800/60 backdrop-blur-md hover:bg-zinc-900/60 transition-colors shadow-lg group flex flex-col h-full relative overflow-hidden ${isFirst ? 'md:col-span-1 border-indigo-500/30 shadow-indigo-500/5' : ''}`}
                >
                  {isFirst && <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />}
                  <CardHeader className="pb-3 relative z-10">
                    <div className="flex items-start justify-between gap-2">
                      <div className={`p-3 rounded-xl border ${isFirst ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400 group-hover:text-indigo-400 transition-colors'}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className={`text-[9px] px-2 py-0.5 rounded border whitespace-nowrap font-bold uppercase tracking-wider ${isFirst ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' : 'bg-zinc-800/80 text-zinc-400 border-zinc-700'}`}>
                        {tool.status}
                      </span>
                    </div>
                    <CardTitle className={`font-bold text-zinc-100 mt-5 leading-tight ${isFirst ? 'text-xl' : 'text-lg'}`}>{tool.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2 flex-1 flex flex-col justify-between relative z-10">
                    <p className={`${isFirst ? 'text-sm' : 'text-xs'} text-zinc-400 leading-relaxed`}>
                      {tool.description}
                    </p>
                    <div className="mt-6">
                      <button disabled className="w-full py-2.5 rounded-lg bg-zinc-800/50 text-zinc-500 font-bold text-xs uppercase tracking-wider border border-zinc-800 cursor-not-allowed">
                        Select Tool
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* C. Tool Library Section */}
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
                    {tools.map(tool => {
                      const Icon = tool.icon;
                      return (
                        <div key={tool.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/30 border border-zinc-800/40 hover:bg-zinc-900/60 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800 text-zinc-400">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-zinc-200">{tool.title}</span>
                              <span className="text-[10px] text-zinc-500 line-clamp-1">{tool.description}</span>
                            </div>
                          </div>
                          <button disabled className="shrink-0 ml-4 px-3 py-1.5 rounded-md bg-zinc-800/50 text-zinc-500 font-bold text-[10px] uppercase tracking-wider border border-zinc-800 cursor-not-allowed hidden sm:block">
                            Select
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* D & E. Stats and Saved Generations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          {/* Usage & Limits */}
          <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-md shadow-lg flex flex-col justify-center p-5 lg:col-span-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-indigo-500/10 p-2 rounded-lg text-indigo-400">
                <Activity className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-sm text-zinc-200">Usage & Limits</h3>
            </div>
            <p className="text-xs text-zinc-400 mt-2">
              Usage tracking activates when Smart Summary is enabled in Phase 8.1.
            </p>
            <div className="w-full bg-zinc-800/50 rounded-full h-1 mt-4">
              <div className="bg-indigo-500 h-1 rounded-full w-[0%]" />
            </div>
          </Card>

          {/* Saved Generations */}
          <Card className="bg-zinc-900/20 border border-zinc-800/40 border-dashed backdrop-blur-sm lg:col-span-2">
            <CardContent className="flex flex-col sm:flex-row items-center justify-center p-6 text-center sm:text-left gap-4 h-full">
              <div className="bg-zinc-900/50 p-3 rounded-full border border-zinc-800 shrink-0">
                <Bot className="h-5 w-5 text-zinc-500" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-zinc-300">Saved Generations</h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Your generated summaries, quizzes, flashcards, and doubt answers will appear here after tools are enabled.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

      </main>
      <Footer />
    </div>
  );
}
