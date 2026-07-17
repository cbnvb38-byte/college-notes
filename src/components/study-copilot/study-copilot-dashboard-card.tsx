"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, FileText, BookOpen, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

const PRIMARY_FEATURES = [
  { icon: FileText,     label: "Smart Summary",  status: "Active",  active: true  },
  { icon: BookOpen,     label: "Practice Quiz",  status: "Soon",    active: false },
  { icon: MessageCircle, label: "Ask Doubt",     status: "Soon",    active: false },
];

const SECONDARY_LABELS = [
  "Flashcards", "Important Questions", "Short Notes",
  "Revision Plan", "Key Concepts", "Weak Topic Practice",
];

export function StudyCopilotDashboardCard() {
  return (
    <Card className="relative overflow-hidden bg-zinc-900/40 border-zinc-800/60 backdrop-blur-xl shadow-xl group">
      {/* Top gradient accent line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-violet-500/5 pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-0 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800/40">

        {/* ── Left: Identity ── */}
        <div className="flex flex-col gap-3 p-5 lg:p-6 lg:w-72 shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-500/15 p-1.5 rounded-lg border border-indigo-500/25 text-indigo-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-[9px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Premium AI Workspace
            </span>
          </div>
          <div>
            <h2 className="text-lg font-black text-zinc-100 tracking-tight leading-tight">Study Copilot</h2>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
              Turn uploaded notes into summaries, quizzes, flashcards, revision plans, and doubt answers.
            </p>
          </div>
          <Link href="/dashboard/study-copilot" className="w-fit">
            <button className="inline-flex items-center gap-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-indigo-500/20">
              Open Study Copilot <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </Link>
        </div>

        {/* ── Middle: 3 Primary Feature Pills ── */}
        <div className="flex flex-row lg:flex-col gap-2 p-5 lg:p-6 flex-1 justify-center">
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-0.5 hidden lg:block">Featured Tools</p>
          <div className="flex flex-wrap lg:flex-nowrap lg:flex-col gap-2 w-full">
            {PRIMARY_FEATURES.map(({ icon: Icon, label, status, active }) => (
              <div
                key={label}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border flex-1 lg:flex-none transition-all ${
                  active
                    ? "bg-indigo-500/10 border-indigo-500/25 text-indigo-300"
                    : "bg-zinc-900/40 border-zinc-800/50 text-zinc-500"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 shrink-0 ${active ? "text-indigo-400" : "text-zinc-600"}`} />
                <span className="text-xs font-semibold truncate">{label}</span>
                <span
                  className={`ml-auto text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${
                    active
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                  }`}
                >
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: 3D Preview Stack ── */}
        <div className="p-5 lg:p-6 lg:w-64 shrink-0 flex items-center justify-center relative min-h-[140px] overflow-hidden">
          {/* CSS-only 3D Container */}
          <div 
            className="relative w-full h-full flex items-center justify-center pointer-events-none"
            style={{ perspective: "800px" }}
          >
            {/* Tilted Container */}
            <div 
              className="relative w-40 h-24 transform-gpu transition-transform duration-700 ease-out group-hover:rotate-x-12 group-hover:-rotate-y-12 group-hover:scale-105"
              style={{ transform: "rotateX(15deg) rotateY(-20deg) rotateZ(5deg)", transformStyle: "preserve-3d" }}
            >
              {/* Card 3 (Bottom) */}
              <div 
                className="absolute inset-0 bg-zinc-900/60 border border-zinc-700/50 rounded-xl shadow-2xl backdrop-blur-sm flex items-center justify-center"
                style={{ transform: "translateZ(-40px) translateY(15px) translateX(15px)", opacity: 0.4 }}
              >
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Flashcards</span>
              </div>
              
              {/* Card 2 (Middle) */}
              <div 
                className="absolute inset-0 bg-zinc-900/80 border border-indigo-500/20 rounded-xl shadow-2xl backdrop-blur-md flex items-center justify-center"
                style={{ transform: "translateZ(-20px) translateY(5px) translateX(5px)", opacity: 0.7 }}
              >
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Quiz</span>
              </div>
              
              {/* Card 1 (Top) */}
              <div 
                className="absolute inset-0 bg-zinc-950 border border-indigo-400/30 rounded-xl shadow-[0_0_30px_rgba(99,102,241,0.15)] backdrop-blur-xl flex flex-col items-center justify-center gap-1.5"
                style={{ transform: "translateZ(0px)" }}
              >
                <FileText className="h-4 w-4 text-indigo-400" />
                <span className="text-[10px] font-bold text-zinc-200 uppercase tracking-widest">Summary</span>
                {/* Decorative lines */}
                <div className="flex flex-col gap-1 w-2/3 mt-1">
                  <div className="h-0.5 rounded-full bg-zinc-800 w-full" />
                  <div className="h-0.5 rounded-full bg-zinc-800 w-4/5" />
                  <div className="h-0.5 rounded-full bg-zinc-800 w-5/6" />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </Card>
  );
}
