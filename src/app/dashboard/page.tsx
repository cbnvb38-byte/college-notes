"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { 
  UploadCloud, 
  Bookmark, 
  ArrowDownToLine, 
  History, 
  Plus, 
  FileText, 
  TrendingUp, 
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  BarChart3,
  Star,
  Trash2
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  fetchRecentlyViewedNotesAction,
  clearRecentlyViewedNotesAction,
} from "@/app/actions/notes";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useSupabase } from "@/hooks/useSupabase";


// TypeScript interfaces for database records
interface Profile {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: "student" | "moderator" | "admin";
}

interface FavoriteNote {
  id: string;
  title: string;
  description: string | null;
  file_type: string;
  semester: number;
  downloads_count: number;
  created_at: string;
}

interface Favorite {
  id: string;
  notes: FavoriteNote | null;
}

interface Note {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string;
  file_size: number;
  semester: number;
  status: "draft" | "pending_review" | "approved" | "rejected" | "removed";
  downloads_count: number;
  view_count: number;
  bookmarks_count: number;
  average_rating: number;
  total_ratings: number;
  total_reviews: number;
  created_at: string;
}

export default function Dashboard() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const supabase = useSupabase();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isClearingHistory, setIsClearingHistory] = useState(false);
  // Load user data
  useEffect(() => {
    if (!isUserLoaded || !user) return;
    const userId = user.id;

    async function loadDashboardData() {
      try {
        setIsLoading(true);

        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // Fetch user's uploaded notes
        const { data: notesData, error: notesError } = await supabase
          .from("notes")
          .select("*")
          .eq("author_id", userId)
          .order("created_at", { ascending: false });

        if (notesError) throw notesError;
        setNotes(notesData || []);

        // Fetch user's bookmarked favorites
        const { data: favsData, error: favsError } = await supabase
          .from("bookmarks")
          .select("*, notes(*)")
          .eq("user_id", userId);

        if (favsError) throw favsError;
        setFavorites((favsData as any) || []);

        // Fetch user's recently viewed notes via Server Action
        const rvRes = await fetchRecentlyViewedNotesAction(10);
        if (rvRes.success && rvRes.data) {
          setRecentlyViewed(rvRes.data);
        }

      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn("Error fetching dashboard data:", message);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isUserLoaded, supabase]);


  if (!isUserLoaded || isLoading) {
    return <SkeletonDashboard />;
  }

  // Filter notes based on query
  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (note.description && note.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleClearHistory = async () => {
    if (!user || isClearingHistory) return;
    try {
      setIsClearingHistory(true);
      const res = await clearRecentlyViewedNotesAction();
      if (!res.success) {
        throw new Error("Failed to clear history");
      }
      setRecentlyViewed([]);
    } catch(e) {
      console.error("Failed to clear history", e);
    } finally {
      setIsClearingHistory(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto grid lg:grid-cols-4 gap-8">
        
        {/* Left Hand: Student Overview Card */}
        <div className="col-span-1 flex flex-col gap-6">
          <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl">
            <CardHeader className="items-center text-center pb-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 p-0.5 mb-3">
                <div className="h-full w-full rounded-full bg-zinc-950 flex items-center justify-center font-bold text-lg text-indigo-400 border border-zinc-900">
                  {profile?.name?.charAt(0).toUpperCase() || "S"}
                </div>
              </div>
              <CardTitle className="text-sm font-bold text-zinc-100">{profile?.name}</CardTitle>
              <CardDescription className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                {profile?.role} account
              </CardDescription>
            </CardHeader>
            <CardContent className="border-t border-zinc-800/50 pt-4 text-xs text-zinc-400 flex flex-col gap-3.5">
              <Link href="/dashboard/my-uploads" className="flex justify-between hover:text-indigo-400 transition-colors">
                <span>Total Contributions</span>
                <span className="font-bold text-zinc-100">{notes.length} notes</span>
              </Link>
              <Link href="/dashboard/downloads" className="flex justify-between hover:text-indigo-400 transition-colors">
                <span>Total Downloads</span>
                <span className="font-bold text-zinc-100">
                  {notes.reduce((acc, curr) => acc + (curr.downloads_count || 0), 0)} downloads
                </span>
              </Link>
              <Link href="/dashboard/bookmarks" className="flex justify-between hover:text-indigo-400 transition-colors">
                <span>Bookmarked</span>
                <span className="font-bold text-zinc-100">{favorites.length} guides</span>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Actions Panel */}
          <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl flex-grow">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Link href="/dashboard/upload" className="w-full">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white gap-2 text-xs py-5 rounded-xl shadow-lg shadow-indigo-500/10">
                  <UploadCloud className="h-4 w-4" /> Upload New Note
                </Button>
              </Link>
              <Link href="/dashboard/browse" className="w-full">
                <Button variant="outline" className="w-full border-zinc-800 hover:bg-zinc-800/30 text-zinc-300 text-xs py-5 rounded-xl">
                  Browse Library
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Right Hand: Tabs Panel uploads, bookmarks, timelines */}
        <div className="col-span-3 flex flex-col gap-6">
          
          {/* Dashboard Title & Visual Stats Grid */}
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
              Student Workspace
              <Sparkles className="h-4.5 w-4.5 text-indigo-400" />
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <Link href="/dashboard/my-uploads">
              <Card className="bg-zinc-900/25 border-zinc-800/50 shadow-md hover:bg-zinc-900/40 transition-colors cursor-pointer">
                <CardContent className="p-5 flex items-center gap-4.5">
                  <div className="bg-indigo-500/10 text-indigo-400 p-2.5 rounded-xl">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-zinc-100">{notes.length}</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wide font-bold">Uploaded Notes</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/dashboard/downloads">
              <Card className="bg-zinc-900/25 border-zinc-800/50 shadow-md hover:bg-zinc-900/40 transition-colors cursor-pointer">
                <CardContent className="p-5 flex items-center gap-4.5">
                  <div className="bg-violet-500/10 text-violet-400 p-2.5 rounded-xl">
                    <ArrowDownToLine className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-zinc-100">
                      {notes.reduce((acc, curr) => acc + (curr.downloads_count || 0), 0)}
                    </div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wide font-bold">Total Downloads</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/dashboard/profile">
              <Card className="bg-zinc-900/25 border-zinc-800/50 shadow-md hover:bg-zinc-900/40 transition-colors cursor-pointer">
                <CardContent className="p-5 flex items-center gap-4.5">
                  <div className="bg-pink-500/10 text-pink-400 p-2.5 rounded-xl">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-zinc-100">Sem {notes.length > 0 ? Math.max(...notes.map(n => n.semester)) : 1}</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wide font-bold">Current Target Semester</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Main Tabs panel */}
          <Tabs defaultValue="uploads" className="w-full flex-grow flex flex-col">
            <TabsList className="bg-zinc-900/50 border border-zinc-800/80 p-1 w-fit rounded-xl gap-1">
              <TabsTrigger value="uploads" className="text-xs px-4 py-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-950 data-[state=active]:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 transition-all font-semibold">
                My Uploads ({filteredNotes.length})
              </TabsTrigger>
              <TabsTrigger value="recent" className="text-xs px-4 py-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-950 data-[state=active]:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 transition-all font-semibold">
                Recently Viewed
              </TabsTrigger>
              <TabsTrigger value="stats" className="text-xs px-4 py-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-950 data-[state=active]:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 transition-all font-semibold">
                Contributor Stats
              </TabsTrigger>
            </TabsList>

            {/* Uploads Tab */}
            <TabsContent value="uploads" className="flex-1 mt-4">
              <Card className="bg-zinc-900/15 border-zinc-800/50 flex-grow shadow-inner">
                <CardContent className="p-6">
                  {filteredNotes.length === 0 ? (
                    <EmptyDashboardState 
                      title="No notes uploaded yet" 
                      description="Start contributing to the library. Upload course guides or class notes." 
                      actionLink="/dashboard/upload" 
                      actionText="Upload First Note"
                    />
                  ) : (
                    <div className="flex flex-col gap-3">
                      {filteredNotes.map((note) => (
                        <div 
                          key={note.id}
                          className="flex items-center justify-between border border-zinc-800/60 bg-zinc-900/35 hover:bg-zinc-900/50 px-5 py-4 rounded-xl transition-all duration-200"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="h-10 w-10 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-zinc-100">{note.title}</h4>
                              <p className="text-[11px] text-zinc-500 mt-0.5">
                                Semester {note.semester} &bull; {(note.file_size / 1024 / 1024).toFixed(1)} MB
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-5">
                            <span className="text-xs text-zinc-400 font-semibold">{note.downloads_count || 0} downloads</span>
                            
                            {/* Badges for note verification status */}
                            {note.status === "approved" && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                                <CheckCircle2 className="h-3 w-3" /> Approved
                              </span>
                            )}
                            {note.status === "pending_review" && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-amber-500/25 bg-amber-500/10 text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                                <Clock className="h-3 w-3 animate-spin" /> Pending Review
                              </span>
                            )}
                            {note.status === "rejected" && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-red-500/25 bg-red-500/10 text-[10px] text-red-400 font-bold uppercase tracking-wider">
                                <AlertCircle className="h-3 w-3" /> Rejected
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Recently Viewed Tab */}
            <TabsContent value="recent" className="flex-grow mt-4">
              <Card className="bg-zinc-900/15 border-zinc-800/50 shadow-inner">
                <CardContent className="p-6">
                  {recentlyViewed.length === 0 ? (
                    <EmptyDashboardState 
                      title="No recently viewed notes yet" 
                      description="Open some notes and they will appear here." 
                      actionLink="/dashboard/browse" 
                      actionText="Browse Library"
                    />
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClearHistory}
                          disabled={isClearingHistory}
                          className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 text-xs h-8 gap-1.5"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {isClearingHistory ? "Clearing..." : "Clear Recently Viewed"}
                        </Button>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {recentlyViewed.map((note) => (
                          <Link 
                            key={note.id} 
                            href={`/notes/${note.id}`}
                            className="block group"
                          >
                            <div className="border border-zinc-800/60 bg-zinc-900/35 hover:bg-zinc-900/50 p-5 rounded-xl flex flex-col justify-between gap-4.5 transition-all duration-200 h-full">
                              <div>
                                <div className="flex justify-between items-start">
                                  <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                                    {note.subjects?.branches?.name || "Semester " + note.semester} &bull; {note.subjects?.name || "General"}
                                  </span>
                                  {note.average_rating ? (
                                    <span className="flex items-center gap-1 text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded">
                                      <Star className="h-3 w-3 fill-yellow-500" />
                                      {note.average_rating.toFixed(1)}
                                    </span>
                                  ) : null}
                                </div>
                                <h4 className="font-bold text-sm text-zinc-100 mt-3 group-hover:text-indigo-400 transition-colors line-clamp-1">{note.title}</h4>
                                <p className="text-zinc-500 text-xs leading-relaxed mt-1.5 line-clamp-2">
                                  {note.description || "No description provided."}
                                </p>
                              </div>
                              <div className="flex items-center justify-between border-t border-zinc-800/50 pt-3 text-[11px] text-zinc-500">
                                <span className="flex items-center gap-2">
                                  <span>{note.downloads_count || 0} dls</span>
                                  <span>&bull;</span>
                                  <span className="truncate max-w-[100px]">{note.profiles?.name || "Anonymous"}</span>
                                </span>
                                <span className="inline-flex items-center gap-1 font-bold text-zinc-400 group-hover:text-indigo-400 transition-colors">
                                  Open <ExternalLink className="h-3 w-3" />
                                </span>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contributor Stats Tab */}
            <TabsContent value="stats" className="flex-1 mt-4">
              <Card className="bg-zinc-900/15 border-zinc-800/50 shadow-inner">
                <CardContent className="p-6 flex flex-col gap-6">
                  {(() => {
                    const totalUploaded = notes.length;
                    const approved = notes.filter(n => n.status === "approved").length;
                    const pending = notes.filter(n => n.status === "pending_review").length;
                    const rejected = notes.filter(n => n.status === "rejected").length;
                    const removed = notes.filter(n => n.status === "removed").length;

                    const views = notes.reduce((sum, n) => sum + (n.view_count || 0), 0);
                    const dls = notes.reduce((sum, n) => sum + (n.downloads_count || 0), 0);
                    const saves = notes.reduce((sum, n) => sum + (n.bookmarks_count || 0), 0);
                    const totalRatings = notes.reduce((sum, n) => sum + (n.total_ratings || 0), 0);
                    const totalReviews = notes.reduce((sum, n) => sum + (n.total_reviews || 0), 0);

                    const ratedApproved = notes.filter(n => n.status === "approved" && n.total_ratings > 0);
                    const averageRating = ratedApproved.length > 0
                      ? (ratedApproved.reduce((sum, n) => sum + (n.average_rating || 0), 0) / ratedApproved.length).toFixed(1)
                      : "0.0";

                    return (
                      <div className="flex flex-col gap-6">
                        <div>
                          <h3 className="text-sm font-bold text-zinc-200">Contributor Dashboard Summary</h3>
                          <p className="text-xs text-zinc-500 mt-0.5">Comprehensive engagement and content delivery metrics.</p>
                        </div>

                        {/* Top Summary Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="bg-zinc-950/40 p-4 border border-zinc-850 rounded-xl text-center flex flex-col gap-1.5 justify-center">
                            <span className="text-2xl font-extrabold text-zinc-100">{totalUploaded}</span>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Total Uploads</span>
                          </div>
                          <div className="bg-zinc-950/40 p-4 border border-zinc-850 rounded-xl text-center flex flex-col gap-1.5 justify-center">
                            <span className="text-2xl font-extrabold text-zinc-100">{views}</span>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Total Views</span>
                          </div>
                          <div className="bg-zinc-950/40 p-4 border border-zinc-850 rounded-xl text-center flex flex-col gap-1.5 justify-center">
                            <span className="text-2xl font-extrabold text-zinc-100">{dls}</span>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Total Downloads</span>
                          </div>
                          <div className="bg-zinc-950/40 p-4 border border-zinc-850 rounded-xl text-center flex flex-col gap-1.5 justify-center">
                            <span className="text-2xl font-extrabold text-zinc-100">{saves}</span>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Total Saves</span>
                          </div>
                        </div>

                        {/* Status Breakdown Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-850">
                          {/* Left: Notes count by Status */}
                          <div className="flex flex-col gap-3">
                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider pl-1">Status Breakdown</h4>
                            <div className="flex flex-col bg-zinc-950/20 border border-zinc-850 rounded-xl overflow-hidden divide-y divide-zinc-850">
                              {[
                                { label: "Approved Notes", value: approved, color: "text-emerald-400" },
                                { label: "Pending Review", value: pending, color: "text-amber-400" },
                                { label: "Rejected Notes", value: rejected, color: "text-red-400" },
                                { label: "Removed Notes", value: removed, color: "text-zinc-500" },
                              ].map((item) => (
                                <div key={item.label} className="flex justify-between items-center py-2.5 px-4 text-xs">
                                  <span className="text-zinc-400 font-semibold">{item.label}</span>
                                  <span className={`font-bold ${item.color}`}>{item.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Right: Feedback & Ratings Summary */}
                          <div className="flex flex-col gap-3">
                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider pl-1">Feedback Summary</h4>
                            <div className="flex flex-col bg-zinc-950/20 border border-zinc-850 rounded-xl overflow-hidden divide-y divide-zinc-850">
                              <div className="flex justify-between items-center py-2.5 px-4 text-xs">
                                <span className="text-zinc-400 font-semibold">Total Ratings Received</span>
                                <span className="font-bold text-zinc-200">{totalRatings}</span>
                              </div>
                              <div className="flex justify-between items-center py-2.5 px-4 text-xs">
                                <span className="text-zinc-400 font-semibold">Total Written Reviews</span>
                                <span className="font-bold text-zinc-200">{totalReviews}</span>
                              </div>
                              <div className="flex justify-between items-center py-2.5 px-4 text-xs">
                                <span className="text-zinc-400 font-semibold">Average rating across uploaded notes</span>
                                <span className="font-extrabold text-yellow-500 flex items-center gap-1">
                                  {averageRating} <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

        </div>
      </div>
  );
}

// Subcomponent: Empty State Helper
interface EmptyStateProps {
  title: string;
  description: string;
  actionLink: string;
  actionText: string;
}

function EmptyDashboardState({ title, description, actionLink, actionText }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-4">
      <div className="h-14 w-14 bg-zinc-900/80 border border-zinc-800/85 text-zinc-500 rounded-2xl flex items-center justify-center mb-5.5 shadow-md">
        <History className="h-6 w-6" />
      </div>
      <h3 className="font-bold text-sm text-zinc-200">{title}</h3>
      <p className="text-zinc-500 text-xs leading-relaxed max-w-sm mt-2">
        {description}
      </p>
      <Link href={actionLink} className="mt-6">
        <Button size="sm" className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 gap-1.5 text-xs py-4 px-5 rounded-xl border border-zinc-700/30 shadow-md">
          <Plus className="h-3.5 w-3.5" />
          {actionText}
        </Button>
      </Link>
    </div>
  );
}

// Subcomponent: Skeleton Loading Frame
function SkeletonDashboard() {
  return (
    <div className="w-full max-w-7xl mx-auto grid lg:grid-cols-4 gap-8 animate-pulse">
      <div className="col-span-1 flex flex-col gap-6">
        <Skeleton className="h-64 w-full bg-zinc-800/50 rounded-2xl" />
        <Skeleton className="h-32 w-full bg-zinc-800/50 rounded-2xl" />
      </div>
      <div className="lg:col-span-3 flex flex-col gap-6">
        <div className="flex gap-4">
          <Skeleton className="h-10 w-28 bg-zinc-800/50 rounded-xl" />
          <Skeleton className="h-10 w-28 bg-zinc-800/50 rounded-xl" />
        </div>
        <Skeleton className="h-24 w-full bg-zinc-800/50 rounded-2xl" />
        <Skeleton className="h-[300px] w-full bg-zinc-800/50 rounded-2xl" />
      </div>
    </div>
  );
}
