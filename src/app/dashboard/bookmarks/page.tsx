"use client";

import { useState } from "react";
import { Bookmark, FileText, ExternalLink, ArrowDownToLine, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface BookmarkedNote {
  id: string;
  title: string;
  description: string;
  semester: number;
  downloads: number;
}

const initialBookmarks: BookmarkedNote[] = [
  {
    id: "note-4",
    title: "Introduction to Calculus III",
    description: "Multivariable integration, Green's theorem, and vector fields study guide.",
    semester: 3,
    downloads: 320
  }
];

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState(initialBookmarks);

  const removeBookmark = (id: string) => {
    setBookmarks(bookmarks.filter(b => b.id !== id));
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
          <CardContent className="flex flex-col items-center justify-center text-zinc-500 gap-3">
            <Bookmark className="h-10 w-10 text-zinc-650" />
            <p className="text-sm">You haven't bookmarked any notes yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-6">
          {bookmarks.map((fav) => (
            <Card 
              key={fav.id}
              className="border border-zinc-800/60 bg-zinc-900/35 hover:bg-zinc-900/50 p-5 rounded-2xl flex flex-col justify-between gap-5 transition-all duration-200"
            >
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                    PDF Document
                  </span>
                  <button 
                    onClick={() => removeBookmark(fav.id)}
                    className="text-pink-500 hover:text-zinc-500 transition-colors"
                  >
                    <Bookmark className="h-4.5 w-4.5 fill-pink-500" />
                  </button>
                </div>
                <h4 className="font-bold text-sm text-zinc-100 mt-3">{fav.title}</h4>
                <p className="text-zinc-500 text-xs leading-relaxed mt-1.5 line-clamp-2">
                  {fav.description}
                </p>
              </div>
              
              <div className="flex flex-col gap-3 pt-3 border-t border-zinc-800/50">
                <div className="flex items-center justify-between text-[10px] text-zinc-500 font-semibold">
                  <span>Semester {fav.semester}</span>
                  <span>{fav.downloads} downloads</span>
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
                    Open View <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
