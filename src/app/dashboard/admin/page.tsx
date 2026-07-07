import { redirect } from "next/navigation";
import { getAdminStats, getAdminNotes, getRecentAdminActivity, checkAdminAccess } from "@/app/actions/admin";
import AdminDashboardClient from "@/app/dashboard/admin/admin-client";

export const metadata = {
  title: "Admin Panel - College Notes",
  description: "Administrative dashboard for managing pending note verifications.",
};

export default async function AdminPage() {
  // 1. Verify access (redirects to /dashboard if unauthorized)
  const accessRes = await checkAdminAccess();
  if (!accessRes.success || !("data" in accessRes) || !accessRes.data) {
    redirect("/dashboard");
  }

  const userRole = accessRes.data.role;

  // 2. Fetch initial data in parallel
  const [statsRes, notesRes, activityRes] = await Promise.all([
    getAdminStats(),
    getAdminNotes({ status: "pending_review", page: 1 }),
    getRecentAdminActivity(10),
  ]);

  if (
    !statsRes.success ||
    !("data" in statsRes) ||
    !notesRes.success ||
    !("data" in notesRes) ||
    !activityRes.success ||
    !("data" in activityRes)
  ) {
    return (
      <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-12 items-center justify-center min-h-[50vh]">
        <div className="text-red-400 font-bold bg-red-500/10 p-6 rounded-2xl border border-red-500/20 text-center">
          <h2 className="text-xl mb-2">Error Loading Dashboard</h2>
          <p className="text-sm">Failed to load admin data from the server. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <AdminDashboardClient
      initialStats={statsRes.data as any}
      initialNotes={notesRes.data as any}
      initialActivity={activityRes.data as any}
      userRole={userRole}
    />
  );
}
