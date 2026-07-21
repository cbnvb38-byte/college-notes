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
  Eye,
  HelpCircle,
  GraduationCap
} from "lucide-react";
import { parseSummarySections, getGenerationTypeLabel, getCopyableResultText, parseMCQResult, parseFlashcardsResult, parseImportantQuestionsResult } from "@/lib/ai/result-formatting";

import { StudyMarkdownRenderer } from "./study-markdown-renderer";

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

// ─── MCQ Component ────────────────────────────────────────────────────────────

function McqCard({ question, index }: { question: any, index: number }) {
  const [showAnswer, setShowAnswer] = useState(false);
  const labels = ["A", "B", "C", "D", "E"];

  let difficultyColor = "bg-zinc-800 text-zinc-300 border-zinc-700";
  if (question.difficulty === "easy") difficultyColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  if (question.difficulty === "medium") difficultyColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
  if (question.difficulty === "hard") difficultyColor = "bg-red-500/10 text-red-400 border-red-500/20";

  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-sm font-bold text-zinc-100 flex items-start gap-2">
          <span className="text-indigo-400 mt-0.5">{index + 1}.</span>
          <div className="flex-1 -mt-1"><StudyMarkdownRenderer content={question.question} /></div>
        </h3>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${difficultyColor}`}>
            {question.difficulty}
          </span>
          {question.topic && (
            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-zinc-800/80 text-zinc-400 border-zinc-700">
              {question.topic}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 pl-6">
        {(question.options || []).map((opt: string, i: number) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-zinc-800/50 bg-zinc-950/40">
            <span className="font-bold text-xs text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded shrink-0">{labels[i] || "-"}</span>
            <div className="text-sm text-zinc-300 -mt-1"><StudyMarkdownRenderer content={opt} /></div>
          </div>
        ))}
      </div>

      <div className="pl-6 mt-2">
        {!showAnswer ? (
          <button
            onClick={() => setShowAnswer(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Eye className="h-3.5 w-3.5" /> Show Answer
          </button>
        ) : (
          <div className="flex flex-col gap-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-sm font-bold text-emerald-300"><StudyMarkdownRenderer content={question.answer} /></div>
            </div>
            {question.explanation && (
              <div className="flex items-start gap-2 mt-1 pt-3 border-t border-emerald-500/10">
                <HelpCircle className="h-4 w-4 text-emerald-500/60 shrink-0 mt-0.5" />
                <div className="text-xs text-zinc-300 -mt-1"><StudyMarkdownRenderer content={question.explanation} /></div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Flashcard Component ───────────────────────────────────────────────────────

function Flashcard({ card, index }: { card: any, index: number }) {
  const [showAnswer, setShowAnswer] = useState(false);

  let difficultyColor = "bg-zinc-800 text-zinc-300 border-zinc-700";
  if (card.difficulty === "easy") difficultyColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  if (card.difficulty === "medium") difficultyColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
  if (card.difficulty === "hard") difficultyColor = "bg-red-500/10 text-red-400 border-red-500/20";

  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-sm font-bold text-zinc-100 flex items-start gap-2">
          <span className="text-indigo-400 mt-0.5">{index + 1}.</span>
          <div className="flex-1 -mt-1"><StudyMarkdownRenderer content={card.front} /></div>
        </h3>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${difficultyColor}`}>
            {card.difficulty || "medium"}
          </span>
          {card.topic && (
            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-zinc-800/80 text-zinc-400 border-zinc-700">
              {card.topic}
            </span>
          )}
        </div>
      </div>

      <div className="pl-6 mt-2">
        {!showAnswer ? (
          <button
            onClick={() => setShowAnswer(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Eye className="h-3.5 w-3.5" /> Show Answer
          </button>
        ) : (
          <div className="flex flex-col gap-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-sm font-bold text-emerald-300"><StudyMarkdownRenderer content={card.back} /></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Important Questions Component ──────────────────────────────────────────────

function ImportantQuestionCard({ question, index }: { question: any, index: number }) {
  let difficultyColor = "bg-zinc-800 text-zinc-300 border-zinc-700";
  if (question.difficulty === "easy") difficultyColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  if (question.difficulty === "medium") difficultyColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
  if (question.difficulty === "hard") difficultyColor = "bg-red-500/10 text-red-400 border-red-500/20";

  return (
    <div className="flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-sm font-bold text-zinc-100 flex items-start gap-2">
          <span className="text-indigo-400 mt-0.5">Q{index + 1}.</span>
          <div className="flex-1 -mt-1"><StudyMarkdownRenderer content={question.question} /></div>
        </h3>
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
          {question.marks && (
            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
              {question.marks} Marks
            </span>
          )}
          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${difficultyColor}`}>
            {question.difficulty || "medium"}
          </span>
          {question.topic && (
            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-zinc-800/80 text-zinc-400 border-zinc-700">
              {question.topic}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 pl-8">
        {question.why_important && (
          <div className="flex items-start gap-2 pt-2">
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider shrink-0 mt-0.5">Why it matters:</span>
            <div className="text-xs text-zinc-400 -mt-0.5"><StudyMarkdownRenderer content={question.why_important} /></div>
          </div>
        )}
        
        {question.answer_hint && (
          <div className="mt-2 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block mb-1">Answer Hint</span>
                <div className="text-sm text-emerald-200/90"><StudyMarkdownRenderer content={question.answer_hint} /></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


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

  const isMcq = generationType === "mcq";
  const isFlashcards = generationType === "flashcards";
  const isImportantQuestions = generationType === "important_questions";

  const parsedQuestions = isMcq ? parseMCQResult(resultText, resultJson || null) : null;
  const parsedCards = isFlashcards ? parseFlashcardsResult(resultText, resultJson || null) : null;
  const parsedImportant = isImportantQuestions ? parseImportantQuestionsResult(resultText, resultJson || null) : null;

  const questions = parsedQuestions || [];
  const cards = parsedCards || [];
  const importantSections = parsedImportant?.sections || [];

  const validMcq = isMcq && questions.length > 0;
  const validFlashcards = isFlashcards && cards.length > 0;
  const validImportant = isImportantQuestions && importantSections.length > 0;
  
  const sections = !isMcq && !isFlashcards && !isImportantQuestions ? parseSummarySections(resultText, resultJson || null) : [];

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
            <p className="text-sm font-semibold text-zinc-100 truncate">
              {generationType === "mcq" ? "Generated Practice Quiz" : generationType === "flashcards" ? "Generated Flashcards" : generationType === "important_questions" ? "Generated Important Questions" : "Generated Study Summary"}
            </p>
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
      {expanded && (!isMcq && !isFlashcards) && (
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
                <StudyMarkdownRenderer content={section.content} />
              </div>
            );
          })}
        </div>
      )}

      {/* ── Body: MCQ ── */}
      {expanded && validMcq && (
        <div className="flex flex-col gap-0 divide-y divide-zinc-800/40">
          {questions.map((q: any, i: number) => (
            <McqCard key={i} question={q} index={i} />
          ))}
        </div>
      )}

      {/* ── Body: Flashcards ── */}
      {expanded && validFlashcards && (
        <div className="flex flex-col gap-0 divide-y divide-zinc-800/40">
          {cards.map((c: any, i: number) => (
            <Flashcard key={i} card={c} index={i} />
          ))}
        </div>
      )}

      {/* ── Body: Important Questions ── */}
      {expanded && validImportant && (
        <div className="flex flex-col gap-6 p-5">
          {importantSections.map((sec: any, secIdx: number) => (
            <div key={secIdx} className="flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                <Target className="h-4 w-4 text-indigo-400" />
                <h3 className="font-bold text-zinc-200 uppercase tracking-wider text-xs">{sec.title}</h3>
              </div>
              <div className="flex flex-col gap-0 divide-y divide-zinc-800/40 border border-zinc-800/60 rounded-xl overflow-hidden bg-zinc-950/20">
                {(sec.questions || []).map((q: any, qIdx: number) => (
                  <ImportantQuestionCard key={qIdx} question={q} index={qIdx} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Body: MCQ Fallback ── */}
      {expanded && isMcq && !validMcq && (
        <div className="p-5 flex flex-col gap-4 text-sm text-zinc-300">
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-xl flex items-start gap-3">
            <HelpCircle className="h-5 w-5 mt-0.5 shrink-0" />
            <p>Practice Quiz was generated but could not be parsed into quiz cards.</p>
          </div>
          <details className="text-xs">
            <summary className="cursor-pointer text-zinc-500 font-semibold mb-2 hover:text-zinc-300">View raw fallback</summary>
            <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg overflow-x-auto">
              <pre className="text-zinc-400 whitespace-pre-wrap">{resultText || JSON.stringify(resultJson, null, 2)}</pre>
            </div>
          </details>
        </div>
      )}

      {/* ── Body: Flashcards Fallback ── */}
      {expanded && isFlashcards && !validFlashcards && (
        <div className="p-5 flex flex-col gap-4 text-sm text-zinc-300">
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-xl flex items-start gap-3">
            <HelpCircle className="h-5 w-5 mt-0.5 shrink-0" />
            <p>Flashcards were generated but could not be parsed into individual cards.</p>
          </div>
          <details className="text-xs">
            <summary className="cursor-pointer text-zinc-500 font-semibold mb-2 hover:text-zinc-300">View raw fallback</summary>
            <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg overflow-x-auto">
              <pre className="text-zinc-400 whitespace-pre-wrap">{resultText || JSON.stringify(resultJson, null, 2)}</pre>
            </div>
          </details>
        </div>
      )}

      {/* ── Body: Important Questions Fallback ── */}
      {expanded && isImportantQuestions && !validImportant && (
        <div className="p-5 flex flex-col gap-4 text-sm text-zinc-300">
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-xl flex items-start gap-3">
            <HelpCircle className="h-5 w-5 mt-0.5 shrink-0" />
            <p>Important questions were generated but could not be parsed correctly.</p>
          </div>
          <details className="text-xs">
            <summary className="cursor-pointer text-zinc-500 font-semibold mb-2 hover:text-zinc-300">View raw fallback</summary>
            <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg overflow-x-auto">
              <pre className="text-zinc-400 whitespace-pre-wrap">{resultText || JSON.stringify(resultJson, null, 2)}</pre>
            </div>
          </details>
        </div>
      )}

      {/* ── Compact preview (when collapsed) ── */}
      {!expanded && (
        <div className="px-5 py-4">
          <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
            {validMcq 
              ? `${questions.length} questions generated. Click Open to view and practice.`
              : validFlashcards
              ? `${cards.length} flashcards generated. Click Open to view and practice.`
              : validImportant
              ? `Important questions generated across ${importantSections.length} sections. Click Open to view.`
              : (sections[0]?.content.slice(0, 200).replace(/\*\*/g, "") ?? "Click Open to view the full result.")
            }
          </p>
        </div>
      )}
    </div>
  );
}
