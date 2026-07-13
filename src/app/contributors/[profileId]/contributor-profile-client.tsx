"use client";

import { 
  User, 
  GraduationCap, 
  FileText, 
  Download, 
  Eye, 
  Star, 
  Calendar,
  Sparkles,
  BookOpen
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

interface PublicProfile {
  id: string;
  name: string;
  avatar_url: string | null;
  college: string | null;
  branch: string | null;
  bio: string | null;
}

interface PublicStats {
  totalApprovedNotes: number;
  totalDownloads: number;
  totalViews: number;
  totalRatingsReceived: number;
  averageRating: number;
}

interface ApprovedNote {
  id: string;
  title: string;
  description: string | null;
  semester: number;
  downloads_count: number;
  view_count: number;
  bookmarks_count: number;
  average_rating: number;
  total_ratings: number;
  created_at: string;
  subject_name: string | null;
  branch_name: string | null;
}

export default function ContributorProfileClient({
  profile,
  stats,
  notes,
}: {
  profile: PublicProfile;
  stats: PublicStats;
  notes: ApprovedNote[];
}) {
  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto w-full">
      {/* Profile Info Header */}
      <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-md shadow-2xl overflow-hidden">
        <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
          {/* Avatar */}
          <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 p-0.5 shrink-0">
            {profile.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={`${profile.name} Avatar`} 
                className="h-full w-full rounded-full border border-zinc-950 object-cover" 
              />
            ) : (
              <div className="h-full w-full rounded-full bg-zinc-950 flex items-center justify-center font-bold text-3xl text-indigo-400 border border-zinc-900">
                {profile.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 flex flex-col gap-3 min-w-0">
            <div>
              <h1 className="text-2xl font-extrabold text-zinc-50 flex items-center justify-center md:justify-start gap-2">
                {profile.name}
                <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
              </h1>
              
              {/* College & Department */}
              {(profile.college || profile.branch) && (
                <p className="text-xs text-zinc-400 mt-1 flex flex-wrap items-center justify-center md:justify-start gap-1.5">
                  <GraduationCap className="h-4 w-4 text-zinc-500" />
                  {profile.college && <span>{profile.college}</span>}
                  {profile.college && profile.branch && <span className="text-zinc-650">&bull;</span>}
                  {profile.branch && <span>{profile.branch}</span>}
                </p>
              )}
            </div>

            {/* Bio */}
            {profile.bio ? (
              <p className="text-xs text-zinc-350 leading-relaxed max-w-2xl bg-zinc-950/40 p-3.5 border border-zinc-850 rounded-xl">
                &quot;{profile.bio}&quot;
              </p>
            ) : (
              <p className="text-[11px] text-zinc-600 italic">No bio shared by this contributor.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Aggregate Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Approved Notes", value: stats.totalApprovedNotes, icon: FileText, color: "text-blue-400", bg: "bg-blue-500/5 border-blue-500/15" },
          { label: "Total Views", value: stats.totalViews, icon: Eye, color: "text-indigo-400", bg: "bg-indigo-500/5 border-indigo-500/15" },
          { label: "Total Downloads", value: stats.totalDownloads, icon: Download, color: "text-violet-400", bg: "bg-violet-500/5 border-violet-500/15" },
          { 
            label: "Average rating across uploaded notes", 
            value: stats.averageRating > 0 ? `${stats.averageRating.toFixed(1)} ★` : "—", 
            icon: Star, 
            color: "text-yellow-400", 
            bg: "bg-yellow-500/5 border-yellow-500/15" 
          },
        ].map((stat) => (
          <Card key={stat.label} className={`${stat.bg} border backdrop-blur-sm`}>
            <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-1">
              <stat.icon className={`h-5 w-5 ${stat.color} ${stat.label.includes("rating") ? "fill-yellow-500/10" : ""}`} />
              <span className="text-2xl font-extrabold text-zinc-100">{stat.value}</span>
              <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 leading-snug">{stat.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Approved Notes List */}
      <div className="flex flex-col gap-5 pt-4">
        <h3 className="font-extrabold text-lg text-zinc-100 font-sans flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-indigo-400" />
          Public Contributions ({notes.length})
        </h3>

        {notes.length === 0 ? (
          <div className="text-sm text-zinc-500 py-12 text-center border border-dashed border-zinc-800 rounded-2xl">
            No public notes contributed yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {notes.map((note) => (
              <Link key={note.id} href={`/notes/${note.id}`}>
                <Card className="border border-zinc-800/60 bg-zinc-900/20 hover:bg-zinc-900/40 hover:border-indigo-500/25 p-5 rounded-2xl flex flex-col justify-between h-full transition-all duration-200 group cursor-pointer shadow-md">
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
                        Sem {note.semester}
                      </span>
                      <div className="flex items-center gap-0.5 bg-yellow-500/5 border border-yellow-500/15 px-2 py-0.5 rounded-lg">
                        <span className="text-[10px] font-extrabold text-yellow-500">
                          {note.average_rating > 0 ? note.average_rating.toFixed(1) : "—"}
                        </span>
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500 shrink-0" />
                      </div>
                    </div>

                    <div>
                      <h5 className="font-bold text-zinc-200 text-sm line-clamp-1 group-hover:text-indigo-400 transition-colors duration-200">
                        {note.title}
                      </h5>
                      <p className="text-[11px] text-zinc-500 truncate mt-1">
                        {note.subject_name || "Unknown Subject"}
                      </p>
                      {note.description && (
                        <p className="text-xs text-zinc-400 line-clamp-2 mt-2 leading-relaxed">
                          {note.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-3 mt-4 border-t border-zinc-850">
                    <span className="flex items-center gap-1">
                      <Download className="h-3.5 w-3.5" />
                      {note.downloads_count} downloads
                    </span>
                    <span className="flex items-center gap-1" suppressHydrationWarning>
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(note.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
