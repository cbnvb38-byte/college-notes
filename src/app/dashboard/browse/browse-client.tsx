"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  FileText,
  Bookmark,
  Eye,
  Download,
  Calendar,
  User,
  GraduationCap,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileWarning,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSupabase } from "@/hooks/useSupabase";
import { browseNotesAction, logDownloadAction } from "@/app/actions/notes";
import { addBookmark, removeBookmark } from "@/app/actions/bookmarks";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Branch {
  id: string;
  name: string;
  code: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  branch_id: string;
  semester: number;
}

interface NoteRow {
  id: string;
  title: string;
  description: string | null;
  semester: number;
  college: string | null;
  professor: string | null;
  downloads_count: number;
  bookmarks_count: number;
  view_count: number;
  created_at: string;
  file_url: string;
  profiles: {
    name: string | null;
  } | null;
  subjects: {
    id: string;
    name: string;
    code: string;
    branches: {
      id: string;
      name: string;
      code: string;
    } | null;
  } | null;
}

export default function BrowseNotesClient({
  initialBranches,
  initialBookmarkedIds = [],
}: {
  initialBranches: Branch[];
  initialBookmarkedIds?: string[];
}) {
  const supabase = useSupabase();

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedSemester, setSelectedSemester] = useState("0"); // "0" representing "all"
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "downloads" | "views">("newest");

  // Dynamic Subjects List (based on branch/semester selection)
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);

  // Pagination & Loading States
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [downloadingNotes, setDownloadingNotes] = useState<Record<string, boolean>>({});
  
  // Bookmarks State
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set(initialBookmarkedIds));
  const [bookmarkingIds, setBookmarkingIds] = useState<Record<string, boolean>>({});

  const handleToggleBookmark = async (noteId: string) => {
    if (bookmarkingIds[noteId]) return; // Guard against rapid clicks

    try {
      setBookmarkingIds((prev) => ({ ...prev, [noteId]: true }));
      const isCurrentlyBookmarked = bookmarkedIds.has(noteId);
      
      // Optimistic UI Update
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlyBookmarked) next.delete(noteId);
        else next.add(noteId);
        return next;
      });
      setNotes((prevNotes) =>
        prevNotes.map((n) =>
          n.id === noteId
            ? { ...n, bookmarks_count: n.bookmarks_count + (isCurrentlyBookmarked ? -1 : 1) }
            : n
        )
      );

      const res = isCurrentlyBookmarked 
        ? await removeBookmark(noteId)
        : await addBookmark(noteId);

      if (!res.success) {
        // Revert Optimistic Update
        setBookmarkedIds((prev) => {
          const next = new Set(prev);
          if (isCurrentlyBookmarked) next.add(noteId);
          else next.delete(noteId);
          return next;
        });
        setNotes((prevNotes) =>
          prevNotes.map((n) =>
            n.id === noteId
              ? { ...n, bookmarks_count: n.bookmarks_count + (isCurrentlyBookmarked ? 1 : -1) }
              : n
          )
        );
        toast.error(`Failed to ${isCurrentlyBookmarked ? "remove" : "add"} bookmark.`);
      } else {
        toast.success(isCurrentlyBookmarked ? "Bookmark removed" : "Bookmark added");
      }
    } catch (err) {
      toast.error("An error occurred while bookmarking.");
    } finally {
      setBookmarkingIds((prev) => ({ ...prev, [noteId]: false }));
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

        // Update local notes counter state
        setNotes((prevNotes) =>
          prevNotes.map((n) =>
            n.id === noteId ? { ...n, downloads_count: n.downloads_count + 1 } : n
          )
        );
      } else {
        const errObj = "error" in res ? res.error : null;
        alert(errObj?.message || "Failed to log download.");
      }
    } catch (err: any) {
      console.error("[Download Error]:", err);
      alert("Unable to download note at this time.");
    } finally {
      setDownloadingNotes((prev) => ({ ...prev, [noteId]: false }));
    }
  };

  // Ref for debouncing search input
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Limit of items per page
  const itemsPerPage = 8;

  // Load subjects dynamically when Branch or Semester filters change
  useEffect(() => {
    async function loadSubjects() {
      // If branch is "all", we don't fetch subjects since the dropdown is disabled/not applicable
      if (selectedBranch === "all") {
        setSubjects([]);
        setSelectedSubject("all");
        return;
      }

      try {
        setIsLoadingSubjects(true);
        let query = supabase
          .from("subjects")
          .select("*")
          .eq("branch_id", selectedBranch)
          .order("name", { ascending: true });

        // Optionally filter by semester if a specific one is selected
        if (selectedSemester !== "0") {
          query = query.eq("semester", parseInt(selectedSemester, 10));
        }

        const { data, error } = await query;

        if (error) {
          console.error("[Client Operations Failure - loadSubjects]:", error);
          return;
        }

        if (data) {
          setSubjects(data);
          // If selectedSubject isn't in the new list, reset it to "all"
          if (!data.some((s) => s.id === selectedSubject)) {
            setSelectedSubject("all");
          }
        }
      } catch (err) {
        console.error("Unexpected error loading subjects:", err);
      } finally {
        setIsLoadingSubjects(false);
      }
    }

    loadSubjects();
  }, [selectedBranch, selectedSemester, supabase]);

  // Main Notes Fetcher
  const fetchNotes = async (search: string, branch: string, sem: string, sub: string, sort: "newest" | "downloads" | "views", currentPage: number) => {
    try {
      setIsLoadingNotes(true);
      setErrorMsg("");

      const res = await browseNotesAction({
        search: search || undefined,
        branchId: branch !== "all" ? branch : undefined,
        semester: sem !== "0" ? parseInt(sem, 10) : undefined,
        subjectId: sub !== "all" ? sub : undefined,
        sortBy: sort,
        page: currentPage,
        limit: itemsPerPage,
      });

      if ("data" in res && res.data) {
        setNotes(res.data.notes as NoteRow[]);
        setTotalCount(res.data.totalCount);
        setTotalPages(res.data.totalPages);
      } else if ("error" in res && res.error) {
        throw new Error(res.error.message || "Failed to fetch study notes.");
      } else {
        throw new Error("Failed to fetch study notes.");
      }
    } catch (err: any) {
      console.error("[Browse Notes Error]:", err);
      setErrorMsg(err.message || "An unexpected error occurred while loading notes.");
    } finally {
      setIsLoadingNotes(false);
    }
  };

  // Fetch when filters, sorting, or page changes
  useEffect(() => {
    // Immediate fetch for non-search triggers
    fetchNotes(searchQuery, selectedBranch, selectedSemester, selectedSubject, sortBy, page);
  }, [selectedBranch, selectedSemester, selectedSubject, sortBy, page]);

  // Debounced search trigger
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setPage(1); // Reset to first page on search

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      fetchNotes(value, selectedBranch, selectedSemester, selectedSubject, sortBy, 1);
    }, 450);
  };

  // Handle page resets when filters change
  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBranch(e.target.value);
    setPage(1);
  };

  const handleSemesterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSemester(e.target.value);
    setPage(1);
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSubject(e.target.value);
    setPage(1);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as "newest" | "downloads" | "views");
    setPage(1);
  };

  // Clean up debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const handleClearSearch = () => {
    setSearchQuery("");
    setPage(1);
    fetchNotes("", selectedBranch, selectedSemester, selectedSubject, sortBy, 1);
  };

  const handleResetFilters = () => {
    setSelectedBranch("all");
    setSelectedSemester("0");
    setSelectedSubject("all");
    setSortBy("newest");
    setPage(1);
    fetchNotes(searchQuery, "all", "0", "all", "newest", 1);
  };

  return (
    <div className="flex flex-col gap-6">
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 text-sm font-semibold">
          <FileWarning className="h-5 w-5 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Advanced Filter panel */}
      <div className="flex flex-col gap-4 bg-zinc-900/15 border border-zinc-800/40 p-5 rounded-2xl backdrop-blur-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Box */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Search by title, topic, professor, or college..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 bg-zinc-900/60 border-zinc-800 focus:border-indigo-500/50 focus:ring-indigo-500/10 text-zinc-200 rounded-xl h-11"
            />
          </div>

          {/* Sort By Dropdown */}
          <div>
            <select
              value={sortBy}
              onChange={handleSortChange}
              className="w-full bg-zinc-900/60 border border-zinc-800 text-xs rounded-xl h-11 px-3 text-zinc-300 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none cursor-pointer"
            >
              <option value="newest">Sort by: Newest Uploads</option>
              <option value="downloads">Sort by: Most Downloaded</option>
              <option value="views">Sort by: Most Viewed</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Branch Dropdown */}
          <div>
            <select
              value={selectedBranch}
              onChange={handleBranchChange}
              className="w-full bg-zinc-900/60 border border-zinc-800 text-xs rounded-xl h-11 px-3 text-zinc-300 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none cursor-pointer"
            >
              <option value="all">All Engineering Branches</option>
              {initialBranches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} ({branch.code})
                </option>
              ))}
            </select>
          </div>

          {/* Semester Dropdown */}
          <div>
            <select
              value={selectedSemester}
              onChange={handleSemesterChange}
              className="w-full bg-zinc-900/60 border border-zinc-800 text-xs rounded-xl h-11 px-3 text-zinc-300 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none cursor-pointer"
            >
              <option value="0">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={String(sem)}>
                  Semester {sem}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Dropdown (Dynamic based on selected branch) */}
          <div>
            <select
              value={selectedSubject}
              onChange={handleSubjectChange}
              disabled={selectedBranch === "all" || isLoadingSubjects}
              className="w-full bg-zinc-900/60 border border-zinc-800 text-xs rounded-xl h-11 px-3 text-zinc-300 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {selectedBranch === "all" ? (
                <option value="all">Select a branch first to filter subjects</option>
              ) : isLoadingSubjects ? (
                <option value="all">Loading subjects...</option>
              ) : subjects.length === 0 ? (
                <option value="all">No subjects found for this selection</option>
              ) : (
                <>
                  <option value="all">All Subjects</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code})
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Results Header */}
      {!isLoadingNotes && (
        <div className="flex items-center justify-between text-xs text-zinc-500 px-1 font-semibold">
          <span>Found {totalCount} matching note{totalCount !== 1 ? "s" : ""}</span>
          {totalPages > 1 && (
            <span>
              Page {page} of {totalPages}
            </span>
          )}
        </div>
      )}

      {/* Note list or Skeletons */}
      {isLoadingNotes ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
          {[...Array(4)].map((_, i) => (
            <Card
              key={i}
              className="border border-zinc-800/40 bg-zinc-900/10 p-5 rounded-2xl animate-pulse h-60 flex flex-col justify-between"
            >
              <div className="flex flex-col gap-3">
                <div className="h-4 bg-zinc-800 rounded w-1/4" />
                <div className="h-5 bg-zinc-800 rounded w-3/4 mt-2" />
                <div className="h-3 bg-zinc-800 rounded w-full mt-2" />
                <div className="h-3 bg-zinc-800 rounded w-5/6" />
              </div>
              <div className="h-8 bg-zinc-800 rounded w-full mt-4" />
            </Card>
          ))}
        </div>
      ) : notes.length === 0 ? (
        <Card className="bg-zinc-900/20 border-zinc-800/50 backdrop-blur-md">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center gap-5">
            <div className="bg-zinc-900/60 p-4 rounded-full border border-zinc-800/50 shadow-md">
              <Search className="h-8 w-8 text-zinc-500" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="font-bold text-xl text-zinc-200">Not in our library... yet.</h3>
              <p className="text-sm text-zinc-500 max-w-sm mx-auto">
                We couldn’t find any notes matching your search or selected filters.
              </p>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <Button 
                variant="outline" 
                onClick={handleClearSearch}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 rounded-xl px-5"
              >
                Clear Search
              </Button>
              <Button 
                onClick={handleResetFilters}
                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/10 px-5"
              >
                Reset Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {notes.map((note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                layout
              >
                <Card className="border border-zinc-800/60 bg-zinc-900/35 hover:bg-zinc-900/50 hover:border-indigo-500/25 p-5 rounded-2xl flex flex-col justify-between h-full transition-all duration-200 shadow-xl group">
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 px-2.5 py-0.5 rounded-lg font-bold uppercase tracking-wider">
                        {note.subjects?.branches?.code || "Branch"} &bull; Sem {note.semester}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-semibold flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(note.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="font-bold text-zinc-100 text-base leading-snug line-clamp-1 group-hover:text-indigo-400 transition-colors duration-200">
                      {note.title}
                    </h4>

                    {note.description && (
                      <p className="text-zinc-500 text-xs leading-relaxed line-clamp-2">
                        {note.description}
                      </p>
                    )}

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-1 text-[11px] text-zinc-400 bg-zinc-950/30 p-3 rounded-xl border border-zinc-800/30">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <GraduationCap className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                        <span className="truncate">
                          {note.subjects?.name || "Subject"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <User className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                        <span className="truncate">
                          Uploader: {note.profiles?.name || "Anonymous"}
                        </span>
                      </div>
                      {note.college && (
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-zinc-500 shrink-0 font-bold">Inst:</span>
                          <span className="truncate">{note.college}</span>
                        </div>
                      )}
                      {note.professor && (
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-zinc-500 shrink-0 font-bold">Prof:</span>
                          <span className="truncate">{note.professor}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-3 mt-4 border-t border-zinc-800/50">
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-wider px-1">
                      <span>{note.downloads_count} downloads</span>
                      <span>{note.view_count} views</span>
                      <span>{note.bookmarks_count} bookmarks</span>
                    </div>

                     <div className="grid grid-cols-3 gap-2 mt-1">
                      <Button
                        variant="outline"
                        onClick={() => handleDownload(note.id, note.title)}
                        disabled={!!downloadingNotes[note.id]}
                        className="border-zinc-800 text-zinc-300 hover:bg-zinc-800/30 text-[10px] py-3 rounded-xl gap-1.5 font-bold h-9 px-1"
                      >
                        {downloadingNotes[note.id] ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Download className="h-3.5 w-3.5" />
                        )}
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleToggleBookmark(note.id);
                        }}
                        disabled={!!bookmarkingIds[note.id]}
                        className={`border-zinc-800 text-[10px] py-3 rounded-xl gap-1.5 font-bold h-9 px-1 transition-colors ${
                          bookmarkedIds.has(note.id) 
                            ? "bg-pink-500/10 text-pink-500 border-pink-500/20 hover:bg-pink-500/20" 
                            : "text-zinc-300 hover:bg-zinc-800/30"
                        }`}
                      >
                        {bookmarkingIds[note.id] ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Bookmark className={`h-3.5 w-3.5 ${bookmarkedIds.has(note.id) ? "fill-pink-500" : ""}`} />
                        )}
                        {bookmarkedIds.has(note.id) ? "Saved" : "Save"}
                      </Button>
                      <Link
                        href={`/notes/${note.id}`}
                        className={cn(
                          buttonVariants({ variant: "default", size: "sm" }),
                          "bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] py-3 rounded-xl gap-1.5 font-bold h-9 shadow-lg shadow-indigo-500/10 inline-flex items-center justify-center border border-transparent px-1"
                        )}
                      >
                        Open View <Eye className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && !isLoadingNotes && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
            className="border-zinc-800 text-zinc-300 hover:bg-zinc-800/30 h-9 px-3 rounded-xl font-bold gap-1 text-xs"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>

          <div className="flex items-center gap-1.5">
            {[...Array(totalPages)].map((_, i) => {
              const pageNumber = i + 1;
              const isCurrent = pageNumber === page;
              return (
                <Button
                  key={pageNumber}
                  variant={isCurrent ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(pageNumber)}
                  className={`h-9 w-9 rounded-xl font-bold text-xs ${
                    isCurrent
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                      : "border-zinc-800 text-zinc-300 hover:bg-zinc-800/30"
                  }`}
                >
                  {pageNumber}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages}
            className="border-zinc-800 text-zinc-300 hover:bg-zinc-800/30 h-9 px-3 rounded-xl font-bold gap-1 text-xs"
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
