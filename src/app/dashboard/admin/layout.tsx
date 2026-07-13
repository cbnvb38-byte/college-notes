import Link from "next/link";
import { headers } from "next/headers";
import { checkAdminAccess } from "@/app/actions/admin";
import { redirect } from "next/navigation";
import { FileText, ShieldAlert } from "lucide-react";
import { AdminNavClient } from "@/app/dashboard/admin/admin-nav-client";

export const metadata = {
  title: "Admin Panel - College Notes",
  description: "Administrative dashboard",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const accessRes = await checkAdminAccess();
  if (!accessRes.success || !("data" in accessRes) || !accessRes.data) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminNavClient />
      {children}
    </div>
  );
}
