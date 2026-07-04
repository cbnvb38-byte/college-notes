"use client";

import { UserPlus, UserCheck, UploadCloud, Eye, CheckCircle2, Search, Download, Bookmark, Star, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface Step {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const steps: Step[] = [
  {
    title: "1. Create an Account",
    description: "Sign up securely using Clerk auth. You get instant access to the platform as a student.",
    icon: UserPlus,
    color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
  },
  {
    title: "2. Complete Profile",
    description: "Update your profile with your department, branch, and current target semester so we can suggest relevant notes.",
    icon: UserCheck,
    color: "text-violet-400 bg-violet-500/10 border-violet-500/20"
  },
  {
    title: "3. Upload Notes",
    description: "Share your own study materials, exam summaries, or class notes in PDF format. Keep them clean and organized.",
    icon: UploadCloud,
    color: "text-sky-400 bg-sky-500/10 border-sky-500/20"
  },
  {
    title: "4. Review Process",
    description: "Our admin team reviews your notes to ensure formatting, readability, and content match our quality standards.",
    icon: Eye,
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20"
  },
  {
    title: "5. Admin Approval",
    description: "Once approved, your note goes public and is added to the general notes library. If rejected, you'll see why.",
    icon: CheckCircle2,
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
  },
  {
    title: "6. Discover Notes",
    description: "Use the omni-search or browse page to search notes by subject, semester, title, or branch.",
    icon: Search,
    color: "text-blue-400 bg-blue-500/10 border-blue-500/20"
  },
  {
    title: "7. Download Notes",
    description: "Download PDFs instantly or read them directly in our integrated web-friendly document reader.",
    icon: Download,
    color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20"
  },
  {
    title: "8. Bookmark",
    description: "Save notes you reference frequently to your bookmarks so you can quickly access them from your workspace.",
    icon: Bookmark,
    color: "text-pink-400 bg-pink-500/10 border-pink-500/20"
  },
  {
    title: "9. Rate and Review",
    description: "Provide feedback and ratings on downloaded materials to help other students choose the best summaries.",
    icon: Star,
    color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
  },
  {
    title: "10. Build Reputation",
    description: "Earn points as other students download and upvote your notes. Become a top contributor in your college!",
    icon: ShieldAlert,
    color: "text-teal-400 bg-teal-500/10 border-teal-500/20"
  }
];

export default function HowItWorksPage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent">
          How It Works
        </h1>
        <p className="text-zinc-400 text-sm">
          A step-by-step walkthrough of the College Notes lifecycle, from signup to building student reputation.
        </p>
      </div>

      <div className="relative border-l border-zinc-800 ml-4 pl-8 py-4 flex flex-col gap-8">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div key={idx} className="relative group">
              {/* Timeline dot */}
              <span className={`absolute -left-[45px] top-1.5 h-8 w-8 rounded-xl border flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${step.color}`}>
                <Icon className="h-4.5 w-4.5" />
              </span>

              <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl transition-all duration-300 hover:border-zinc-700/60 hover:bg-zinc-900/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-zinc-100">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
