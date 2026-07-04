"use client";

import { Scale, FileText, AlertTriangle, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function TermsOfServicePage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent">
          Terms of Service
        </h1>
        <p className="text-zinc-400 text-sm">
          Last Updated: July 2026. Please read our service agreement terms carefully.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Intro */}
        <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl">
          <CardContent className="pt-6 text-xs text-zinc-400 leading-relaxed flex flex-col gap-3">
            <p>
              Welcome to College Notes! These Terms of Service (&quot;Terms&quot;) govern your access to and use of our website, services, and applications. By registering or using the platform, you agree to be bound by these Terms.
            </p>
            <p>
              If you do not agree to these terms, do not access or use our services.
            </p>
          </CardContent>
        </Card>

        {/* Content */}
        <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl">
          <CardHeader className="pb-3 flex-row items-center gap-3">
            <div className="bg-indigo-500/10 text-indigo-400 p-2.5 rounded-xl border border-indigo-500/20">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-zinc-100 font-sans">1. Account Registration</CardTitle>
              <CardDescription className="text-xs text-zinc-500">Requirements for platform membership.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-xs text-zinc-400 leading-relaxed flex flex-col gap-3">
            <p>
              You must register for an account using valid details. You are responsible for safeguarding your login keys and password. You agree to notify us immediately of any unauthorized access.
            </p>
            <p>
              We reserve the right to suspend accounts that use fake profiles, email domains, or impersonate other students or institutions.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl">
          <CardHeader className="pb-3 flex-row items-center gap-3">
            <div className="bg-violet-500/10 text-violet-400 p-2.5 rounded-xl border border-violet-500/20">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-zinc-100 font-sans">2. User Uploaded Notes</CardTitle>
              <CardDescription className="text-xs text-zinc-500">Ownership and license rules.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-xs text-zinc-400 leading-relaxed flex flex-col gap-3">
            <p>
              You retain ownership of the study materials you compile and upload. However, by posting notes on College Notes, you grant us a worldwide, non-exclusive, royalty-free license to host, display, reproduce, and distribute the files to platform members.
            </p>
            <p>
              You guarantee that you own the rights or have permission to distribute the uploaded PDFs. Plagiarized or copyrighted materials will be flagged and removed.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl">
          <CardHeader className="pb-3 flex-row items-center gap-3">
            <div className="bg-pink-500/10 text-pink-400 p-2.5 rounded-xl border border-pink-500/20">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-zinc-100 font-sans">3. Fair Use & Prohibited Activities</CardTitle>
              <CardDescription className="text-xs text-zinc-500">Actions that lead to suspensions.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-xs text-zinc-400 leading-relaxed flex flex-col gap-3">
            <p>
              You agree not to use bots to mass-download notes, scrape metadata, or trigger spam uploads. You also agree to adhere to our Community Guidelines and academic integrity policies. Attempting to bypass verification checks, cheat on university exams via notes, or sell uploaded documents privately on the system is strictly banned.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl">
          <CardHeader className="pb-3 flex-row items-center gap-3">
            <div className="bg-sky-500/10 text-sky-400 p-2.5 rounded-xl border border-sky-500/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-zinc-100 font-sans">4. Disclaimers & Liability Limits</CardTitle>
              <CardDescription className="text-xs text-zinc-500">Service reliability and warranty exemptions.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-xs text-zinc-400 leading-relaxed flex flex-col gap-3">
            <p>
              College Notes is provided &quot;as is&quot; and &quot;as available.&quot; We do not guarantee the completeness, accuracy, or quality of user-uploaded files. We are not liable for any academic outcome, system downtime, file loss, or direct/indirect damages arising from the use of our services.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
