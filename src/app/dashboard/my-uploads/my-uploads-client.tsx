"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Trash2, 
  Eye, 
  Edit, 
  Download, 
  Bookmark, 
  Calendar,
  Clock,
  Loader2,
  FileWarning
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { deleteNoteAction } from "@/app/actions/notes";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Note {
  id: string;
  title: string;
  semester: number;
  status: "draft" | "pending_review" | "approved" | "rejected" | "removed";
  rejection_reason: string | null;
  created_at: string;
  downloads_count: number;
  view_count: number;
  bookmarks_count: number;
  file_url: string;
  subjects?: {
    name: string;
    branches?: {
      name: string;
    } | null;
  } | null;
}

export default function MyUploadsClient({ initialNotes }: { initialNotes: Note[] }) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleDelete = async (noteId: string) => {
    if (!window.confirm("Are you sure you want to delete this note? This action cannot be undone.")) return;

    setDeletingId(noteId);
    setErrorMsg("");

    try {
      const res = await deleteNoteAction(noteId);
      if (res.success) {
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
      } else {
        throw new Error((res as any).error?.message || "Failed to delete note.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while deleting.");
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">Approved</span>;
      case "pending_review":
        return <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">Pending Review</span>;
      case "rejected":
        return <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold bg-red-500/10 text-red-400 border border-red-500/20 rounded-full">Rejected</span>;
      case "removed":
        return <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold bg-zinc-700/30 text-zinc-400 border border-zinc-600/20 rounded-full">Removed</span>;
      default:
        return <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-full">{status}</span>;
    }
  };

  if (notes.length === 0) {
    return (
      <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-md">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="bg-zinc-900 p-4 rounded-full border border-zinc-800">
            <FileText className="h-8 w-8 text-zinc-600" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-lg text-zinc-200">No Uploads Yet</h3>
            <p className="text-sm text-zinc-500 max-w-sm mx-auto">
              You haven't contributed any study materials yet. Start by uploading your first note.
            </p>
          </div>
          <Link href="/dashboard/upload">
            <Button className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/10">
              Upload New Note
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 text-sm font-semibold">
          <FileWarning className="h-5 w-5 shrink-0" />
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence>
          {notes.map((note) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              layout
            >
              <Card className="bg-zinc-900/40 border-zinc-800/60 backdrop-blur-sm shadow-xl overflow-hidden hover:border-indigo-500/30 transition-colors group h-full flex flex-col">
                <CardContent className="p-0 flex flex-col h-full">
                  
                  {/* Top Section */}
                  <div className="p-5 flex-1 flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="bg-red-500/10 p-3 rounded-xl border border-red-500/20 text-red-400 shrink-0">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-zinc-100 text-base leading-snug truncate" title={note.title}>
                          {note.title}
                        </h3>
                        <p className="text-xs text-zinc-500 mt-1 truncate">
                          {note.subjects?.branches?.name || "Unknown Branch"}
                        </p>
                      </div>
                    </div>

                    {/* Rejection Reason (if rejected) */}
                    {note.status === "rejected" && note.rejection_reason && (
                      <div className="bg-red-500/5 border border-red-500/15 rounded-lg p-3 text-xs text-red-400 mt-2 flex flex-col gap-1">
                        <span className="font-bold text-[10px] uppercase tracking-wider">Rejection Reason</span>
                        <span className="font-medium">{note.rejection_reason}</span>
                      </div>
                    )}

                    {/* View Action - Removed Notes */}
                    {note.status === "removed" && (
                      <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-lg p-3 text-xs text-zinc-400 mt-2 flex flex-col gap-1">
                        <span className="font-medium text-center">This note was removed by a moderator.</span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {getStatusBadge(note.status)}
                      <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
                        Sem {note.semester}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-zinc-800/50">
                      <div className="flex items-center text-xs text-zinc-400 gap-2 truncate">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="truncate">{note.subjects?.name || "Unknown Subject"}</span>
                      </div>
                      <div className="flex items-center text-xs text-zinc-500 gap-2">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{new Date(note.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats Section */}
                  <div className="bg-zinc-950/50 px-5 py-3 border-y border-zinc-800/50 grid grid-cols-3 gap-2 divide-x divide-zinc-800/50 text-center">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-zinc-200">{note.downloads_count}</span>
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500">Dls</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-zinc-200">{note.view_count}</span>
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500">Views</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-zinc-200">{note.bookmarks_count}</span>
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500">Saves</span>
                    </div>
                  </div>

                  {/* Actions Section */}
                  <div className="p-3 bg-zinc-900/60 flex items-center justify-between gap-2">
                    <div className="flex gap-2">
                      <Link 
                        href={`/notes/${note.id}`}
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "sm" }),
                          "h-8 text-xs text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 inline-flex items-center"
                        )}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1.5" /> View
                      </Link>
                      <Button variant="ghost" size="sm" disabled className="h-8 text-xs text-zinc-600">
                        <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit
                      </Button>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDelete(note.id)}
                      disabled={deletingId === note.id}
                      className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                    >
                      {deletingId === note.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
