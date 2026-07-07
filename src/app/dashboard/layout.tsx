import { DashboardShell } from "@/components/layout/dashboard-shell";

export const metadata = {
  title: "Dashboard - College Notes",
  description: "Student and Admin dashboard for College Notes.",
};

import { ensureCurrentUserProfile } from "@/app/actions/profile";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profileRes = await ensureCurrentUserProfile();
  const userRole = profileRes.success && profileRes.data ? profileRes.data.role : "student";

  return <DashboardShell userRole={userRole}>{children}</DashboardShell>;
}
