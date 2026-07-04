"use client";

import { Download, FileText, ArrowDownToLine, Trash2, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DownloadItem {
  id: string;
  title: string;
  description: string;
  semester: number;
  size: string;
  downloadedAt: string;
}

const downloadedNotes: DownloadItem[] = [
  {
    id: "note-1",
    title: "Compiler Design Handouts",
    description: "Complete compiler construction lectures on lexing and parsing.",
    semester: 5,
    size: "4.5 MB",
    downloadedAt: "3 days ago"
  },
  {
    id: "note-4",
    title: "Introduction to Calculus III",
    description: "Multivariable integration and vector fields guide.",
    semester: 3,
    size: "3.2 MB",
    downloadedAt: "1 week ago"
  }
];

export default function DownloadsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent">
          My Downloads
        </h1>
        <p className="text-zinc-400 text-sm">
          Access documents you have downloaded previously to view offline.
        </p>
      </div>

      <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl">
        <CardHeader className="pb-3 border-b border-zinc-800/40">
          <CardTitle className="text-sm font-bold text-zinc-200">Download History</CardTitle>
          <CardDescription className="text-xs text-zinc-500">
            Re-download or view details of your previous items.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-zinc-800/40">
          {downloadedNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-500 gap-3">
              <Download className="h-10 w-10 text-zinc-600" />
              <p className="text-sm">You haven't downloaded any notes yet.</p>
            </div>
          ) : (
            downloadedNotes.map((note) => (
              <div 
                key={note.id} 
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 hover:bg-zinc-900/10 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center shrink-0 border border-indigo-500/15">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-150">{note.title}</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed mt-0.5 line-clamp-1 max-w-md">
                      {note.description}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-semibold mt-1.5">
                      <span>Semester {note.semester}</span>
                      <span>&bull;</span>
                      <span>{note.size}</span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1 text-emerald-400"><ShieldCheck className="h-3 w-3" /> Safe PDF</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    className="border-zinc-800 text-zinc-300 hover:bg-zinc-800/30 text-xs py-3.5 px-4 rounded-xl gap-2 font-semibold"
                  >
                    <ArrowDownToLine className="h-4 w-4" /> Download Again
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
