"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useSupabase } from "@/hooks/useSupabase";
import {
  fetchRecentlyViewedNotesAction,
  clearRecentlyViewedNotesAction,
} from "@/app/actions/notes";
import { Skeleton } from "@/components/ui/skeleton";
import { Profile, Favorite, Note, DashboardProps } from "@/components/dashboard/types";
import { DesktopDashboard } from "@/components/dashboard/desktop-dashboard";
import { MobileDashboard } from "@/components/dashboard/mobile-dashboard";

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

        // Fetch all independent data concurrently
        const [profileRes, notesRes, favsRes, rvRes] = await Promise.allSettled([
          supabase.from("profiles").select("*").eq("id", userId).single(),
          supabase.from("notes").select("*").eq("author_id", userId).order("created_at", { ascending: false }),
          supabase.from("bookmarks").select("*, notes(*)").eq("user_id", userId),
          fetchRecentlyViewedNotesAction(10)
        ]);

        if (profileRes.status === "fulfilled" && !profileRes.value.error) {
          setProfile(profileRes.value.data);
        } else if (profileRes.status === "fulfilled" && profileRes.value.error) {
          console.warn("Profile fetch error:", profileRes.value.error);
        }

        if (notesRes.status === "fulfilled" && !notesRes.value.error) {
          setNotes(notesRes.value.data || []);
        } else if (notesRes.status === "fulfilled" && notesRes.value.error) {
          console.warn("Notes fetch error:", notesRes.value.error);
        }

        if (favsRes.status === "fulfilled" && !favsRes.value.error) {
          setFavorites((favsRes.value.data as any) || []);
        } else if (favsRes.status === "fulfilled" && favsRes.value.error) {
          console.warn("Favorites fetch error:", favsRes.value.error);
        }

        if (rvRes.status === "fulfilled" && rvRes.value.success && rvRes.value.data) {
          setRecentlyViewed(rvRes.value.data);
        }

      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn("Error fetching dashboard data:", message);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
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

  const dashboardProps: DashboardProps = {
    profile,
    notes,
    favorites,
    recentlyViewed,
    searchQuery,
    filteredNotes,
    handleClearHistory,
    isClearingHistory
  };

  return (
    <>
      <div className="hidden lg:block">
        <DesktopDashboard {...dashboardProps} />
      </div>
      <div className="block lg:hidden">
        <MobileDashboard {...dashboardProps} />
      </div>
    </>
  );
}

// Subcomponent: Skeleton Loading Frame
function SkeletonDashboard() {
  return (
    <div className="w-full max-w-7xl mx-auto grid lg:grid-cols-4 gap-8 animate-pulse">
      <div className="col-span-1 flex flex-col gap-6">
        <Skeleton className="h-64 w-full bg-zinc-900/50 rounded-3xl border border-zinc-800/50" />
        <Skeleton className="h-40 w-full bg-zinc-900/50 rounded-3xl border border-zinc-800/50" />
      </div>
      <div className="lg:col-span-3 flex flex-col gap-6">
        <div className="flex gap-5">
          <Skeleton className="h-12 w-32 bg-zinc-900/50 rounded-2xl border border-zinc-800/50" />
          <Skeleton className="h-12 w-32 bg-zinc-900/50 rounded-2xl border border-zinc-800/50" />
        </div>
        <Skeleton className="h-32 w-full bg-zinc-900/50 rounded-3xl border border-zinc-800/50" />
        <Skeleton className="h-[400px] w-full bg-zinc-900/50 rounded-3xl border border-zinc-800/50" />
      </div>
    </div>
  );
}
