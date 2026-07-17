"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Clock, Copy, Check, FileText, ExternalLink, ArrowRight } from "lucide-react";
import { SavedGeneration } from "@/app/actions/copilot-history";
import { getResultPreview, getCopyableResultText } from "@/lib/ai/result-formatting";

interface SavedSummaryCardProps {
  generation: SavedGeneration;
}

export function SavedSummaryCard({ generation }: SavedSummaryCardProps) {
  const [copied, setCopied] = useState(false);

  const formattedDate = new Date(generation.created_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const preview = getResultPreview(generation);

  const handleCopy = async () => {
    try {
      const copyText = getCopyableResultText(generation);
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silent
    }
  };

  return (
    <div className="flex items-start gap-4 px-5 py-4 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm hover:bg-zinc-900/60 transition-colors group">
      {/* Icon */}
      <div className="bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-500/20 shrink-0 mt-0.5">
        <FileText className="h-4 w-4 text-indigo-400" />
      </div>

      {/* Meta */}
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 px-2 py-0.5 rounded-full">
            <Sparkles className="h-2.5 w-2.5" />
            Smart Summary
          </span>
          <span className="text-[10px] text-zinc-600 flex items-center gap-1">
            <Clock className="h-3 w-3" /> {formattedDate}
          </span>
        </div>
        <p className="text-sm font-bold text-zinc-100 truncate">{generation.note_title}</p>
        <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{preview}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0 self-start pt-0.5">
        <button
          onClick={handleCopy}
          title="Copy summary"
          className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-zinc-200 border border-zinc-700/50 hover:border-zinc-600 bg-zinc-800/40 hover:bg-zinc-800 px-2.5 py-1.5 rounded-lg transition-all"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>

        <Link
          href={`/notes/${generation.note_id}`}
          title="View source note"
          className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-zinc-200 border border-zinc-700/50 hover:border-zinc-600 bg-zinc-800/40 hover:bg-zinc-800 px-2.5 py-1.5 rounded-lg transition-all"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>

        {/* Open navigates to the dedicated result reader — no Gemini, no usage */}
        <Link
          href={`/dashboard/study-copilot/${generation.id}`}
          className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 hover:border-indigo-400/40 bg-indigo-500/10 hover:bg-indigo-500/15 px-3 py-1.5 rounded-lg transition-all"
        >
          Open <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
