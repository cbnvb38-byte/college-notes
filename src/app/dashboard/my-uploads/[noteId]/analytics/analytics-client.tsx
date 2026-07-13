"use client";

import { 
  BarChart3, 
  Eye, 
  Download, 
  Bookmark, 
  Star, 
  Calendar, 
  Clock, 
  AlertTriangle,
  Heart,
  ChevronLeft,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

interface AnalyticsData {
  note: {
    id: string;
    title: string;
    status: string;
    created_at: string;
    updated_at: string;
    view_count: number;
    downloads_count: number;
    bookmarks_count: number;
    average_rating: number;
    total_ratings: number;
    total_reviews: number;
  };
  distribution: Record<number, number>;
  totalHelpfulVotes: number;
  totalReports: number;
  lastActivityDate: string;
  recentActivity: Array<{
    type: string;
    label: string;
    date: string;
  }>;
}

export default function AnalyticsClient({ initialData }: { initialData: AnalyticsData }) {
  const { note, distribution, totalHelpfulVotes, totalReports, lastActivityDate, recentActivity } = initialData;

  const maxDistributionCount = Math.max(...Object.values(distribution), 1);

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-12 w-full">
      {/* Header Back Button */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/my-uploads">
          <Button
            variant="ghost"
            className="text-zinc-400 hover:text-zinc-50 hover:bg-zinc-900/50 rounded-xl gap-2 font-semibold h-10 px-4"
          >
            <ChevronLeft className="h-4 w-4" /> Back to My Uploads
          </Button>
        </Link>

        <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
          Performance Dashboard
        </span>
      </div>

      {/* Main Stats Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
            <BarChart3 className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-100 truncate max-w-[500px]" title={note.title}>
              {note.title}
            </h1>
            <p className="text-zinc-400 text-xs mt-0.5">
              Engagement and rating metrics summary. Status: <span className="font-bold uppercase text-emerald-400">{note.status}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Performance Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Views Received", value: note.view_count, icon: Eye, color: "text-blue-400", bg: "bg-blue-500/5 border-blue-500/15" },
          { label: "Downloads", value: note.downloads_count, icon: Download, color: "text-indigo-400", bg: "bg-indigo-500/5 border-indigo-500/15" },
          { label: "Saves (Bookmarks)", value: note.bookmarks_count, icon: Bookmark, color: "text-pink-400", bg: "bg-pink-500/5 border-pink-500/15" },
          { label: "Helpful Votes", value: totalHelpfulVotes, icon: Heart, color: "text-red-400", bg: "bg-red-500/5 border-red-500/15" },
        ].map((stat) => (
          <Card key={stat.label} className={`${stat.bg} border backdrop-blur-sm`}>
            <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-1">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              <span className="text-2xl font-extrabold text-zinc-100">{stat.value}</span>
              <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">{stat.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Rating Breakdown & Distribution (2 cols) */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl">
            <CardHeader className="pb-3 border-b border-zinc-800/40">
              <CardTitle className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                Ratings Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
              
              {/* Average Ratings block */}
              <div className="flex flex-col items-center justify-center text-center border-b sm:border-b-0 sm:border-r border-zinc-800/40 pb-6 sm:pb-0">
                <span className="text-5xl font-extrabold text-zinc-100">
                  {note.average_rating > 0 ? note.average_rating.toFixed(1) : "—"}
                </span>
                <div className="flex items-center gap-0.5 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={`h-4 w-4 ${
                        star <= Math.round(note.average_rating) 
                          ? "fill-yellow-500 text-yellow-500" 
                          : "text-zinc-700"
                      }`} 
                    />
                  ))}
                </div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 mt-2">
                  {note.total_ratings} ratings total
                </span>
                <span className="text-[9px] text-zinc-600 mt-1">
                  ({note.total_reviews} with written reviews)
                </span>
              </div>

              {/* Distribution block */}
              <div className="sm:col-span-2 flex flex-col gap-2.5 justify-center">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = distribution[star] || 0;
                  const percent = note.total_ratings > 0 ? (count / note.total_ratings) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-3 text-xs">
                      <span className="w-3 text-zinc-500 font-bold text-right">{star}</span>
                      <Star className="h-3 w-3 text-zinc-600 fill-zinc-650 shrink-0" />
                      <div className="flex-1 h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/50">
                        <div 
                          className="h-full bg-indigo-500/80 rounded-full" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="w-8 text-zinc-500 text-right font-medium">{count}</span>
                    </div>
                  );
                })}
              </div>

            </CardContent>
          </Card>

          {/* Timeline / Recent Activity */}
          <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl flex-grow">
            <CardHeader className="pb-3 border-b border-zinc-800/40">
              <CardTitle className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <Activity className="h-4 w-4 text-indigo-400" />
                Recent Note Events
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500">
                Log of recent downloads and rating submissions.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {recentActivity.length === 0 ? (
                <p className="text-zinc-500 text-xs text-center py-8">No recent activity logged for this note.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {recentActivity.map((activity, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs pb-2 border-b border-zinc-850 last:border-none last:pb-0">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2 h-2 rounded-full ${activity.type === "download" ? "bg-indigo-500" : "bg-yellow-500"}`} />
                        <span className="text-zinc-350">{activity.label}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500" suppressHydrationWarning>
                        {new Date(activity.date).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Analytics Metadata Sidebar (1 col) */}
        <div className="flex flex-col gap-4">
          <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl">
            <CardHeader className="pb-3 border-b border-zinc-800/40">
              <CardTitle className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-zinc-500" />
                Timeline Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col gap-3.5 text-xs text-zinc-400">
              <div className="flex justify-between">
                <span>Upload Date</span>
                <span className="font-semibold text-zinc-200" suppressHydrationWarning>
                  {new Date(note.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated</span>
                <span className="font-semibold text-zinc-200" suppressHydrationWarning>
                  {new Date(note.updated_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Last Activity Logged</span>
                <span className="font-semibold text-zinc-200" suppressHydrationWarning>
                  {new Date(lastActivityDate).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl">
            <CardHeader className="pb-3 border-b border-zinc-800/40">
              <CardTitle className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Safety Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col gap-3.5 text-xs text-zinc-400">
              <div className="flex justify-between items-center">
                <span>Flagged reports count</span>
                <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                  totalReports > 0 ? "bg-red-500/10 text-red-400" : "bg-zinc-800 text-zinc-500"
                }`}>
                  {totalReports} {totalReports === 1 ? "report" : "reports"}
                </span>
              </div>
              <p className="text-[10px] text-zinc-550 leading-relaxed">
                Note reports are reviewed anonymously by our admin moderation team. Private reporter identities are hidden to protect privacy.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
