"use client";

import { useState } from "react";
import { Search, FileText, Bookmark, ArrowDownToLine, Star, Sparkles, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Note {
  id: string;
  title: string;
  description: string;
  branch: string;
  semester: number;
  downloads: number;
  rating: number;
}

const mockNotes: Note[] = [
  {
    id: "note-1",
    title: "Compiler Design Handouts",
    description: "Complete compiler construction lectures on lexing, LL/LR parsing, semantic analysis, and code generation.",
    branch: "cs",
    semester: 5,
    downloads: 142,
    rating: 4.8
  },
  {
    id: "note-4",
    title: "Introduction to Calculus III",
    description: "Multivariable integration, Green's and Stokes' theorems, and vector fields comprehensive guides.",
    branch: "basic",
    semester: 3,
    downloads: 320,
    rating: 4.9
  },
  {
    id: "note-5",
    title: "Signals and Systems Exam Sheets",
    description: "Fourier transform, Laplace transform, Z-transform cheatsheets, and solved midterm problems.",
    branch: "ee",
    semester: 4,
    downloads: 87,
    rating: 4.5
  },
  {
    id: "note-6",
    title: "Fluid Mechanics Lab Guides",
    description: "Bernoulli's equation experiments, venturimeter calibrations, and complete lab report templates.",
    branch: "me",
    semester: 3,
    downloads: 64,
    rating: 4.2
  }
];

export default function BrowseNotesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [favorites, setFavorites] = useState<string[]>(["note-4"]);

  const toggleFavorite = (id: string) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter(favId => favId !== id));
    } else {
      setFavorites([...favorites, id]);
    }
  };

  const filteredNotes = mockNotes.filter((note) => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          note.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBranch = selectedBranch === "all" || note.branch === selectedBranch;
    const matchesSemester = selectedSemester === "all" || String(note.semester) === selectedSemester;
    return matchesSearch && matchesBranch && matchesSemester;
  });

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent flex items-center gap-2">
          Notes Library <Sparkles className="h-5 w-5 text-indigo-400" />
        </h1>
        <p className="text-zinc-400 text-sm">
          Browse verified academic guides, study handouts, and lecture notes.
        </p>
      </div>

      {/* Filter panel */}
      <div className="grid sm:grid-cols-4 gap-4 items-center bg-zinc-900/10 border border-zinc-800/40 p-4.5 rounded-2xl">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search note titles or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-zinc-900/50 border-zinc-800 focus:border-indigo-500/50 focus:ring-indigo-500/10 text-zinc-200 rounded-xl"
          />
        </div>
        
        <div>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full bg-zinc-900/50 border border-zinc-800 text-xs rounded-xl h-10 px-3 text-zinc-300 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none cursor-pointer"
          >
            <option value="all">All Branches</option>
            <option value="cs">Computer Science</option>
            <option value="ee">Electrical</option>
            <option value="me">Mechanical</option>
            <option value="basic">Basic Sciences</option>
          </select>
        </div>

        <div>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="w-full bg-zinc-900/50 border border-zinc-800 text-xs rounded-xl h-10 px-3 text-zinc-300 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none cursor-pointer"
          >
            <option value="all">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
              <option key={sem} value={String(sem)}>Semester {sem}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Note list */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-16 text-zinc-500 text-sm">
          No study notes found matching your filters.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-6">
          {filteredNotes.map((note) => {
            const isBookmarked = favorites.includes(note.id);
            return (
              <Card 
                key={note.id}
                className="border border-zinc-800/60 bg-zinc-900/35 hover:bg-zinc-900/50 p-5 rounded-2xl flex flex-col justify-between gap-5 transition-all duration-200"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 px-2.5 py-0.5 rounded-lg font-bold uppercase tracking-wider">
                      {note.branch.toUpperCase()} &bull; Semester {note.semester}
                    </span>
                    <button 
                      onClick={() => toggleFavorite(note.id)}
                      className={`transition-colors duration-200 ${
                        isBookmarked ? "text-pink-500" : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      <Bookmark className={`h-4.5 w-4.5 ${isBookmarked ? "fill-pink-500" : ""}`} />
                    </button>
                  </div>
                  <h4 className="font-bold text-sm text-zinc-100 mt-3">{note.title}</h4>
                  <p className="text-zinc-500 text-xs leading-relaxed mt-1.5 line-clamp-2">
                    {note.description}
                  </p>
                </div>
                
                <div className="flex flex-col gap-3 pt-3 border-t border-zinc-800/50">
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-semibold">
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                      {note.rating}
                    </span>
                    <span>{note.downloads} downloads</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <Button 
                      variant="outline" 
                      className="border-zinc-800 text-zinc-300 hover:bg-zinc-800/30 text-xs py-3 rounded-xl gap-1.5 font-bold h-9"
                    >
                      <ArrowDownToLine className="h-3.5 w-3.5" /> Download
                    </Button>
                    <Button 
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-3 rounded-xl gap-1.5 font-bold h-9 shadow-lg shadow-indigo-500/10"
                    >
                      Open View <FileText className="h-3.5 w-3.5" />
                    </Button>
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
