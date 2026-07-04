"use client";

import Link from "next/link";
import { GraduationCap, ArrowRight, Menu } from "lucide-react";
import { SignInButton, Show, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/40 bg-zinc-950/75 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-gradient-to-tr from-indigo-500 via-indigo-600 to-violet-600 p-2 rounded-xl text-white group-hover:scale-105 transition-transform duration-300 shadow-md shadow-indigo-500/10">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent">
            College Notes
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
          <Link href="/dashboard/browse" className="hover:text-zinc-50 transition-colors duration-200">
            Browse Notes
          </Link>
          <Link href="/dashboard" className="hover:text-zinc-50 transition-colors duration-200">
            Dashboard
          </Link>
          <Link href="/dashboard/how-it-works" className="hover:text-zinc-50 transition-colors duration-200">
            How It Works
          </Link>
          <Link href="/dashboard/faq" className="hover:text-zinc-50 transition-colors duration-200">
            FAQ
          </Link>
        </nav>

        {/* Actions Menu */}
        <div className="flex items-center gap-4">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button
                variant="ghost"
                size="sm"
                className="text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800/50"
              >
                Sign In
              </Button>
            </SignInButton>
            <SignInButton mode="modal">
              <Button
                size="sm"
                className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg hover:shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                Get Started
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <Link href="/dashboard" className="hidden sm:inline-flex">
              <Button
                variant="ghost"
                size="sm"
                className="text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800/50 mr-2"
              >
                Go to Dashboard
              </Button>
            </Link>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9 rounded-full ring-2 ring-indigo-500/25 hover:ring-indigo-500/50 transition-all duration-200",
                },
              }}
            />
          </Show>
        </div>
      </div>
    </header>
  );
}
