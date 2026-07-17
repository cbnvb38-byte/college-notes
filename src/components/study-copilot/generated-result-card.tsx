"use client";

import { useState } from "react";
import {
  Sparkles,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Lightbulb,
  BookOpen,
  ListChecks,
  Target,
} from "lucide-react";
import { parseSummarySections, getGenerationTypeLabel, getCopyableResultText } from "@/lib/ai/result-formatting";

// ─── Types ───────────────────────────────────────────────────────────────────

interface GeneratedResultCardProps {
  resultText: string;
  resultJson?: Record<string, unknown> | null;
  generationType: string;
  noteTitle?: string;
  createdAt?: string;
  /** Show a close / hide button. Call this to dismiss the card. */
  onHide?: () => void;
  /** Compact mode: show preview only, with an "Open" toggle */
  compact?: boolean;
}

/** Render a single line as JSX bullet/numbered or plain */
function renderLine(line: string, idx: number) {
  const bulletMatch = line.match(/^[-*•]\s+(.+)$/);
  const numberedMatch = line.match(/^\d+[.)]\s+(.+)$/);
  const boldMatch = line.match(/^\*\*(.+?)\*\*[:\s]*(.*)$/);

  if (bulletMatch) {
    return (
      <li key={idx} className="flex gap-2 items-start">
        <span className="text-indigo-400 mt-0.5 shrink-0">•</span>
        <span className="text-zinc-300 leading-relaxed text-sm">{bulletMatch[1].replace(/\*\*/g, "")}</span>
      </li>
    );
  }
  if (numberedMatch) {
    return (
      <li key={idx} className="flex gap-2 items-start">
        <span className="text-indigo-400 font-bold shrink-0 text-xs mt-0.5">{line.match(/^\d+/)?.[0]}.</span>
        <span className="text-zinc-300 leading-relaxed text-sm">{numberedMatch[1].replace(/\*\*/g, "")}</span>
      </li>
    );
  }
  if (boldMatch) {
    return (
      <p key={idx} className="text-sm text-zinc-200 leading-relaxed">
        <span className="font-bold text-zinc-100">{boldMatch[1]}: </span>
        {boldMatch[2]}
      </p>
    );
  }
  if (line.trim() === "") return null;
  return (
    <p key={idx} className="text-sm text-zinc-300 leading-relaxed">
      {line.replace(/\*\*/g, "")}
    </p>
  );
}

/** Render the content of one section into clean JSX */
function SectionContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const hasBullets = lines.some((l) => /^[-*•]\s/.test(l) || /^\d+[.)]\s/.test(l));

  if (hasBullets) {
    return (
      <ul className="flex flex-col gap-1.5 mt-2 pl-0 list-none">
        {lines.map((l, i) => renderLine(l.trim(), i))}
      </ul>
    );
  }

  return (
    <div className="flex flex-col gap-2 mt-2">
      {lines.map((l, i) => renderLine(l.trim(), i))}
    </div>
  );
}

// ─── Section Icon Map ─────────────────────────────────────────────────────────

const SECTION_ICONS: Record<string, typeof Sparkles> = {
  "Quick Summary": Sparkles,
  "Detailed Summary": FileText,
  "Key Concepts": Lightbulb,
  "Important Exam Points": ListChecks,
  "Revision Tip": Target,
  "Summary": BookOpen,
};

const SECTION_ACCENT: Record<string, string> = {
  "Quick Summary": "border-indigo-500/30 bg-indigo-500/5",
  "Detailed Summary": "border-zinc-700/50 bg-zinc-900/40",
  "Key Concepts": "border-violet-500/30 bg-violet-500/5",
  "Important Exam Points": "border-amber-500/30 bg-amber-500/5",
  "Revision Tip": "border-emerald-500/30 bg-emerald-500/5",
  "Summary": "border-zinc-700/50 bg-zinc-900/40",
};

