"use client";

import { History, FileText, ArrowDownToLine, Bookmark, AlertCircle, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface ActivityItem {
  id: string;
  type: "upload" | "download" | "bookmark" | "status";
  title: string;
  detail: string;
  time: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const activities: ActivityItem[] = [];

export default function RecentActivityPage() {
  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent">
          Recent Activity
        </h1>
        <p className="text-zinc-400 text-sm">
          Track logs of all your uploads, bookmarks, downloads, and approvals.
        </p>
      </div>

      <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl">
        <CardHeader className="pb-3 border-b border-zinc-800/40">
          <CardTitle className="text-sm font-bold text-zinc-200">Activity Log</CardTitle>
          <CardDescription className="text-xs text-zinc-500">
            A chronological timeline of your interactions.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="relative border-l border-zinc-800/80 pl-6 ml-3 flex flex-col gap-7 py-2">
            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-zinc-500 gap-3 ml-[-12px]">
                <History className="h-8 w-8 text-zinc-600 animate-spin" />
                <p className="text-sm">No activity recorded yet.</p>
              </div>
            ) : (
              activities.map((act) => {
                const Icon = act.icon;
                return (
                  <div key={act.id} className="relative group">
                    {/* Timeline circle dot */}
                    <span className={`absolute -left-[38px] top-0.5 h-6 w-6 rounded-lg border flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${act.color}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200">{act.title}</h4>
                      <p className="text-[11px] text-zinc-500 mt-1">{act.detail}</p>
                      <span className="text-[9px] text-zinc-600 font-semibold block mt-1">{act.time}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
