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

type TabType = "all" | "summary" | "mcq";
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

  const tabs = [
    { id: "all", label: "All" },
    { id: "summary", label: "Summaries" },
    { id: "mcq", label: "Quizzes" },
  ];

  const filteredAndSortedData = useMemo(() => {
    let result = [...savedData];

    // Filter by Tab
    if (activeTab === "summary") {
      result = result.filter((g) => g.generation_type === "summary");
    } else if (activeTab === "mcq") {
      result = result.filter((g) => g.generation_type === "mcq");
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
        <div className="border border-dashed border-zinc-800/60 rounded-2xl py-12 flex flex-col items-center gap-3 text-center bg-zinc-900/10 mt-4">
          <Search className="h-8 w-8 text-zinc-600 mb-2" />
          <p className="text-sm font-semibold text-zinc-400">No saved results match your search.</p>
        </div>
      );
    }

    let message = "No saved study materials yet.";
    if (activeTab === "summary") message = "No smart summaries saved yet.";
    else if (activeTab === "mcq") message = "No practice quizzes saved yet.";

    return (
      <div className="border border-dashed border-zinc-800/60 rounded-2xl py-12 flex flex-col items-center gap-3 text-center bg-zinc-900/10 mt-4">
        <Sparkles className="h-8 w-8 text-zinc-600 mb-2" />
        <p className="text-sm font-semibold text-zinc-400">{message}</p>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      
      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-zinc-900/30 p-2.5 rounded-2xl border border-zinc-800/60 backdrop-blur-md relative z-20">
        
        {/* Tabs */}
        <div className="flex items-center gap-1 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as TabType)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
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
        <div className="flex justify-center mt-2 mb-2">
          <Button
            variant="outline"
            onClick={() => setVisibleCount((prev) => prev + 6)}
            className="bg-zinc-900/50 border-zinc-700 text-zinc-200 hover:bg-zinc-800 hover:text-zinc-50 rounded-xl px-8 h-10 text-xs font-bold transition-all shadow-lg"
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