const SECTION_HEADING_COLOR: Record<string, string> = {
  "Quick Summary": "text-indigo-300",
  "Detailed Summary": "text-zinc-200",
  "Key Concepts": "text-violet-300",
  "Important Exam Points": "text-amber-300",
  "Revision Tip": "text-emerald-300",
  "Summary": "text-zinc-200",
};

// ─── Main Component ───────────────────────────────────────────────────────────

export function GeneratedResultCard({
  resultText,
  resultJson,
  noteTitle,
  createdAt,
  generationType,
  onHide,
  compact = false,
}: GeneratedResultCardProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(!compact);

  const sections = parseSummarySections(resultText, resultJson || null);

  const handleCopy = async () => {
    try {
      const copyText = getCopyableResultText({
        id: "", note_id: "", status: "completed", created_at: "",
        generation_type: generationType,
        note_title: noteTitle || "",
        result_text: resultText,
        result_json: resultJson || null
      });
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silent
    }
  };

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const typeLabel = getGenerationTypeLabel(generationType);

  return (
    <div className="w-full flex flex-col gap-0 rounded-2xl border border-zinc-800/60 bg-zinc-900/50 backdrop-blur-md overflow-hidden shadow-2xl">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-zinc-800/60 bg-zinc-950/40">
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 px-2 py-0.5 rounded-full">
              <Sparkles className="h-3 w-3" />
              {typeLabel}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              <Check className="h-2.5 w-2.5" />
              Saved
            </span>
          </div>
          {noteTitle && (
            <p className="text-sm font-semibold text-zinc-100 truncate">Generated Study Summary</p>
          )}
          <div className="flex items-center gap-3 flex-wrap">
            {noteTitle && (
              <span className="text-[11px] text-zinc-500 truncate max-w-xs">
                From: <span className="text-zinc-400">{noteTitle}</span>
              </span>
            )}
            {formattedDate && (
              <span className="text-[11px] text-zinc-500 flex items-center gap-1 shrink-0">
                <Clock className="h-3 w-3" />
                {formattedDate}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 hover:text-zinc-100 border border-zinc-700/50 hover:border-zinc-600 bg-zinc-800/50 hover:bg-zinc-800 px-2.5 py-1.5 rounded-lg transition-all"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>

          {compact && (
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
          )}

          {onHide && (
            <button
              onClick={onHide}
              className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-200 border border-zinc-700/50 hover:border-zinc-600 bg-zinc-800/50 hover:bg-zinc-800 px-2.5 py-1.5 rounded-lg transition-all"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* ── Body: sections ── */}
      {expanded && (
        <div className="flex flex-col gap-0 divide-y divide-zinc-800/40">
          {sections.map((section, i) => {
            const Icon = SECTION_ICONS[section.heading] ?? BookOpen;
            const accent = SECTION_ACCENT[section.heading] ?? "border-zinc-700/50 bg-zinc-900/40";
            const headingColor = SECTION_HEADING_COLOR[section.heading] ?? "text-zinc-200";

            return (
              <div
                key={i}
                className={`px-5 py-5 ${i === 0 ? accent : ""}`}
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <div
                    className={`p-1.5 rounded-lg border ${
                      section.heading === "Quick Summary"
                        ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                        : section.heading === "Key Concepts"
                        ? "bg-violet-500/10 border-violet-500/20 text-violet-400"
                        : section.heading === "Important Exam Points"
                        ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                        : section.heading === "Revision Tip"
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : "bg-zinc-800/60 border-zinc-700 text-zinc-400"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className={`text-sm font-bold ${headingColor}`}>{section.heading}</h3>
                </div>
                <SectionContent content={section.content} />
              </div>
            );
          })}
        </div>
      )}

      {/* ── Compact preview (when collapsed) ── */}
      {!expanded && (
        <div className="px-5 py-4">
          <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
            {sections[0]?.content.slice(0, 200).replace(/\*\*/g, "") ?? "Click Open to view the full summary."}
          </p>
        </div>
      )}
    </div>
  );
}
