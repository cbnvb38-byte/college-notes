"use client";

import { useState, useCallback } from "react";
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  EyeOff,
  Trash2,
  FileText,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Undo2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { getAdminReports, updateReportStatus, type ReportFilterOptions } from "@/app/actions/reports";
import { removeNote, restoreNote, permanentDeleteNote } from "@/app/actions/admin";
import { updateReviewStatus } from "@/app/actions/ratings";
import Link from "next/link";

interface Report {
  id: string;
  type: "note" | "review";
  reporter_id: string;
  reporter_name: string;
  target_id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  target_metadata: any;
}

interface ReportsData {
  reports: Report[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

const STATUS_TABS = [
  { key: "pending", label: "Pending", icon: Clock, color: "text-amber-400" },
  { key: "resolved", label: "Resolved", icon: CheckCircle2, color: "text-emerald-400" },
  { key: "dismissed", label: "Dismissed", icon: XCircle, color: "text-zinc-400" },
] as const;

export default function ReportsDashboardClient({
  initialReports,
  userRole,
}: {
  initialReports: ReportsData;
  userRole: string;
}) {
  const [reportsData, setReportsData] = useState<ReportsData>(initialReports);
  const [activeTab, setActiveTab] = useState<"pending" | "resolved" | "dismissed">("pending");
  const [activeType, setActiveType] = useState<"all" | "note" | "review">("all");
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const isAdmin = userRole === "admin";

  const fetchReports = useCallback(async (filters: ReportFilterOptions) => {
    setIsLoading(true);
    try {
      const res = await getAdminReports(filters);
      if (res.success && "data" in res) {
        setReportsData(res.data as ReportsData);
      }
    } catch (err) {
      toast.error("Failed to fetch reports");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleTabChange = (status: "pending" | "resolved" | "dismissed") => {
    setActiveTab(status);
    fetchReports({ status, type: activeType === "all" ? undefined : activeType, page: 1 });
  };

  const handleTypeChange = (type: "all" | "note" | "review") => {
    setActiveType(type);
    fetchReports({ status: activeTab, type: type === "all" ? undefined : type, page: 1 });
  };

  const handlePageChange = (page: number) => {
    fetchReports({ status: activeTab, type: activeType === "all" ? undefined : activeType, page });
  };

  // ============================================================
  // Report Status Actions
  // ============================================================
  const handleUpdateReportStatus = async (reportId: string, type: "note" | "review", status: "resolved" | "dismissed") => {
    if (actionLoadingId) return;
    setActionLoadingId(`report-${reportId}`);
    try {
      const res = await updateReportStatus(reportId, type, status);
      if (res.success) {
        toast.success(`Report marked as ${status}`);
        setReportsData((prev) => ({
          ...prev,
          reports: prev.reports.filter((r) => r.id !== reportId),
          totalCount: prev.totalCount - 1,
        }));
      } else {
        toast.error("Failed to update report");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setActionLoadingId(null);
    }
  };

  // ============================================================
  // Review Moderation Actions
  // ============================================================
  const handleUpdateReviewStatus = async (reviewId: string, status: "visible" | "hidden" | "removed") => {
    if (actionLoadingId) return;
    if (status === "removed" && !window.confirm("Are you sure you want to completely remove this review and rating?")) return;
    if (status === "hidden" && !window.confirm("Hide review text? (The rating score will remain)")) return;
    
    setActionLoadingId(`review-${reviewId}`);
    try {
      const res = await updateReviewStatus(reviewId, status);
      if (res.success) {
        toast.success(`Review marked as ${status}`);
        setReportsData(d => ({
          ...d,
          reports: d.reports.map(r => r.type === "review" && r.target_id === reviewId ? {
            ...r,
            target_metadata: { ...r.target_metadata, status }
          } : r)
        }));
      } else {
        toast.error("Failed to moderate review");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setActionLoadingId(null);
    }
  };

  // ============================================================
  // Note Moderation Actions
  // ============================================================
  const handleRemoveNote = async (noteId: string) => {
    if (actionLoadingId) return;
    if (!window.confirm("Remove this note from public view?")) return;
    setActionLoadingId(`note-${noteId}`);
    try {
      const res = await removeNote(noteId);
      if (res.success) {
        toast.success("Note removed");
        setReportsData(d => ({
          ...d,
          reports: d.reports.map(r => r.type === "note" && r.target_id === noteId ? {
            ...r,
            target_metadata: { ...r.target_metadata, status: "removed" }
          } : r)
        }));
      } else {
        toast.error("Failed to remove note");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRestoreNote = async (noteId: string) => {
    if (actionLoadingId) return;
    setActionLoadingId(`note-${noteId}`);
    try {
      const res = await restoreNote(noteId);
      if (res.success) {
        toast.success("Note restored");
        setReportsData(d => ({
          ...d,
          reports: d.reports.map(r => r.type === "note" && r.target_id === noteId ? {
            ...r,
            target_metadata: { ...r.target_metadata, status: "approved" }
          } : r)
        }));
      } else {
        toast.error("Failed to restore note");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 pb-12 w-full">
      <div className="flex flex-col gap-2 mb-2">
        <h1 className="text-2xl font-extrabold tracking-tight text-red-400 flex items-center gap-2">
          <ShieldAlert className="h-6 w-6" />
          Content Reports
        </h1>
        <p className="text-zinc-400 text-xs">Review user-submitted reports for notes and reviews.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.key
                  ? "bg-zinc-800 text-zinc-100 border border-zinc-700"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"
              }`}
            >
              <tab.icon className={`h-3.5 w-3.5 ${activeTab === tab.key ? tab.color : ""}`} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Type Filter */}
        <div className="flex bg-zinc-900/50 p-1 rounded-lg border border-zinc-800/60">
          <button
            onClick={() => handleTypeChange("all")}
            className={`px-3 py-1 text-[10px] font-bold rounded-md ${activeType === "all" ? "bg-zinc-800 text-white" : "text-zinc-500"}`}
          >
            All
          </button>
          <button
            onClick={() => handleTypeChange("note")}
            className={`px-3 py-1 text-[10px] font-bold rounded-md ${activeType === "note" ? "bg-zinc-800 text-white" : "text-zinc-500"}`}
          >
            Notes
          </button>
          <button
            onClick={() => handleTypeChange("review")}
            className={`px-3 py-1 text-[10px] font-bold rounded-md ${activeType === "review" ? "bg-zinc-800 text-white" : "text-zinc-500"}`}
          >
            Reviews
          </button>
        </div>
      </div>

      {isLoading ? (
        <Card className="bg-zinc-900/30 border-zinc-800/60">
          <CardContent className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          </CardContent>
        </Card>
      ) : reportsData.reports.length === 0 ? (
        <Card className="bg-zinc-900/30 border-zinc-800/60">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <ShieldAlert className="h-10 w-10 text-zinc-600" />
            <p className="text-zinc-400 text-sm font-semibold">No reports found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {reportsData.reports.map((report) => (
            <Card key={report.id} className="bg-zinc-900/30 border-zinc-800/60 overflow-hidden">
              <div className="flex flex-col lg:flex-row">
                
                {/* Left Side: Report Details */}
                <div className="flex-1 p-4 lg:p-5 border-b lg:border-b-0 lg:border-r border-zinc-800/40">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      report.type === "note" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                    }`}>
                      {report.type === "note" ? "Reported Note" : "Reported Review"}
                    </span>
                    <span className="text-[10px] text-zinc-500" suppressHydrationWarning>
                      {new Date(report.created_at).toLocaleString()}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-zinc-100 mb-1">{report.reason}</h3>
                  {report.details && (
                    <p className="text-xs text-zinc-400 bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800/40 mt-2">
                      &quot;{report.details}&quot;
                    </p>
                  )}
                  
                  <div className="mt-4 pt-3 border-t border-zinc-800/30">
                    <p className="text-[10px] text-zinc-500">
                      Reported by <span className="font-semibold text-zinc-300">{report.reporter_name}</span> (Admin visible only)
                    </p>
                  </div>
                </div>

                {/* Right Side: Target & Actions */}
                <div className="flex-1 p-4 lg:p-5 bg-zinc-950/20 flex flex-col justify-between">
                  <div>
                    <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Target Content</h4>
                    
                    {report.type === "note" ? (
                      <div className="bg-zinc-900 border border-zinc-800/60 rounded-lg p-3">
                        <p className="text-xs font-semibold text-zinc-200 mb-1">
                          {report.target_metadata.title}
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          Status: <span className="text-zinc-300 uppercase">{report.target_metadata.status}</span>
                        </p>
                        <Link href={`/notes/${report.target_id}`} target="_blank" className="text-[10px] text-indigo-400 hover:underline mt-2 inline-block">
                          View Note &rarr;
                        </Link>
                      </div>
                    ) : (
                      <div className="bg-zinc-900 border border-zinc-800/60 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold">
                            {report.target_metadata.rating} ★
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            Status: <span className="text-zinc-300 uppercase">{report.target_metadata.status}</span>
                          </span>
                        </div>
                        {report.target_metadata.review_text ? (
                          <p className="text-xs text-zinc-300 italic line-clamp-3">
                            &quot;{report.target_metadata.review_text}&quot;
                          </p>
                        ) : (
                          <p className="text-[10px] text-zinc-600 italic">No text review provided.</p>
                        )}
                        <Link href={`/notes/${report.target_metadata.note_id}`} target="_blank" className="text-[10px] text-indigo-400 hover:underline mt-2 inline-block">
                          View Note Page &rarr;
                        </Link>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-zinc-800/30">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateReportStatus(report.id, report.type, "dismissed")}
                        disabled={!!actionLoadingId}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] h-7 gap-1 font-bold flex-1"
                      >
                        {actionLoadingId === `report-${report.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                        Dismiss Report
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleUpdateReportStatus(report.id, report.type, "resolved")}
                        disabled={!!actionLoadingId}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] h-7 gap-1 font-bold flex-1"
                      >
                        {actionLoadingId === `report-${report.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                        Resolve Report
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      {report.type === "note" ? (
                        <>
                          {report.target_metadata.status !== "removed" ? (
                            <Button
                              size="sm"
                              onClick={() => handleRemoveNote(report.target_id)}
                              disabled={!!actionLoadingId}
                              variant="outline"
                              className="border-red-500/20 text-red-400 hover:bg-red-500/10 text-[10px] h-7 gap-1 font-bold flex-1"
                            >
                              <Trash2 className="h-3 w-3" /> Remove Note
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleRestoreNote(report.target_id)}
                              disabled={!!actionLoadingId}
                              variant="outline"
                              className="border-amber-500/20 text-amber-400 hover:bg-amber-500/10 text-[10px] h-7 gap-1 font-bold flex-1"
                            >
                              <Undo2 className="h-3 w-3" /> Restore Note
                            </Button>
                          )}
                        </>
                      ) : (
                        <>
                          {report.target_metadata.status === "visible" && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateReviewStatus(report.target_id, "hidden")}
                              disabled={!!actionLoadingId}
                              variant="outline"
                              className="border-amber-500/20 text-amber-400 hover:bg-amber-500/10 text-[10px] h-7 gap-1 font-bold flex-1"
                            >
                              <EyeOff className="h-3 w-3" /> Hide Review
                            </Button>
                          )}
                          {report.target_metadata.status !== "removed" ? (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateReviewStatus(report.target_id, "removed")}
                              disabled={!!actionLoadingId}
                              variant="outline"
                              className="border-red-500/20 text-red-400 hover:bg-red-500/10 text-[10px] h-7 gap-1 font-bold flex-1"
                            >
                              <Trash2 className="h-3 w-3" /> Remove Review
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateReviewStatus(report.target_id, "visible")}
                              disabled={!!actionLoadingId}
                              variant="outline"
                              className="border-zinc-500/20 text-zinc-400 hover:bg-zinc-500/10 text-[10px] h-7 gap-1 font-bold flex-1"
                            >
                              <Undo2 className="h-3 w-3" /> Restore Review
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          
          {reportsData.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(reportsData.currentPage - 1)}
                disabled={reportsData.currentPage <= 1 || isLoading}
                className="border-zinc-800 text-zinc-400 h-8 text-xs gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
              </Button>
              <span className="text-xs text-zinc-500 font-bold">
                Page {reportsData.currentPage} of {reportsData.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(reportsData.currentPage + 1)}
                disabled={reportsData.currentPage >= reportsData.totalPages || isLoading}
                className="border-zinc-800 text-zinc-400 h-8 text-xs gap-1"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
