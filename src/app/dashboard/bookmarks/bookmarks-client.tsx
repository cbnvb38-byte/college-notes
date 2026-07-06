"use client";

import { useState } from "react";
import { Bookmark, FileText, ExternalLink, Download, ArrowDownToLine, Loader2, Calendar, GraduationCap, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { removeBookmark } from "@/app/actions/bookmarks";
import { logDownloadAction } from "@/app/actions/notes";
import { toast } from "sonner";

interface BookmarkRow {
  id: string;
  note_id: string;
  notes: {
    id: string;
    title: string;
    description: string | null;
    semester: number;
    status: string;
    downloads_count: number;
    view_count: number;
    bookmarks_count: number;
    file_url: string;
    file_size: number;
    created_at: string;
    college: string | null;
    professor: string | null;
    profiles: {
      name: string | null;
    } | null;
    subjects: {
      name: string;
      branches: {
        code: string;
      } | null;
    } | null;
  } | null;
}

export default function BookmarksClient({ initialBookmarks }: { initialBookmarks: BookmarkRow[] }) {
  const [bookmarks, setBookmarks] = useState<BookmarkRow[]>(initialBookmarks);
  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({});
  const [downloadingNotes, setDownloadingNotes] = useState<Record<string, boolean>>({});

  const handleRemoveBookmark = async (noteId: string) => {
    try {
      setLoadingIds(prev => ({ ...prev, [noteId]: true }));
      // Optimistic update
      const prevBookmarks = [...bookmarks];
      setBookmarks(bookmarks.filter(b => b.note_id !== noteId));
      
      const res = await removeBookmark(noteId);
      
      if (!res.success) {
        // Revert
        setBookmarks(prevBookmarks);
        toast.error("Failed to remove bookmark");
      } else {
        toast.success("Bookmark removed");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoadingIds(prev => ({ ...prev, [noteId]: false }));
    }
  };

  const handleDownload = async (noteId: string, noteTitle: string) => {
    try {
      setDownloadingNotes((prev) => ({ ...prev, [noteId]: true }));
      const res = await logDownloadAction(noteId);

      if (res.success && "data" in res && res.data) {
        const fileUrl = res.data.fileUrl;
        
        // Trigger browser download
        const link = document.createElement("a");
        link.href = fileUrl;
        link.setAttribute("download", `${noteTitle.replace(/\s+/g, "_")}.pdf`);
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Update local downloads counter state
        setBookmarks((prevBookmarks) =>
          prevBookmarks.map((b) =>
            b.note_id === noteId && b.notes 
              ? { ...b, notes: { ...b.notes, downloads_count: b.notes.downloads_count + 1 } } 
              : b
          )
        );
      } else {
        const errObj = "error" in res ? res.error : null;
        toast.error(errObj?.message || "Failed to log download.");
      }
    } catch (err: any) {
      toast.error("Unable to download note at this time.");
    } finally {
      setDownloadingNotes((prev) => ({ ...prev, [noteId]: false }));
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent">
          My Bookmarks
        </h1>
        <p className="text-zinc-400 text-sm">
          Access study materials you have bookmarked for quick learning.
        </p>
      </div>

      {bookmarks.length === 0 ? (
        <Card className="bg-zinc-900/15 border-zinc-800/50 flex-grow shadow-inner py-16 text-center">
          <CardContent className="flex flex-col items-center justify-center text-zinc-500 gap-4">
            <Bookmark className="h-10 w-10 text-zinc-650" />
            <div>
              <h3 className="font-bold text-zinc-200">No bookmarks yet</h3>
              <p className="text-sm mt-1">Save approved notes to find them quickly later.</p>
            </div>
            <Link href="/dashboard/browse" className="mt-2">
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/10">
                Browse Notes
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-6">
          {bookmarks.map((fav) => {
            const note = fav.notes;
            if (!note) return null;
            return (
              <Card 
                key={fav.id}
                className="border border-zinc-800/60 bg-zinc-900/35 hover:bg-zinc-900/50 p-5 rounded-2xl flex flex-col justify-between gap-5 transition-all duration-200"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                      {note.subjects?.branches?.code || "Branch"} &bull; Sem {note.semester}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveBookmark(note.id);
                      }}
                      disabled={loadingIds[note.id]}
                      className="text-pink-500 hover:text-zinc-500 transition-colors disabled:opacity-50"
                      title="Remove Bookmark"
                    >
                      {loadingIds[note.id] ? (
                        <Loader2 className="h-4.5 w-4.5 animate-spin text-zinc-500" />
                      ) : (
                        <Bookmark className="h-4.5 w-4.5 fill-pink-500" />
                      )}
                    </button>
                  </div>
                  <h4 className="font-bold text-sm text-zinc-100 mt-3">{note.title}</h4>
                  {note.description && (
                    <p className="text-zinc-500 text-xs leading-relaxed mt-1.5 line-clamp-2">
                      {note.description}
                    </p>
                  )}
                  <p className="text-[10px] text-zinc-500 truncate mt-2 font-semibold">
                    {note.subjects?.name || "Unknown Subject"}
                  </p>
                  <div className="flex items-center gap-1.5 min-w-0 mt-3 text-[11px] text-zinc-400">
                    <User className="h-3 w-3 text-zinc-500 shrink-0" />
                    <span className="truncate">
                      Uploader: {note.profiles?.name || "Anonymous"}
                    </span>
                  </div>

                  {(note.college || note.professor) && (
                    <div className="flex items-center gap-1.5 min-w-0 mt-1 text-[11px] text-zinc-400">
                      <GraduationCap className="h-3 w-3 text-zinc-500 shrink-0" />
                      <span className="truncate">
                        {note.college} {note.college && note.professor ? "•" : ""} {note.professor ? `Prof: ${note.professor}` : ""}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-3 pt-3 border-t border-zinc-800/50">
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                    <span>{note.downloads_count} downloads</span>
                    <span>{note.view_count} views</span>
                    <span>{note.bookmarks_count} bookmarks</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <Button 
                      variant="outline" 
                      onClick={() => handleDownload(note.id, note.title)}
                      disabled={downloadingNotes[note.id]}
                      className="border-zinc-800 text-zinc-300 hover:bg-zinc-800/30 text-xs py-3 rounded-xl gap-1.5 font-bold h-9"
                    >
                      {downloadingNotes[note.id] ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ArrowDownToLine className="h-3.5 w-3.5" />
                      )}
                      Download
                    </Button>
                    <Link href={`/notes/${note.id}`} className="w-full">
                      <Button 
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-3 rounded-xl gap-1.5 font-bold h-9 shadow-lg shadow-indigo-500/10"
                      >
                        Open View <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
