import { DashboardShell } from "@/components/layout/dashboard-shell";

export const metadata = {
  title: "Dashboard - College Notes",
  description: "Student and Admin dashboard for College Notes.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
