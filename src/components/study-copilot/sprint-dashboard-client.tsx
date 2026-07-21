"use client";

import { useState } from "react";
import { SavedGeneration, getExamSprintStatusAction } from "@/app/actions/copilot-history";
import { generateStudyMaterialAction, generateWithDocumentFallback } from "@/app/actions/copilot";
import { UserAIUsage } from "@/app/actions/ai-usage";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Sparkles, AlertCircle, ArrowRight, BookOpen, Brain, ListOrdered, GraduationCap, Eye } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { GenerationType } from "@/lib/ai/types";

interface SprintDashboardClientProps {
  noteId: string;
  noteTitle: string;
  existingGenerations: SavedGeneration[];
  usageData: UserAIUsage;
}

const SPRINT_STEPS = [
  {
    id: "summary",
    title: "Smart Summary",
    description: "A concise overview of the core concepts.",
    icon: <BookOpen className="h-5 w-5" />,
    type: "summary" as GenerationType,
  },
  {
    id: "important_questions",
    title: "Important Questions",
    description: "Expected exam questions based on this note.",
    icon: <ListOrdered className="h-5 w-5" />,
    type: "important_questions" as GenerationType,
  },
  {
    id: "flashcards",
    title: "Flashcards",
    description: "Quick-fire terms and definitions for memorization.",
    icon: <Brain className="h-5 w-5" />,
    type: "flashcards" as GenerationType,
  },
  {
    id: "mcq",
    title: "Practice Quiz",
    description: "Test your knowledge with multiple choice questions.",
    icon: <GraduationCap className="h-5 w-5" />,
    type: "mcq" as GenerationType,
  },
];

