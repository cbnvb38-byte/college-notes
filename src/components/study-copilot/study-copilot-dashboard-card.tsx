"use client";

import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { STUDY_TOOLS } from "@/lib/ai/study-tools";

export function StudyCopilotDashboardCard() {
  const primaryTools = STUDY_TOOLS.filter((t) => t.priority === "primary");
  const secondaryTools = STUDY_TOOLS.filter((t) => t.priority === "secondary");

  return (
    <Card className="bg-zinc-900/40 border-zinc-800/60 backdrop-blur-xl shadow-2xl relative overflow-hidden flex flex-col group">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/5 pointer-events-none" />
      
      {/* Premium border glow effect */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      <div className="flex flex-col lg:flex-row relative z-10">
        
        {/* Left Side: Hero Area */}
        <div className="flex-1 p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-zinc-800/40 flex flex-col justify-center">
          <div className="flex flex-col items-start gap-4 max-w-lg">
            <div className="flex items-center gap-2.5">
              <div className="bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20 text-indigo-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                Premium AI Workspace
              </span>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">Study Copilot</h2>
              <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                Transform uploaded notes into summaries, quizzes, flashcards, revision plans, important questions, and doubt answers.
              </p>
            </div>
            
            <div className="flex flex-col gap-2 mt-2 w-full sm:w-auto">
              <Link href="/dashboard/study-copilot">
                <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 rounded-xl gap-2 h-11 px-6">
                  Open Study Copilot <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <p className="text-[11px] text-zinc-500 font-medium ml-1">
                Smart Summary unlocks in Phase 8.1
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Primary Tools */}
        <div className="flex-1 p-6 lg:p-8 bg-zinc-950/20 flex flex-col justify-center">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {primaryTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <div key={tool.id} className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-4 flex flex-col gap-3 hover:border-indigo-500/30 hover:bg-zinc-900/80 transition-all shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="bg-zinc-950 p-2 rounded-lg text-indigo-400 border border-zinc-800">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-200">{tool.title}</h3>
                    <p className="text-[11px] text-zinc-500 mt-1 leading-tight line-clamp-2">
                      {tool.description}
                    </p>
                  </div>
                  <div className="mt-auto pt-2">
                    <span className="text-[9px] bg-zinc-800/80 text-zinc-400 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                      {tool.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Area: Secondary Tools Mini Chips */}
      <CardContent className="px-6 lg:px-8 py-4 border-t border-zinc-800/40 bg-zinc-950/40 relative z-10 flex flex-wrap gap-2 items-center">
        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mr-2">More Tools:</span>
        {secondaryTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <div key={tool.id} className="flex items-center gap-1.5 bg-zinc-900/80 border border-zinc-800/80 rounded-full px-3 py-1.5 opacity-70 hover:opacity-100 transition-opacity cursor-default">
              <Icon className="h-3 w-3 text-zinc-400" />
              <span className="text-xs font-semibold text-zinc-300">{tool.title}</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
