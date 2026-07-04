"use client";

import { CheckCircle2, AlertOctagon, GraduationCap, ShieldAlert, FileText, Heart, ShieldX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function GuidelinesPage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent">
          Community Guidelines
        </h1>
        <p className="text-zinc-400 text-sm">
          Please read these rules carefully to help us maintain a clean, supportive, and academically honest environment.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Allowed Content */}
        <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl">
          <CardHeader className="pb-3 border-b border-zinc-800/40">
            <CardTitle className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Allowed Content
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              What you should share on College Notes.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col gap-3.5 text-xs text-zinc-300">
            <div className="flex gap-3">
              <span className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span><strong>Self-written Lecture Summaries:</strong> Detailed, clean summaries compiled from class lectures.</span>
            </div>
            <div className="flex gap-3">
              <span className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span><strong>Self-made Exam Guides:</strong> Formulas, study guides, sheets, and review checklists.</span>
            </div>
            <div className="flex gap-3">
              <span className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span><strong>Practice Problems:</strong> Math, code, or science questions along with your own step-by-step solutions.</span>
            </div>
            <div className="flex gap-3">
              <span className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span><strong>Laboratory Prep Guides:</strong> General summaries of experiments and laboratory methodologies.</span>
            </div>
          </CardContent>
        </Card>

        {/* Prohibited Content */}
        <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl">
          <CardHeader className="pb-3 border-b border-zinc-800/40">
            <CardTitle className="text-sm font-bold text-red-400 flex items-center gap-2">
              <AlertOctagon className="h-4 w-4" /> Prohibited Content
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              What is strictly banned on our platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col gap-3.5 text-xs text-zinc-300">
            <div className="flex gap-3">
              <span className="h-2 w-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
              <span><strong>Copyrighted Materials:</strong> Scanning textbook pages, commercial prep books, or publisher materials.</span>
            </div>
            <div className="flex gap-3">
              <span className="h-2 w-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
              <span><strong>Official Exam Keys:</strong> Uploading leaks of actual ongoing or future tests, quizzes, or exams.</span>
            </div>
            <div className="flex gap-3">
              <span className="h-2 w-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
              <span><strong>Unmodified Professor Slides:</strong> Copying slides or guides distributed directly by faculty unless authorized.</span>
            </div>
            <div className="flex gap-3">
              <span className="h-2 w-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
              <span><strong>Irrelevant Files:</strong> Selfies, memes, music, or unrelated files that aren't college notes.</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rules Breakdown */}
      <div className="flex flex-col gap-6">
        {/* Academic Integrity */}
        <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl">
          <CardHeader className="pb-3 flex-row items-center gap-3">
            <div className="bg-indigo-500/10 text-indigo-400 p-2.5 rounded-xl border border-indigo-500/20">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-zinc-100">Academic Integrity & Copyright</CardTitle>
              <CardDescription className="text-xs text-zinc-500">Respect educational standards and legal rights.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-xs text-zinc-400 flex flex-col gap-3.5 leading-relaxed">
            <p>
              <strong>Academic Integrity:</strong> Sharing summaries is meant to help peers learn, not help them cheat. Do not upload current active homework answers, live take-home test answers, or solutions that violate your university's honor code.
            </p>
            <p>
              <strong>Copyright:</strong> If you do not own the content, do not upload it. If you compile notes based on external materials, ensure you summarize them in your own words rather than copying them verbatim. We comply immediately with all DMCA takedown requests.
            </p>
          </CardContent>
        </Card>

        {/* Duplicate Uploads & Spam Prevention */}
        <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl">
          <CardHeader className="pb-3 flex-row items-center gap-3">
            <div className="bg-violet-500/10 text-violet-400 p-2.5 rounded-xl border border-violet-500/20">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-zinc-100">Duplicate Uploads & Spam Prevention</CardTitle>
              <CardDescription className="text-xs text-zinc-500">Protect the quality of the catalog.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-xs text-zinc-400 flex flex-col gap-3.5 leading-relaxed">
            <p>
              <strong>Spam:</strong> Uploading the same note multiple times, dividing a small document into multiple tiny single-page uploads, or uploading gibberish files to bump up download points is spamming. 
            </p>
            <p>
              <strong>Duplicate Uploads:</strong> Check if a comprehensive note guide for a course already exists. Try adding new branches or semesters instead of uploading identical notes.
            </p>
          </CardContent>
        </Card>

        {/* File Quality Standards */}
        <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl">
          <CardHeader className="pb-3 flex-row items-center gap-3">
            <div className="bg-sky-500/10 text-sky-400 p-2.5 rounded-xl border border-sky-500/20">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-zinc-100">File Quality Standards</CardTitle>
              <CardDescription className="text-xs text-zinc-500">Document readability guidelines.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-xs text-zinc-400 flex flex-col gap-3.5 leading-relaxed">
            <p>
              Ensure all scanned PDFs are readable. Notes with heavy hand-writing should be photographed using a scanning app to improve contrast. Blurry pages, illegible notes, or pages with cutoffs will be rejected by our review board.
            </p>
          </CardContent>
        </Card>

        {/* Respectful Behavior & Violations */}
        <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl">
          <CardHeader className="pb-3 flex-row items-center gap-3">
            <div className="bg-pink-500/10 text-pink-400 p-2.5 rounded-xl border border-pink-500/20">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-zinc-100">Respectful Behavior & Consequences</CardTitle>
              <CardDescription className="text-xs text-zinc-500">Safe collaboration for everyone.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-xs text-zinc-400 flex flex-col gap-3.5 leading-relaxed">
            <p>
              <strong>Respect:</strong> Our comment systems, reviews, and community pages must remain civil. Hate speech, harassment, academic shaming, or advertising external cheating services will lead to instant account termination.
            </p>
            <p className="flex items-center gap-2 text-red-400 font-bold border border-red-500/10 bg-red-500/5 p-3 rounded-xl">
              <ShieldX className="h-4.5 w-4.5 shrink-0" />
              Consequences of violations include: content removal, points penalty, submission freeze, and permanent IP/account bans.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
