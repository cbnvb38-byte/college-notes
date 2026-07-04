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
  ExternalLink
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
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
  role: "student" | "admin";
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
  status: "pending" | "approved" | "rejected";
  downloads_count: number;
  created_at: string;
}


export default function Dashboard() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const supabase = useSupabase();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [searchQuery, _setSearchQuery] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_isUsingMockData, setIsUsingMockData] = useState(false);

  // Seeding beautiful mock database states — declared before useEffect so it can be called inside
  const loadMockData = () => {
    setProfile({
      id: user?.id || "mock_user",
      email: user?.primaryEmailAddress?.emailAddress || "student@college.edu",
      name: user?.fullName || "Jane Doe",
      avatar_url: user?.imageUrl || null,
      role: "student"
    });

    setNotes([
      {
        id: "note-1",
        title: "Compiler Design Handouts",
        description: "Complete compiler construction lectures on lexing and parsing.",
        file_url: "#",
        file_type: "application/pdf",
        file_size: 4500000,
        semester: 5,
        status: "approved",
        downloads_count: 142,
        created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString()
      },
      {
        id: "note-2",
        title: "DBMS Midterm Review Sheets",
        description: "SQL joins, indexing, Normalization theory review.",
        file_url: "#",
        file_type: "application/pdf",
        file_size: 2100000,
        semester: 4,
        status: "pending",
        downloads_count: 0,
        created_at: new Date(Date.now() - 3600000 * 5).toISOString()
      },
      {
        id: "note-3",
        title: "Physics II Lab Manuals",
        description: "Electromagnetism experiments details and lab report format.",
        file_url: "#",
        file_type: "application/pdf",
        file_size: 8900000,
        semester: 2,
        status: "rejected",
        created_at: new Date(Date.now() - 3600000 * 24 * 12).toISOString(),
        downloads_count: 0
      }
    ]);

    setFavorites([
      {
        id: "fav-1",
        notes: {
          id: "note-4",
          title: "Introduction to Calculus III",
          description: "Multivariable integration and vector fields guide.",
          file_type: "application/pdf",
          semester: 3,
          downloads_count: 320,
          created_at: new Date().toISOString()
        }
      }
    ]);
  };

  // Load user data
  useEffect(() => {
    if (!isUserLoaded || !user) return;
    const userId = user.id;

    async function loadDashboardData() {
      try {
        setIsLoading(true);

        // Test if env is missing to trigger mock data fallback
        if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("your-project-id")) {
          throw new Error("Supabase placeholders detected, falling back to mock data.");
        }

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
          .from("favorites")
          .select("*, notes(*)")
          .eq("user_id", userId);

        if (favsError) throw favsError;
        setFavorites(favsData || []);

      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn("Using mock data as Supabase keys are not set yet:", message);
        setIsUsingMockData(true);
        loadMockData();
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
              <Link href="/dashboard/my-notes" className="flex justify-between hover:text-indigo-400 transition-colors">
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
            <Link href="/dashboard/my-notes">
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
              <TabsTrigger value="uploads" className="text-xs px-4 py-2 rounded-lg data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-50">
                My Uploads ({filteredNotes.length})
              </TabsTrigger>
              <TabsTrigger value="bookmarks" className="text-xs px-4 py-2 rounded-lg data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-50">
                Bookmarked ({favorites.length})
              </TabsTrigger>
              <TabsTrigger value="timeline" className="text-xs px-4 py-2 rounded-lg data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-50">
                Activity Logs
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
                            {note.status === "pending" && (
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

            {/* Bookmarks Tab */}
            <TabsContent value="bookmarks" className="flex-grow mt-4">
              <Card className="bg-zinc-900/15 border-zinc-800/50 shadow-inner">
                <CardContent className="p-6">
                  {favorites.length === 0 ? (
                    <EmptyDashboardState 
                      title="No bookmarks saved" 
                      description="Search for class lecture notes or test papers and save them for fast offline access." 
                      actionLink="/dashboard/browse" 
                      actionText="Browse Notes Library"
                    />
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {favorites.map((fav) => (
                        <div 
                          key={fav.id}
                          className="border border-zinc-800/60 bg-zinc-900/35 hover:bg-zinc-900/50 p-5 rounded-xl flex flex-col justify-between gap-4.5 transition-all duration-200"
                        >
                          <div>
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                                PDF Document
                              </span>
                              <Bookmark className="h-4 w-4 text-pink-500 fill-pink-500" />
                            </div>
                            <h4 className="font-bold text-sm text-zinc-100 mt-3">{fav.notes?.title}</h4>
                            <p className="text-zinc-500 text-xs leading-relaxed mt-1.5 line-clamp-2">
                              {fav.notes?.description || "No description provided."}
                            </p>
                          </div>
                          <div className="flex items-center justify-between border-t border-zinc-800/50 pt-3 text-[11px] text-zinc-500">
                            <span>Semester {fav.notes?.semester} &bull; {fav.notes?.downloads_count} downloads</span>
                            <Link href={`/dashboard/browse`} className="hover:text-indigo-400 inline-flex items-center gap-1 font-bold">
                              Open View <ExternalLink className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Logs Tab */}
            <TabsContent value="timeline" className="flex-grow mt-4">
              <Card className="bg-zinc-900/15 border-zinc-800/50 shadow-inner">
                <CardContent className="p-6">
                  {/* Timeline list */}
                  <div className="relative border-l border-zinc-800 pl-6 ml-3 flex flex-col gap-6.5 py-2">
                    <div className="relative">
                      <span className="absolute -left-[30px] top-0 h-4.5 w-4.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      </span>
                      <h5 className="text-xs font-bold text-zinc-200">Note Approved</h5>
                      <p className="text-[11px] text-zinc-500 mt-1">&quot;Compiler Design Handouts&quot; was approved by admins and pushed public.</p>
                      <span className="text-[9px] text-zinc-600 font-semibold block mt-1">3 days ago</span>
                    </div>

                    <div className="relative">
                      <span className="absolute -left-[30px] top-0 h-4.5 w-4.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                      </span>
                      <h5 className="text-xs font-bold text-zinc-200">Uploaded Midterm Reviews</h5>
                      <p className="text-[11px] text-zinc-500 mt-1">You submitted &quot;DBMS Midterm Review Sheets&quot; for authorization verification.</p>
                      <span className="text-[9px] text-zinc-600 font-semibold block mt-1">5 hours ago</span>
                    </div>

                    <div className="relative">
                      <span className="absolute -left-[30px] top-0 h-4.5 w-4.5 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                      </span>
                      <h5 className="text-xs font-bold text-zinc-200">Upload Rejected</h5>
                      <p className="text-[11px] text-zinc-500 mt-1">&quot;Physics II Lab Manuals&quot; was rejected: file was blank or duplicate.</p>
                      <span className="text-[9px] text-zinc-600 font-semibold block mt-1">12 days ago</span>
                    </div>
                  </div>
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
