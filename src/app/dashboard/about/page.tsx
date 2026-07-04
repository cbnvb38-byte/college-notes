"use client";

import { GraduationCap, Award, Compass, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent">
          About College Notes
        </h1>
        <p className="text-zinc-400 text-sm">
          A platform built by students, for students, to bridge academic resource gaps.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-indigo-400" /> Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-zinc-400 leading-relaxed flex flex-col gap-4">
            <p>
              Finding structured, verified study guides and lecture notes can be incredibly challenging. Textbooks are expensive, and notes found online are often unorganized, outdated, or blurred. 
            </p>
            <p>
              <strong>College Notes</strong> was founded to resolve this. We provide a clean, secure space where students can upload their handwritten or typed PDF study guides, review sheets, and lecture summaries. By peer-verifying each upload, we ensure the material is relevant, high quality, and organized by semester.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Award className="h-5 w-5 text-violet-400" /> Why Us?
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-zinc-400 leading-relaxed flex flex-col gap-3">
            <div className="flex gap-2">
              <span className="text-indigo-400 font-bold">&bull;</span>
              <span>Dedicated PDF viewer in-app</span>
            </div>
            <div className="flex gap-2">
              <span className="text-indigo-400 font-bold">&bull;</span>
              <span>Manual verification checks</span>
            </div>
            <div className="flex gap-2">
              <span className="text-indigo-400 font-bold">&bull;</span>
              <span>Structured semester tracks</span>
            </div>
            <div className="flex gap-2">
              <span className="text-indigo-400 font-bold">&bull;</span>
              <span>Free bookmarks and offline downloads</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl">
          <CardHeader className="pb-3 flex-row items-center gap-3">
            <div className="bg-sky-500/10 text-sky-400 p-2.5 rounded-xl border border-sky-500/20">
              <Compass className="h-5 w-5" />
            </div>
            <CardTitle className="text-sm font-bold text-zinc-100 font-sans">Our Vision</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-zinc-400 leading-relaxed">
            We aim to become the default repository of academic student notes globally, helping students succeed in exam preparation, reducing textbook costs, and encouraging active learning through clean content sharing.
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl">
          <CardHeader className="pb-3 flex-row items-center gap-3">
            <div className="bg-pink-500/10 text-pink-400 p-2.5 rounded-xl border border-pink-500/20">
              <Users className="h-5 w-5" />
            </div>
            <CardTitle className="text-sm font-bold text-zinc-100 font-sans">Our Community</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-zinc-400 leading-relaxed">
            Thousands of students from multiple engineering and science departments share their guides daily. We believe in peer collaboration where active contributors are appreciated and praised by the community.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
