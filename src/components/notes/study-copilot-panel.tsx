"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, 
  BrainCircuit, 
  FileText, 
  ListChecks, 
  Layers, 
  AlignLeft, 
  CalendarDays, 
  MessageCircleQuestion, 
  Target, 
  AlertTriangle,
  Lock,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Copy
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GeneratedResultCard } from "@/components/study-copilot/generated-result-viewer";
import { getStudyCopilotAccess, generateStudyMaterial } from "@/app/actions/copilot";
import { GenerationType } from "@/lib/ai/gemini";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface StudyCopilotPanelProps {
  noteId: string;
}

const TOOLS = [
  { id: 'summary' as GenerationType, label: 'Smart Summary', desc: 'Understand the full note in minutes', icon: FileText, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { id: 'important_questions' as GenerationType, label: 'Exam Questions', desc: 'Generate important long and short questions', icon: BrainCircuit, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { id: 'mcq' as GenerationType, label: 'MCQ Practice', desc: 'Create quiz questions for quick revision', icon: ListChecks, color: 'text-green-400', bg: 'bg-green-400/10' },
  { id: 'flashcards' as GenerationType, label: 'Flashcards', desc: 'Memorize key concepts faster', icon: Layers, color: 'text-orange-400', bg: 'bg-orange-400/10' },
  { id: 'short_notes' as GenerationType, label: 'Short Notes', desc: 'Create crisp last-minute revision notes', icon: AlignLeft, color: 'text-pink-400', bg: 'bg-pink-400/10' },
  { id: 'revision_plan' as GenerationType, label: 'Revision Plan', desc: 'Make a 3-day or 7-day study plan', icon: CalendarDays, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  { id: 'key_concepts' as GenerationType, label: 'Key Concepts', desc: 'Extract definitions, formulas, and points', icon: Target, color: 'text-red-400', bg: 'bg-red-400/10' },
  { id: 'weak_topic_practice' as GenerationType, label: 'Weak Topics', desc: 'Practice topics that are usually confusing', icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { id: 'doubt_answer' as GenerationType, label: 'Ask Doubt', desc: 'Ask a question based only on this note', icon: MessageCircleQuestion, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
];

export function StudyCopilotPanel({ noteId }: StudyCopilotPanelProps) {
  const [access, setAccess] = useState<{ plan: string; limit: number; used: number; hasAccess: boolean } | null>(null);
  const [loadingAccess, setLoadingAccess] = useState(true);
  
  const [isGenerating, setIsGenerating] = useState<GenerationType | null>(null);
  const [generatedResult, setGeneratedResult] = useState<any>(null);
  const [generatedType, setGeneratedType] = useState<GenerationType | null>(null);

  const fetchAccess = async () => {
    try {
      const res = await getStudyCopilotAccess();
      if (res.success && "data" in res && res.data) {
        setAccess(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAccess(false);
    }
  };

  useEffect(() => {
    fetchAccess();
  }, []);

  const handleGenerate = async (type: GenerationType) => {
    if (!access?.hasAccess) return;
    
    setIsGenerating(type);
    setGeneratedResult(null);
    setGeneratedType(null);

    try {
      const res = await generateStudyMaterial(noteId, type);
      if (res.success && "data" in res && res.data) {
        toast.success(`${type} generated successfully!`);
        setGeneratedResult(res.data.result_json || res.data.result_text);
        setGeneratedType(type);
        // Refresh access to update progress bar
        fetchAccess();
      } else {
        const errMsg = !res.success && res.error && typeof res.error === "object" ? res.error.message : (typeof res.error === "string" ? res.error : "Failed to generate material.");
        toast.error(errMsg);
        // Safely show the placeholder state without breaking the UI
        if (!res.success && res.error && typeof res.error === "object" && res.error.code === "EXTRACTION_NOT_READY") {
          setGeneratedResult({ _error: res.error.message });
        }
      }
    } catch (e: any) {
      toast.error(e.message || "An unexpected error occurred.");
    } finally {
      setIsGenerating(null);
    }
  };

  const copyToClipboard = () => {
    if (!generatedResult) return;
    const text = typeof generatedResult === 'string' ? generatedResult : JSON.stringify(generatedResult, null, 2);
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (loadingAccess) {
    return (
      <Card className="bg-zinc-900/50 border-zinc-800 animate-pulse h-64">
        <CardContent className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const isLocked = access && !access.hasAccess;
  const progressValue = access ? (access.used / access.limit) * 100 : 0;

  return (
    <Card className="bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 border-zinc-800/80 shadow-2xl relative overflow-hidden backdrop-blur-xl">
      {/* Premium background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/10 rounded-full blur-[100px] pointer-events-none" />
      
      <CardHeader className="relative z-10 border-b border-zinc-800/50 pb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="h-5 w-5 text-indigo-400" />
              <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-400">
                Study Copilot
              </CardTitle>
              {access?.plan === 'premium' ? (
                <span className="ml-2 text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full shadow-lg shadow-orange-500/20">
                  Premium
                </span>
              ) : (
                <span className="ml-2 text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-300 border border-zinc-700 px-2 py-0.5 rounded-full">
                  Free Plan
                </span>
              )}
            </div>
            <CardDescription className="text-zinc-400 text-sm">
              Turn this note into exam-ready study material.
            </CardDescription>
            <div className="mt-2 text-xs font-medium text-zinc-500 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" /> Answers are based on uploaded note content.
            </div>
          </div>

          {/* Usage Stats */}
          {access && (
            <div className="w-full md:w-64 bg-zinc-950/50 border border-zinc-800/60 rounded-xl p-3 shadow-inner">
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span className="text-zinc-400">Monthly Usage</span>
                <span className={isLocked ? "text-red-400" : "text-indigo-400"}>
                  {access.used} / {access.limit}
                </span>
              </div>
              <Progress value={progressValue} className="h-1.5 bg-zinc-800" />
              <div className="mt-2 text-[10px] text-zinc-500 text-right">
                {access.limit - access.used} generations remaining
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="relative z-10 pt-6">
        
        {/* Results Area (If something is generated) */}
        {generatedResult && (
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-zinc-200 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                Generated Result
              </h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard} className="h-8 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800">
                  <Copy className="h-3.5 w-3.5 mr-2" /> Copy
                </Button>
                {access?.hasAccess && generatedType && (
                  <Button variant="outline" size="sm" onClick={() => handleGenerate(generatedType)} className="h-8 border-zinc-700 text-indigo-400 hover:text-indigo-300 hover:bg-zinc-800">
                     Regenerate
                  </Button>
                )}
              </div>
            </div>
            
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-5 text-sm text-zinc-300 leading-relaxed overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
              {generatedResult._error ? (
                <div className="flex flex-col items-center justify-center py-8 text-center gap-4">
                   <AlertTriangle className="h-10 w-10 text-yellow-500/80" />
                   <div>
                     <p className="font-medium text-zinc-200">{generatedResult._error}</p>
                     <p className="text-xs text-zinc-500 mt-1">This feature will be fully unlocked soon.</p>
                   </div>
                </div>
              ) : generatedType ? (
                <GeneratedResultCard type={generatedType} data={generatedResult} />
              ) : (
                <pre className="whitespace-pre-wrap font-mono text-xs">{JSON.stringify(generatedResult, null, 2)}</pre>
              )}
            </div>
          </div>
        )}

        {/* Tools Grid */}
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-zinc-300">Exam Readiness Tools</h3>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">
              PDF Export Coming Soon
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TOOLS.map((tool) => {
              const Icon = tool.icon;
              const isLoading = isGenerating === tool.id;
              
              const isDisabled = tool.id !== 'summary';
              return (
                <button
                  key={tool.id}
                  onClick={() => handleGenerate(tool.id)}
                  disabled={isLocked || isGenerating !== null || isDisabled}
                  className={`
                    group relative text-left p-4 rounded-xl border transition-all duration-300
                    ${(isLocked || isGenerating !== null || isDisabled)
                      ? 'border-zinc-800/50 bg-zinc-900/30 opacity-60 cursor-not-allowed' 
                      : 'border-zinc-800/80 bg-zinc-900/50 hover:bg-zinc-800 hover:border-zinc-700 cursor-pointer shadow-sm hover:shadow-md'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${tool.bg} ${(isLocked || isDisabled) ? 'grayscale opacity-50' : ''}`}>
                      {isLoading ? (
                        <Loader2 className={`h-5 w-5 ${tool.color} animate-spin`} />
                      ) : (
                        <Icon className={`h-5 w-5 ${tool.color}`} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-zinc-200 group-hover:text-white transition-colors">
                          {tool.label}
                        </h4>
                        {isDisabled && (
                           <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                             Soon
                           </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-1">
                        {tool.desc}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Locked Overlay */}
          {isLocked && (
             <div className="absolute inset-0 z-20 backdrop-blur-[2px] bg-zinc-950/40 rounded-xl flex items-center justify-center border border-zinc-800/50">
                <div className="bg-zinc-900 border border-zinc-800 shadow-2xl rounded-2xl p-6 max-w-sm text-center flex flex-col items-center">
                  <div className="bg-indigo-500/10 p-3 rounded-full mb-4">
                    <Lock className="h-6 w-6 text-indigo-400" />
                  </div>
                  <h3 className="font-bold text-lg text-zinc-100 mb-2">Limit Reached</h3>
                  <p className="text-sm text-zinc-400 mb-6">
                    You've used all {access.limit} free generations for this month. Unlock unlimited exam preparation tools.
                  </p>
                  <Button className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-bold border-0 shadow-lg shadow-indigo-500/25">
                    Payments coming in Phase 9
                  </Button>
                </div>
             </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
