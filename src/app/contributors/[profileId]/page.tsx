import { getPublicContributorProfile } from "@/app/actions/profile";
import ContributorProfileClient from "./contributor-profile-client";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

interface PageProps {
  params: Promise<{ profileId: string }>;
}

export default async function PublicContributorPage({ params }: PageProps) {
  const { profileId } = await params;
  const res = await getPublicContributorProfile(profileId);

  if (!res.success || !("data" in res)) {
    notFound();
  }

  const { profile, stats, notes } = res.data;

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-50 overflow-hidden flex flex-col font-sans">
      {/* Decorative background blur */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none opacity-20 z-0">
        <div className="absolute top-[10%] left-[15%] w-[450px] h-[450px] rounded-full bg-indigo-600 blur-[130px] animate-pulse duration-[8000ms]" />
        <div className="absolute top-[20%] right-[15%] w-[400px] h-[400px] rounded-full bg-violet-600 blur-[140px] animate-pulse duration-[10000ms]" />
      </div>

      <Header />
      <main className="flex-grow z-10 pt-24 pb-16 px-6 max-w-7xl mx-auto w-full">
        <ContributorProfileClient 
          profile={profile} 
          stats={stats} 
          notes={notes} 
        />
      </main>
      <Footer />
    </div>
  );
}
