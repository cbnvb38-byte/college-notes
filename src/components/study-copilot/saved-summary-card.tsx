"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Clock, Copy, Check, FileText, ExternalLink, ArrowRight, BookOpen, Trash2, Loader2, GraduationCap, HelpCircle } from "lucide-react";
import { SavedGeneration, deleteAIGenerationAction } from "@/app/actions/copilot-history";
import { getResultPreview, getCopyableResultText, getGenerationTypeLabel } from "@/lib/ai/result-formatting";
import { toast } from "sonner";

interface SavedSummaryCardProps {
  generation: SavedGeneration;
}

export function SavedSummaryCard({ generation }: SavedSummaryCardProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
      toast.success("Copied to clipboard.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard.");
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Delete this saved result? This cannot be undone.");
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const res = await deleteAIGenerationAction(generation.id);
      if (res.success) {
        toast.success("Saved result deleted.");
        router.refresh();
      } else {
        toast.error(res.error || "Could not delete saved result. Please try again.");
      }
    } catch {
      toast.error("Could not delete saved result. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-start gap-4 px-5 py-4 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm hover:bg-zinc-900/80 hover:border-indigo-500/30 hover:shadow-[0_4px_20px_rgba(99,102,241,0.05)] transition-all group">
      {/* Icon */}
      <div className="bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-500/20 shrink-0 mt-0.5">
        {generation.generation_type === "mcq" ? (
          <BookOpen className="h-4 w-4 text-indigo-400" />
        ) : generation.generation_type === "flashcards" ? (
          <GraduationCap className="h-4 w-4 text-indigo-400" />
        ) : generation.generation_type === "doubt_answer" ? (
          <HelpCircle className="h-4 w-4 text-indigo-400" />
        ) : (
          <FileText className="h-4 w-4 text-indigo-400" />
        )}
      </div>

      {/* Meta */}
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 px-2 py-0.5 rounded-full">
            <Sparkles className="h-2.5 w-2.5" />
            {getGenerationTypeLabel(generation.generation_type)}
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

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          title="Delete saved result"
          className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-red-400 border border-zinc-700/50 hover:border-red-500/30 bg-zinc-800/40 hover:bg-red-500/10 px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-50"
        >
          {isDeleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
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
