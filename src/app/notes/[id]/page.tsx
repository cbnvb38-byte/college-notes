import { fetchNoteDetailsAction } from "@/app/actions/notes";
import NoteDetailsClient from "@/app/notes/[id]/note-details-client";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { FileWarning, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Note Details - College Notes",
  description: "View details and download academic notes.",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function NoteDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const res = await fetchNoteDetailsAction(id);

  if (!res.success || !("data" in res) || !res.data) {
    // Return a clean 404 page if note does not exist or isn't approved
    return (
      <div className="relative min-h-screen bg-zinc-950 text-zinc-50 overflow-hidden flex flex-col font-sans">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center pt-24 pb-16 px-6 max-w-7xl mx-auto w-full text-center z-10">
          <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-md max-w-md w-full p-8 shadow-2xl">
            <CardContent className="flex flex-col items-center justify-center text-center gap-6 p-0">
              <div className="bg-red-500/10 p-4 rounded-full border border-red-500/20 text-red-400">
                <FileWarning className="h-10 w-10" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-bold text-xl text-zinc-200">Note Not Found</h3>
                <p className="text-sm text-zinc-500">
                  The note you are looking for does not exist, is pending review, or has been removed.
                </p>
              </div>
              <Link href="/dashboard/browse" className="w-full">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/10 h-11">
                  Back to Library
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const { note, averageRating, relatedNotes } = res.data;

  const { getBookmarkState } = await import("@/app/actions/bookmarks");
  const bookmarkRes = await getBookmarkState(id);
  const initialIsBookmarked = bookmarkRes.success && "data" in bookmarkRes ? bookmarkRes.data : false;

  const { getCurrentUserRating } = await import("@/app/actions/ratings");
  const ratingRes = await getCurrentUserRating(id);
  const initialUserRating = ratingRes.success && "data" in ratingRes && typeof ratingRes.data === "number" 
    ? ratingRes.data 
    : 0;

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-50 overflow-hidden flex flex-col font-sans">
      {/* Decorative background blur */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none opacity-20 z-0">
        <div className="absolute top-[10%] left-[15%] w-[450px] h-[450px] rounded-full bg-indigo-600 blur-[130px] animate-pulse duration-[8000ms]" />
        <div className="absolute top-[20%] right-[15%] w-[400px] h-[400px] rounded-full bg-violet-600 blur-[140px] animate-pulse duration-[10000ms]" />
      </div>

      <Header />
      <main className="flex-grow z-10 pt-24 pb-16 px-6 max-w-7xl mx-auto w-full">
        <NoteDetailsClient
          initialNote={note}
          initialAverageRating={averageRating}
          initialRatingCount={res.data.ratingCount}
          initialRelatedNotes={relatedNotes}
          initialIsBookmarked={initialIsBookmarked as boolean}
          initialUserRating={initialUserRating}
        />
      </main>
      <Footer />
    </div>
  );
}
