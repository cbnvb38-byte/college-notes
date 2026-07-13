import { getReviewsReceivedAction } from "@/app/actions/reviews-received";
import ReviewsReceivedClient from "./reviews-received-client";
import { redirect } from "next/navigation";
import { checkAdminAccess } from "@/app/actions/admin";
import { auth } from "@clerk/nextjs/server";

export const metadata = {
  title: "Reviews Received - College Notes",
};

interface PageProps {
  searchParams: Promise<{
    noteId?: string;
    star?: string;
    sortBy?: string;
    page?: string;
  }>;
}

export default async function ReviewsReceivedPage({ searchParams }: PageProps) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const sparams = await searchParams;

  const filters = {
    noteId: sparams.noteId || undefined,
    star: sparams.star ? parseInt(sparams.star, 10) : undefined,
    sortBy: (sparams.sortBy as any) || "newest",
    page: sparams.page ? parseInt(sparams.page, 10) : 1,
  };

  const res = await getReviewsReceivedAction(filters);

  if (!res.success || !("data" in res)) {
    redirect("/dashboard/my-uploads");
  }

  return (
    <ReviewsReceivedClient 
      initialData={res.data as any} 
      activeFilters={filters}
    />
  );
}
