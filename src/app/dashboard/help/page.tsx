"use client";

import Link from "next/link";
import { User, UploadCloud, Download, Wrench, MessageSquare, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const categories = [
  {
    title: "Account Support",
    description: "Manage your profile, change role settings, resolve Clerk auth logins, or delete data.",
    icon: User,
    color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
  },
  {
    title: "Upload Issues",
    description: "Troubleshoot failed uploads, check pending note approvals, or review rejection reasons.",
    icon: UploadCloud,
    color: "text-violet-400 bg-violet-500/10 border-violet-500/20"
  },
  {
    title: "Downloads & PDF Reader",
    description: "Resolve slow downloads, rendering issues with the integrated reader, or format support.",
    icon: Download,
    color: "text-pink-400 bg-pink-500/10 border-pink-500/20"
  },
  {
    title: "Technical Issues",
    description: "Report bugs in dashboard stats, missing bookmarks, browser caching problems, or database syncing.",
    icon: Wrench,
    color: "text-sky-400 bg-sky-500/10 border-sky-500/20"
  }
];

export default function HelpCenterPage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent">
          Help Center
        </h1>
        <p className="text-zinc-400 text-sm">
          Browse categories or submit a support ticket to find resolutions.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {categories.map((cat, idx) => {
          const Icon = cat.icon;
          return (
            <Card key={idx} className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl flex flex-col justify-between">
              <CardHeader className="pb-3 flex-row items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${cat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-sm font-bold text-zinc-100">{cat.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-zinc-400 flex flex-col gap-4 flex-grow justify-between">
                <p className="leading-relaxed">{cat.description}</p>
                <Link href="/dashboard/faq" className="text-indigo-400 font-bold hover:text-indigo-300 inline-flex items-center gap-1 mt-2">
                  Browse FAQs <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Need more help panel */}
      <Card className="bg-zinc-900/40 border-zinc-800/80 backdrop-blur-md shadow-xl mt-4">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4.5">
            <div className="bg-indigo-500/10 text-indigo-400 p-3 rounded-2xl border border-indigo-500/20 shrink-0">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-100">Still need help?</h3>
              <p className="text-zinc-400 text-xs mt-1 max-w-md leading-relaxed">
                If you couldn't find your answer in our help topics, get in touch with our student support team directly.
              </p>
            </div>
          </div>
          <Link href="/dashboard/contact" className="shrink-0 w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-6 py-4.5 text-xs font-semibold shadow-lg shadow-indigo-500/10">
              Contact Support
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
