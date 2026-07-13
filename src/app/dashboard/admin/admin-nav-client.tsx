"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, ShieldAlert } from "lucide-react";

export function AdminNavClient() {
  const pathname = usePathname();

  const isReports = pathname.includes("/reports");

  return (
    <div className="flex items-center gap-4 border-b border-zinc-800 pb-2 mb-4 px-4 max-w-7xl mx-auto w-full">
      <Link 
        href="/dashboard/admin"
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${!isReports ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"}`}
      >
        <FileText className="h-4 w-4" /> Notes Moderation
      </Link>
      <Link 
        href="/dashboard/admin/reports"
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${isReports ? "bg-red-500/10 text-red-400 border border-red-500/20" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"}`}
      >
        <ShieldAlert className="h-4 w-4" /> Reports & Content
      </Link>
    </div>
  );
}
