import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ArrowLeft, Copy, FileText, ExternalLink } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { GeneratedResultCard } from "@/components/study-copilot/generated-result-card";
import { getAIGenerationById } from "@/app/actions/copilot-history";
import { CopyResultButton } from "@/components/study-copilot/copy-result-button";
import { getGenerationTypeLabel, getCopyableResultText } from "@/lib/ai/result-formatting";

interface PageProps {
  params: Promise<{ generationId: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps) {
  return { title: "Study Summary - Study Copilot" };
}

export default async function GenerationReaderPage({ params }: PageProps) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { generationId } = await params;

  // Read-only fetch — no Gemini, no PDF, no usage increment
  const res = await getAIGenerationById(generationId);

  if (!res.success || !res.data) {
    return (
      <div className="relative min-h-screen bg-zinc-950 text-zinc-50 flex flex-col font-sans">
        <Header />
        <main className="flex-grow z-10 pt-28 pb-16 px-6 max-w-4xl mx-auto w-full flex flex-col items-center justify-center gap-6 text-center">
          <div className="bg-zinc-900/50 p-5 rounded-2xl border border-zinc-800">
            <FileText className="h-10 w-10 text-zinc-600 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-zinc-200">Generation not found</h2>
            <p className="text-sm text-zinc-500 mt-1">
              This result may have been deleted or does not belong to your account.
            </p>
            <Link href="/dashboard/study-copilot" className="mt-5 inline-block">
              <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-sm">
                Back to Study Copilot
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const gen = res.data;
  const formattedDate = new Date(gen.created_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const typeLabel = getGenerationTypeLabel(gen.generation_type);

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-50 overflow-hidden flex flex-col font-sans">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-80 pointer-events-none opacity-10 z-0">
        <div className="absolute top-10 left-1/4 w-96 h-96 rounded-full bg-indigo-600 blur-[120px]" />
        <div className="absolute top-16 right-1/4 w-80 h-80 rounded-full bg-violet-600 blur-[130px]" />
      </div>

      <Header />
      <main className="flex-grow z-10 pt-24 pb-16 px-6 max-w-4xl mx-auto w-full flex flex-col gap-6">

        {/* ── Navigation bar ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Link href="/dashboard/study-copilot">
            <Button
              variant="ghost"
              className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60 rounded-xl gap-2 text-sm h-9 px-3"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Study Copilot
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <Link href={`/notes/${gen.note_id}`}>
              <Button
                variant="outline"
                size="sm"
                className="border-zinc-700/60 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 text-xs h-8 gap-1.5"
              >
                <ExternalLink className="h-3.5 w-3.5" /> View Note
              </Button>
            </Link>
            <CopyResultButton text={getCopyableResultText(gen)} />
          </div>
        </div>

        {/* ── Page header ── */}
        <div className="flex flex-col gap-2 pb-2 border-b border-zinc-800/50">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 px-2.5 py-0.5 rounded-full">
              {typeLabel}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
              Saved
            </span>
          </div>
          <h1 className="text-xl font-black text-zinc-100 tracking-tight leading-tight">
            Generated Study Summary
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
            <span>
              From: <span className="text-zinc-300 font-semibold">{gen.note_title}</span>
            </span>
            <span>•</span>
            <span>Generated: {formattedDate}</span>
          </div>
        </div>

        {/* ── Result renderer — read-only, no AI call ── */}
        {gen.result_text ? (
          <GeneratedResultCard
            resultText={gen.result_text}
            resultJson={gen.result_json}
            generationType={gen.generation_type}
            noteTitle={gen.note_title}
            createdAt={gen.created_at}
          />
        ) : (
          <div className="text-center py-12 text-zinc-600">
            <p>No result text available for this generation.</p>
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
}
