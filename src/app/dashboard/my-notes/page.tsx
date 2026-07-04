"use client";

import { useState } from "react";
import { FileText, CheckCircle2, Clock, AlertCircle, Trash2, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Note {
  id: string;
  title: string;
  description: string;
  semester: number;
  size: string;
  status: "approved" | "pending" | "rejected";
  downloads: number;
}

const initialNotes: Note[] = [
  {
    id: "note-1",
    title: "Compiler Design Handouts",
    description: "Complete compiler construction lectures on lexing and parsing.",
    semester: 5,
    size: "4.5 MB",
    status: "approved",
    downloads: 142
  },
  {
    id: "note-2",
    title: "DBMS Midterm Review Sheets",
    description: "SQL joins, indexing, Normalization theory review.",
    semester: 4,
    size: "2.1 MB",
    status: "pending",
    downloads: 0
  },
  {
    id: "note-3",
    title: "Physics II Lab Manuals",
    description: "Electromagnetism experiments details and lab report format.",
    semester: 2,
    size: "8.9 MB",
    status: "rejected",
    downloads: 0
  }
];

export default function MyNotesPage() {
  const [notes, setNotes] = useState(initialNotes);

  const handleDelete = (id: string) => {
    setNotes(notes.filter(note => note.id !== id));
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent">
          My Uploaded Notes
        </h1>
        <p className="text-zinc-400 text-sm">
          Track and manage your uploaded course materials and check their status.
        </p>
      </div>

      <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl">
        <CardHeader className="pb-3 border-b border-zinc-800/40">
          <CardTitle className="text-sm font-bold text-zinc-200">Uploaded Materials</CardTitle>
          <CardDescription className="text-xs text-zinc-500">
            Pending files will be published after review.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-zinc-800/40">
          {notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-500 gap-3">
              <FileText className="h-10 w-10 text-zinc-600 animate-pulse" />
              <p className="text-sm">You haven't uploaded any study materials yet.</p>
            </div>
          ) : (
            notes.map((note) => (
              <div 
                key={note.id} 
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 hover:bg-zinc-900/10 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center shrink-0 border border-indigo-500/15">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-155">{note.title}</h4>
                    <p className="text-xs text-zinc-450 leading-relaxed mt-0.5 max-w-md line-clamp-1">
                      {note.description}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-semibold mt-1.5">
                      <span>Semester {note.semester}</span>
                      <span>&bull;</span>
                      <span>{note.size}</span>
                      {note.status === "approved" && (
                        <>
                          <span>&bull;</span>
                          <span className="text-indigo-400 font-bold">{note.downloads} downloads</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4.5">
                  {note.status === "approved" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-[9px] text-emerald-400 font-bold uppercase tracking-wider">
                      <CheckCircle2 className="h-3 w-3" /> Approved
                    </span>
                  )}
                  {note.status === "pending" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/25 bg-amber-500/10 text-[9px] text-amber-400 font-bold uppercase tracking-wider">
                      <Clock className="h-3 w-3 animate-spin" /> Pending Review
                    </span>
                  )}
                  {note.status === "rejected" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-red-500/25 bg-red-500/10 text-[9px] text-red-400 font-bold uppercase tracking-wider">
                      <AlertCircle className="h-3 w-3" /> Rejected
                    </span>
                  )}
                  
                  <Button 
                    onClick={() => handleDelete(note.id)}
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
