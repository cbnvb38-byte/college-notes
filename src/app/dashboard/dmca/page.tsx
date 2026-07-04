"use client";

import { Copyright, Scale, ShieldAlert, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function DMCAPage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent">
          DMCA Take-down Policy
        </h1>
        <p className="text-zinc-400 text-sm">
          We respect intellectual property rights and respond promptly to notices of alleged copyright infringement.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Policy Intro */}
        <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl">
          <CardContent className="pt-6 text-xs text-zinc-400 leading-relaxed flex flex-col gap-3">
            <p>
              In accordance with the Digital Millennium Copyright Act (&quot;DMCA&quot;), College Notes has designated an agent to receive notifications of claimed copyright infringement. We will immediately remove or disable access to materials residing on our platform that are flagged as infringing upon copyright licenses.
            </p>
          </CardContent>
        </Card>

        {/* Claim process */}
        <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl">
          <CardHeader className="pb-3 flex-row items-center gap-3">
            <div className="bg-indigo-500/10 text-indigo-400 p-2.5 rounded-xl border border-indigo-500/20">
              <Copyright className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-zinc-100 font-sans">How to File a Notice</CardTitle>
              <CardDescription className="text-xs text-zinc-500">Provide details to substantiate your copyright claim.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-xs text-zinc-400 leading-relaxed flex flex-col gap-3.5">
            <p>
              To file a copyright infringement notice, please send a written communication containing the following details to our designated copyright agent:
            </p>
            <div className="flex gap-2">
              <span className="text-indigo-400 font-bold">1.</span>
              <span>Identification of the copyrighted work claimed to have been infringed (e.g., textbook name, author, publisher).</span>
            </div>
            <div className="flex gap-2">
              <span className="text-indigo-400 font-bold">2.</span>
              <span>Identification of the material on our platform that you claim is infringing, including the specific link (URL) of the note details.</span>
            </div>
            <div className="flex gap-2">
              <span className="text-indigo-400 font-bold">3.</span>
              <span>Your contact details: name, mailing address, telephone number, and email address.</span>
            </div>
            <div className="flex gap-2">
              <span className="text-indigo-400 font-bold">4.</span>
              <span>A statement that you have a good-faith belief that use of the material is not authorized by the copyright owner.</span>
            </div>
            <div className="flex gap-2">
              <span className="text-indigo-400 font-bold">5.</span>
              <span>A statement that the information in the notification is accurate, and under penalty of perjury, that you are authorized to act on behalf of the owner.</span>
            </div>
          </CardContent>
        </Card>

        {/* Contact details */}
        <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl">
          <CardHeader className="pb-3 flex-row items-center gap-3">
            <div className="bg-pink-500/10 text-pink-400 p-2.5 rounded-xl border border-pink-500/20">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-zinc-100 font-sans">Designated Copyright Agent</CardTitle>
              <CardDescription className="text-xs text-zinc-500">Send DMCA notifications directly.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-xs text-zinc-400 leading-relaxed flex flex-col gap-3">
            <p>
              Please email notices to: <strong>dmca@collegenotes.com</strong>
            </p>
            <p className="flex items-center gap-2 text-amber-400 font-bold border border-amber-500/10 bg-amber-500/5 p-3 rounded-xl">
              <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
              Under Section 512(f) of the DMCA, any person who knowingly materially misrepresents that material or activity is infringing may be subject to liability for damages.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
