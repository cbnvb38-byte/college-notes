export const metadata = {
  title: "Admin Panel - College Notes",
  description: "Administrative dashboard for managing pending note verifications.",
};

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-amber-500">Admin Panel</h1>
        <p className="text-zinc-400">Manage user uploads and approve or reject documents.</p>
      </div>

      <div className="flex-1 bg-zinc-900/20 border border-amber-500/20 rounded-3xl p-8 flex items-center justify-center min-h-[400px]">
        <p className="text-amber-500/50">Admin queue coming soon...</p>
      </div>
    </div>
  );
}
