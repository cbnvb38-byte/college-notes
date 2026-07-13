import { getNoteAnalyticsAction } from "@/app/actions/analytics";
import AnalyticsClient from "./analytics-client";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Note Performance Analytics - College Notes",
};

interface PageProps {
  params: Promise<{ noteId: string }>;
}

export default async function NoteAnalyticsPage({ params }: PageProps) {
  const { noteId } = await params;
  const res = await getNoteAnalyticsAction(noteId);

  if (!res.success || !("data" in res)) {
    redirect("/dashboard/my-uploads");
  }

  return (
    <AnalyticsClient initialData={res.data as any} />
  );
}
