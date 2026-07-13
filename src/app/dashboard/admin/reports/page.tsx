import { redirect } from "next/navigation";
import { checkAdminAccess } from "@/app/actions/admin";
import { getAdminReports } from "@/app/actions/reports";
import ReportsDashboardClient from "./reports-client";

export const metadata = {
  title: "Reports Moderation - Admin Panel",
};

export default async function AdminReportsPage() {
  const accessRes = await checkAdminAccess();
  if (!accessRes.success || !("data" in accessRes) || !accessRes.data) {
    redirect("/dashboard");
  }

  const userRole = accessRes.data.role;

  // Fetch initial open reports
  const reportsRes = await getAdminReports({ status: "pending", page: 1 });

  if (!reportsRes.success || !("data" in reportsRes)) {
    return (
      <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-12 items-center justify-center min-h-[50vh]">
        <div className="text-red-400 font-bold bg-red-500/10 p-6 rounded-2xl border border-red-500/20 text-center">
          <h2 className="text-xl mb-2">Error Loading Reports</h2>
          <p className="text-sm">Failed to load reports data from the server. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <ReportsDashboardClient 
      initialReports={reportsRes.data as any} 
      userRole={userRole} 
    />
  );
}
