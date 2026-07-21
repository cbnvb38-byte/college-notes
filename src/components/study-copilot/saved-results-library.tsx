"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { SavedGeneration } from "@/app/actions/copilot-history";
import { SavedSummaryCard } from "./saved-summary-card";
import { Search, Sparkles, SlidersHorizontal, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getGenerationTypeLabel, getResultPreview } from "@/lib/ai/result-formatting";

interface SavedResultsLibraryProps {
  savedData: SavedGeneration[];
}

type TabType = "all" | "summary" | "mcq" | "flashcards" | "doubt_answer" | "important_questions";
type SortOption = "newest" | "oldest" | "type";

export function SavedResultsLibrary({ savedData }: SavedResultsLibraryProps) {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [visibleCount, setVisibleCount] = useState(6);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // Close sort menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calculate counts for stats and tabs
  const counts = useMemo(() => {
    return {
      all: savedData.length,
      summary: savedData.filter((g) => g.generation_type === "summary").length,
      mcq: savedData.filter((g) => g.generation_type === "mcq").length,
      flashcards: savedData.filter((g) => g.generation_type === "flashcards").length,
      doubt_answer: savedData.filter((g) => g.generation_type === "doubt_answer").length,
      important_questions: savedData.filter((g) => g.generation_type === "important_questions").length,
    };
  }, [savedData]);

  const tabs = [
    { id: "all", label: "All", count: counts.all },
    { id: "summary", label: "Summaries", count: counts.summary },
    { id: "mcq", label: "Quizzes", count: counts.mcq },
    { id: "flashcards", label: "Flashcards", count: counts.flashcards },
    { id: "important_questions", label: "Important Questions", count: counts.important_questions },
    { id: "doubt_answer", label: "Doubts", count: counts.doubt_answer },
  ];

  const filteredAndSortedData = useMemo(() => {
    let result = [...savedData];

    // Filter by Tab
    if (activeTab !== "all") {
      result = result.filter((g) => g.generation_type === activeTab);
    }

    // Search
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter((g) => {
        const titleMatch = g.note_title?.toLowerCase().includes(q) || false;
        const typeLabel = getGenerationTypeLabel(g.generation_type).toLowerCase();
        const labelMatch = typeLabel.includes(q);
        const preview = getResultPreview(g).toLowerCase();
        const previewMatch = preview.includes(q);
        
        return titleMatch || labelMatch || previewMatch;
      });
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === "type") {
        return a.generation_type.localeCompare(b.generation_type);
      }
      return 0;
    });

    return result;
  }, [savedData, activeTab, searchQuery, sortBy]);

  const visibleData = filteredAndSortedData.slice(0, visibleCount);
  const hasMore = visibleCount < filteredAndSortedData.length;

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setVisibleCount(6);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setVisibleCount(6);
  };

  const handleSortChange = (sort: SortOption) => {
    setSortBy(sort);
    setVisibleCount(6);
    setIsSortOpen(false);
  };

  const renderEmptyState = () => {
    if (searchQuery.trim() !== "") {
      return (
        <div className="border border-dashed border-zinc-800/60 rounded-2xl py-12 flex flex-col items-center justify-center gap-3 text-center bg-zinc-900/20 mt-4 shadow-inner">
          <div className="bg-zinc-900 p-4 rounded-full border border-zinc-800/60 shadow-md">
            <Search className="h-6 w-6 text-zinc-500" />
          </div>
          <p className="text-sm font-bold text-zinc-300">No saved results match your search.</p>
        </div>
      );
    }

    let message = "No saved study materials yet.";
    let subMessage = "Generate a summary, quiz, flashcards, important questions, or doubt answer to build your library.";
    
    if (activeTab === "summary") {
      message = "No summaries saved yet.";
      subMessage = "Use Smart Summary on your notes to quickly revise key points.";
    } else if (activeTab === "mcq") {
      message = "No practice quizzes saved yet.";
      subMessage = "Generate MCQs from your notes to test your knowledge.";
    } else if (activeTab === "flashcards") {
      message = "No flashcards saved yet.";
      subMessage = "Turn your notes into flashcards for spaced repetition.";
    } else if (activeTab === "doubt_answer") {
      message = "No doubt answers saved yet.";
      subMessage = "Select text in a note and Ask Doubt to get answers.";
    } else if (activeTab === "important_questions") {
      message = "No important questions saved yet.";
      subMessage = "Generate exam-style questions to prepare for finals.";
    }

    return (
      <div className="border border-dashed border-zinc-800/60 rounded-2xl py-12 flex flex-col items-center justify-center gap-3 text-center bg-zinc-900/20 mt-4 shadow-inner px-4">
        <div className="bg-zinc-900 p-4 rounded-full border border-zinc-800/60 shadow-md">
          <Sparkles className="h-6 w-6 text-indigo-400" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-bold text-zinc-200">{message}</p>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">{subMessage}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      
      {/* Stats Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl">
          <span className="text-base sm:text-lg font-black text-indigo-400 leading-none">{counts.all}</span>
          <span className="text-[9px] sm:text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Saved</span>
        </div>
        <div className="flex items-center gap-1.5 bg-zinc-900/50 border border-zinc-800/80 px-3 py-1.5 rounded-xl">
          <span className="text-xs sm:text-sm font-bold text-zinc-300 leading-none">{counts.summary}</span>
          <span className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Summaries</span>
        </div>
        <div className="flex items-center gap-1.5 bg-zinc-900/50 border border-zinc-800/80 px-3 py-1.5 rounded-xl">
          <span className="text-xs sm:text-sm font-bold text-zinc-300 leading-none">{counts.mcq}</span>
          <span className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Quizzes</span>
        </div>
        <div className="flex items-center gap-1.5 bg-zinc-900/50 border border-zinc-800/80 px-3 py-1.5 rounded-xl">
          <span className="text-xs sm:text-sm font-bold text-zinc-300 leading-none">{counts.flashcards}</span>
          <span className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Flashcards</span>
        </div>
        <div className="flex items-center gap-1.5 bg-zinc-900/50 border border-zinc-800/80 px-3 py-1.5 rounded-xl">
          <span className="text-xs sm:text-sm font-bold text-zinc-300 leading-none">{counts.important_questions}</span>
          <span className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Important Q's</span>
        </div>
        <div className="flex items-center gap-1.5 bg-zinc-900/50 border border-zinc-800/80 px-3 py-1.5 rounded-xl">
          <span className="text-xs sm:text-sm font-bold text-zinc-300 leading-none">{counts.doubt_answer}</span>
          <span className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Doubts</span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-zinc-900/30 p-2.5 rounded-2xl border border-zinc-800/60 backdrop-blur-md relative z-20">
        
        {/* Tabs */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as TabType)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                  isActive
                    ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                    : "bg-zinc-900/50 text-zinc-400 border-zinc-800/60 hover:bg-zinc-800 hover:text-zinc-200 hover:border-zinc-700"
                }`}
              >
                {tab.label}
                <span className={`text-[9px] px-1.5 py-0.5 rounded-md ${isActive ? 'bg-indigo-500/20 text-indigo-300' : 'bg-zinc-800 text-zinc-500'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Sort */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search saved results..."
              className="pl-9 bg-zinc-950 border-zinc-800/60 text-sm h-10 rounded-xl focus-visible:ring-indigo-500/50 w-full text-zinc-200"
            />
          </div>
          
          <div className="relative" ref={sortRef}>
            <Button
              variant="outline"
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="h-10 px-3 bg-zinc-950 border-zinc-800/60 text-zinc-300 hover:bg-zinc-900 rounded-xl gap-2 text-xs font-bold shrink-0"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {sortBy === "newest" ? "Newest" : sortBy === "oldest" ? "Oldest" : "Type"}
              </span>
            </Button>

            {isSortOpen && (
              <div className="absolute right-0 top-full mt-2 w-36 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50 py-1">
                <button
                  onClick={() => handleSortChange("newest")}
                  className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-zinc-800 transition-colors ${sortBy === "newest" ? "text-indigo-400" : "text-zinc-300"}`}
                >
                  Newest first
                </button>
                <button
                  onClick={() => handleSortChange("oldest")}
                  className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-zinc-800 transition-colors ${sortBy === "oldest" ? "text-indigo-400" : "text-zinc-300"}`}
                >
                  Oldest first
                </button>
                <button
                  onClick={() => handleSortChange("type")}
                  className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-zinc-800 transition-colors ${sortBy === "type" ? "text-indigo-400" : "text-zinc-300"}`}
                >
                  Type
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid of Results */}
      {filteredAndSortedData.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="flex flex-col gap-4">
          {visibleData.map((gen) => (
            <SavedSummaryCard key={gen.id} generation={gen} />
          ))}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center mt-6 mb-2">
          <Button
            variant="outline"
            onClick={() => setVisibleCount((prev) => prev + 6)}
            className="bg-zinc-900/50 border border-zinc-700/60 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 hover:border-zinc-600 rounded-xl px-8 h-10 text-xs font-bold transition-all shadow-lg"
          >
            Load More Results
          </Button>
        </div>
      )}
    </div>
  );
}