export function SprintDashboardClient({ noteId, noteTitle, existingGenerations, usageData }: SprintDashboardClientProps) {
  const [generations, setGenerations] = useState<SavedGeneration[]>(existingGenerations);
  const [loadingStep, setLoadingStep] = useState<string | null>(null);
  const [requiresDocumentReading, setRequiresDocumentReading] = useState<GenerationType | null>(null);

  const getStepStatus = (type: string) => {
    return generations.find(g => g.generation_type === type && g.status === "completed");
  };

  const handleGenerate = async (type: GenerationType, useDocumentFallback: boolean = false) => {
    console.log(useDocumentFallback ? "[Exam Sprint Document Fallback Start]" : "[Exam Sprint Generate Start]");
    console.log("generationType:", type);
    console.log("noteId:", noteId);
    
    if (usageData.usedThisMonth >= usageData.monthlyLimit) {
      toast.error("Usage limit reached. You cannot generate more this month.");
      return;
    }

    setLoadingStep(type);
    toast.loading(`Generating ${type}...`, { id: `sprint-${type}` });
    setRequiresDocumentReading(null);

    try {
      const res = useDocumentFallback 
        ? await generateWithDocumentFallback(noteId, type) 
        : await generateStudyMaterialAction(noteId, type);
      
      console.log("[Exam Sprint Generate Response]");
      console.log("success:", res.success);
      if (res.success && 'data' in res) console.log("generationId:", res.data?.id);
      if (!res.success) {
        console.log("error:", res.error);
        console.log("requiresDocumentReading:", res.error && 'code' in res.error && (res.error as any).code === "SCANNED_PDF_CONFIRM_REQUIRED");
      }
      
      if (!res.success) {
        if (res.error && 'code' in res.error && (res.error as any).code === "SCANNED_PDF_CONFIRM_REQUIRED") {
          toast.error("This note needs document reading.", { id: `sprint-${type}` });
          setRequiresDocumentReading(type);
        } else {
          const errorMessage = typeof res.error === 'object' && res.error !== null && 'message' in res.error ? (res.error as any).message : "Generation failed.";
          toast.error(errorMessage, { id: `sprint-${type}` });
        }
        return;
      }

      toast.success(`${SPRINT_STEPS.find(s => s.type === type)?.title || type} generated and saved.`, { id: `sprint-${type}` });
      
      usageData.usedThisMonth += 1;

      // Refresh sprint status from server
      const statusRes = await getExamSprintStatusAction(noteId);
      if (statusRes.success && statusRes.steps) {
        const readySteps = Object.keys(statusRes.steps).filter(k => statusRes.steps[k].status === "ready");
        const missingSteps = Object.keys(statusRes.steps).filter(k => statusRes.steps[k].status === "missing");
        console.log("[Exam Sprint Status Refresh]");
        console.log("noteId:", noteId);
        console.log("readySteps:", readySteps);
        console.log("missingSteps:", missingSteps);

        // Update local state with latest generationIds from server
        const updatedGenerations = [...generations];
        if (statusRes.steps[type].status === "ready") {
          const newGenId = statusRes.steps[type].generationId;
          if (!updatedGenerations.find(g => g.id === newGenId)) {
            updatedGenerations.unshift({
              id: newGenId,
              note_id: noteId,
              note_title: noteTitle,
              generation_type: type,
              status: "completed",
              result_text: null,
              result_json: null,
              created_at: new Date().toISOString()
            });
            console.log("[Exam Sprint Step Updated]");
            console.log("generationType:", type);
            console.log("status:", "completed");
            console.log("generationId:", newGenId);
          }
        }
        setGenerations(updatedGenerations);
      } else {
        // Fallback optimistic update if status fetch fails
        if ('data' in res && res.data?.id) {
          setGenerations(prev => [
            {
              id: res.data!.id as string,
              note_id: noteId,
              note_title: noteTitle,
              generation_type: type,
              status: "completed",
              result_text: null,
              result_json: null,
              created_at: new Date().toISOString()
            },
            ...prev
          ]);
        }
      }

    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred.", { id: `sprint-${type}` });
    } finally {
      setLoadingStep(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SPRINT_STEPS.map((step, index) => {
          const savedResult = getStepStatus(step.type);
          const isReady = !!savedResult;
          const isLoading = loadingStep === step.type;
          const isDocReadingRequired = requiresDocumentReading === step.type;
          
          return (
            <div key={step.id} className="bg-zinc-900/40 border border-zinc-800/80 p-5 sm:p-6 rounded-3xl flex flex-col gap-4 relative overflow-hidden group hover:border-amber-500/30 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border flex items-center justify-center
                    ${isReady 
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 group-hover:text-amber-500 group-hover:bg-amber-500/10 transition-colors"
                    }`}>
                    {step.icon}
                  </div>
                  <div>
                    <h3 className="text-zinc-100 font-bold flex items-center gap-2">
                      Step {index + 1}: {step.title}
                    </h3>
                    <p className="text-xs text-zinc-500">{step.description}</p>
                  </div>
                </div>
              </div>

              {isDocReadingRequired && !isReady ? (
                <div className="mt-2 pt-4 border-t border-zinc-800/50 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-medium bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    This note looks scanned or image-based. Use document reading to generate this step.
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={() => handleGenerate(step.type, true)}
                      disabled={isLoading}
                      className="h-8 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 flex-1 transition-all disabled:opacity-50"
                    >
                      {isLoading ? (
                        <><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Generating...</>
                      ) : (
                        <><Eye className="mr-1.5 h-3.5 w-3.5" /> Use Document Reading</>
                      )}
                    </Button>
                    <Link href={`/notes/${noteId}`} className="flex-1">
                      <Button variant="outline" className="h-8 w-full text-xs font-bold bg-zinc-950 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800">
                        Open Note
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between mt-2 pt-4 border-t border-zinc-800/50">
                  {isReady ? (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full w-fit">
                      <Check className="h-3.5 w-3.5" /> Ready
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800 w-fit">
                      Not generated yet
                    </div>
                  )}

                  {isReady ? (
                    <Link href={`/dashboard/study-copilot/${savedResult.id}`}>
                      <Button variant="outline" className="h-8 text-xs font-bold bg-zinc-950 border-emerald-500/30 text-emerald-400 hover:text-emerald-300 hover:bg-zinc-900">
                        Open Reader <ArrowRight className="ml-1.5 h-3 w-3" />
                      </Button>
                    </Link>
                  ) : (
                    <Button 
                      onClick={() => handleGenerate(step.type)} 
                      disabled={isLoading || loadingStep !== null}
                      className="h-8 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 px-4 transition-all disabled:opacity-50"
                    >
                      {isLoading ? (
                        <><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Generating...</>
                      ) : (
                        <><Sparkles className="mr-1.5 h-3.5 w-3.5" /> Generate</>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-zinc-900/60 border border-zinc-800/80 p-6 rounded-3xl mt-4">
        <h3 className="text-lg font-bold text-zinc-200 mb-2 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-indigo-400" />
          Final Revision Path
        </h3>
        <p className="text-zinc-400 text-sm mb-4">Follow this optimal order to maximize your retention before the exam:</p>
        
        <div className="flex flex-col gap-3 text-sm font-medium text-zinc-300">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-800 text-zinc-400 text-xs">1</span>
            Read the Smart Summary to grasp the big picture.
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-800 text-zinc-400 text-xs">2</span>
            Review Important Questions to know what to expect.
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-800 text-zinc-400 text-xs">3</span>
            Memorize core concepts using Flashcards.
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-800 text-zinc-400 text-xs">4</span>
            Test your readiness with the Practice Quiz.
          </div>
        </div>
      </div>
    </div>
  );
}
