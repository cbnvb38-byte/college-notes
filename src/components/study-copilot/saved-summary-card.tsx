"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Clock, ChevronDown, ChevronUp, Copy, Check, FileText } from "lucide-react";
import { SavedGeneration } from "@/app/actions/copilot-history";
import { GeneratedResultCard } from "./generated-result-card";

interface SavedSummaryCardProps {
  generation: SavedGeneration;
}

export function SavedSummaryCard({ generation }: SavedSummaryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const formattedDate = new Date(generation.created_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const preview = (generation.result_text ?? "")
    .replace(/##\s*/g, "")
    .replace(/\*\*/g, "")
    .replace(/\n+/g, " ")
    .trim()
    .slice(0, 160);

  const handleCopy = async () => {
    if (!generation.result_text) return;
    try {
      await navigator.clipboard.writeText(
        `Smart Summary — ${generation.note_title}\n${"=".repeat(60)}\n\n${generation.result_text}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silent
    }
  };

  return (
    <div className="flex flex-col rounded-2xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-md overflow-hidden shadow-lg transition-shadow hover:shadow-xl">
      {/* Card header */}
      <div className="flex items-start gap-4 px-5 py-4">
        {/* Icon */}
        <div className="bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-500/20 shrink-0 mt-0.5">
          <FileText className="h-5 w-5 text-indigo-400" />
        </div>

        {/* Meta */}
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 px-2 py-0.5 rounded-full">
              <Sparkles className="h-2.5 w-2.5" />
              Smart Summary
            </span>
          </div>
          <p className="text-sm font-bold text-zinc-100 truncate">{generation.note_title}</p>
          <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{preview}</p>
          <span className="text-[10px] text-zinc-600 flex items-center gap-1 mt-0.5">
            <Clock className="h-3 w-3" /> {formattedDate}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0 self-start">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 hover:text-zinc-100 border border-zinc-700/50 hover:border-zinc-600 bg-zinc-800/50 hover:bg-zinc-800 px-2.5 py-1.5 rounded-lg transition-all"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>

          <Link
            href={`/notes/${generation.note_id}`}
            className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400 hover:text-indigo-300 border border-zinc-700/50 hover:border-indigo-500/30 bg-zinc-800/50 hover:bg-indigo-500/10 px-2.5 py-1.5 rounded-lg transition-all"
          >
            Note
          </Link>

          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400 hover:text-zinc-100 border border-zinc-700/50 hover:border-zinc-600 bg-zinc-800/50 hover:bg-zinc-800 px-2.5 py-1.5 rounded-lg transition-all"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" /> Hide
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" /> Open
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expanded: full GeneratedResultCard */}
      {expanded && generation.result_text && (
        <div className="border-t border-zinc-800/40">
          <GeneratedResultCard
            resultText={generation.result_text}
            resultJson={generation.result_json}
            generationType={generation.generation_type}
            noteTitle={generation.note_title}
            createdAt={generation.created_at}
            onHide={() => setExpanded(false)}
          />
        </div>
      )}
    </div>
  );
}
