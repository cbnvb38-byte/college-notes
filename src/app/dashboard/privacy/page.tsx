"use client";

import { Eye, Shield, Lock, Share2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent">
          Privacy Policy
        </h1>
        <p className="text-zinc-400 text-sm">
          Last Updated: July 2026. Learn how we handle your personal data and protect your rights.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Intro */}
        <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl">
          <CardContent className="pt-6 text-xs text-zinc-400 leading-relaxed flex flex-col gap-3">
            <p>
              At College Notes, we value your trust and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and share information when you use our web application, tools, and services.
            </p>
            <p>
              By accessing or using College Notes, you agree to the collection and use of information in accordance with this policy.
            </p>
          </CardContent>
        </Card>

        {/* Categories */}
        <div className="grid sm:grid-cols-2 gap-6">
          <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl">
            <CardHeader className="pb-3 flex-row items-center gap-3">
              <div className="bg-indigo-500/10 text-indigo-400 p-2.5 rounded-xl border border-indigo-500/20">
                <Eye className="h-5 w-5" />
              </div>
              <CardTitle className="text-sm font-bold text-zinc-100 font-sans">Information We Collect</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-zinc-400 leading-relaxed flex flex-col gap-3">
              <p>
                <strong>Account Data:</strong> When you register using Clerk, we retrieve your email address, name, and profile photo.
              </p>
              <p>
                <strong>Uploaded Materials:</strong> Any PDF notes, files, metadata, subjects, or semesters you post onto the platform.
              </p>
              <p>
                <strong>Usage Metrics:</strong> We log download counts, favorites, search queries, and browser details to improve performance.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl">
            <CardHeader className="pb-3 flex-row items-center gap-3">
              <div className="bg-violet-500/10 text-violet-400 p-2.5 rounded-xl border border-violet-500/20">
                <Shield className="h-5 w-5" />
              </div>
              <CardTitle className="text-sm font-bold text-zinc-100 font-sans">How We Use Information</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-zinc-400 leading-relaxed flex flex-col gap-3">
              <p>
                <strong>Platform Operations:</strong> Reviewing and displaying notes, tracking user contributions, and rendering profiles.
              </p>
              <p>
                <strong>Notifications:</strong> Updating you on status approvals, bookmarks, and account alerts.
              </p>
              <p>
                <strong>Security:</strong> Preventing automated scraping, denial of service attacks, academic fraud, and duplicate spamming.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Security and Sharing */}
        <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl">
          <CardHeader className="pb-3 flex-row items-center gap-3">
            <div className="bg-sky-500/10 text-sky-400 p-2.5 rounded-xl border border-sky-500/20">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-zinc-100">Data Security & Encryption</CardTitle>
              <CardDescription className="text-xs text-zinc-500">We encrypt your metadata and store files in secure buckets.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-xs text-zinc-400 leading-relaxed flex flex-col gap-3">
            <p>
              We implement industry-standard security protocols to protect your info. All file uploads are scanned for malicious scripts and hosted on secured cloud servers. While we strive to use commercially acceptable means to protect your personal data, no method of transmission over the Internet is 100% secure.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl">
          <CardHeader className="pb-3 flex-row items-center gap-3">
            <div className="bg-pink-500/10 text-pink-400 p-2.5 rounded-xl border border-pink-500/20">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-zinc-100">Third-Party Services</CardTitle>
              <CardDescription className="text-xs text-zinc-500">We work with trusted partners to operate our platform.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-xs text-zinc-400 leading-relaxed flex flex-col gap-3">
            <p>
              We use <strong>Clerk</strong> for secure sign-in/identity management, and <strong>Supabase</strong> for database storage. These partners have their own privacy policies governing how they handle your user credentials and session data. We do not sell or trade your data to third-party ad networks.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
