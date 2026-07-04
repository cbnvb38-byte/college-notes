import Link from "next/link";
import { GraduationCap } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-zinc-800/40 bg-zinc-950 text-zinc-400">
      <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand Panel */}
          <div className="col-span-2 flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-gradient-to-tr from-indigo-500 to-violet-500 p-2 rounded-xl text-white">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="font-bold text-lg tracking-tight text-zinc-50">
                College Notes
              </span>
            </Link>
            <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">
              A premium, secure academic document sharing hub. Created for students to collaborate and succeed together.
            </p>
            {/* Systems widget */}
            <div className="inline-flex items-center gap-2 mt-2 w-fit px-3 py-1 rounded-full border border-emerald-500/10 bg-emerald-500/5 text-xs text-emerald-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              All systems operational
            </div>
          </div>

          {/* Column 1: Browse */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Browse
            </h4>
            <ul className="flex flex-col gap-2.5 text-sm font-medium">
              <li>
                <Link href="/dashboard/browse" className="hover:text-zinc-50 transition-colors">
                  All Notes
                </Link>
              </li>
              <li>
                <Link href="/dashboard/browse" className="hover:text-zinc-50 transition-colors">
                  Branches
                </Link>
              </li>
              <li>
                <Link href="/dashboard/browse" className="hover:text-zinc-50 transition-colors">
                  Subjects
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Resources */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Resources
            </h4>
            <ul className="flex flex-col gap-2.5 text-sm font-medium">
              <li>
                <Link href="/dashboard/faq" className="hover:text-zinc-50 transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/dashboard/how-it-works" className="hover:text-zinc-50 transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/dashboard/guidelines" className="hover:text-zinc-50 transition-colors">
                  Community Guidelines
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Legal
            </h4>
            <ul className="flex flex-col gap-2.5 text-sm font-medium">
              <li>
                <Link href="/dashboard/privacy" className="hover:text-zinc-50 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/dashboard/terms" className="hover:text-zinc-50 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/dashboard/dmca" className="hover:text-zinc-50 transition-colors">
                  DMCA Take-down
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="border-t border-zinc-900 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-600 font-medium">
          <p>&copy; {new Date().getFullYear()} College Notes. Made for students worldwide.</p>
          <div className="flex gap-6">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-zinc-400 transition-colors">
              GitHub
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-zinc-400 transition-colors">
              Twitter
            </a>
            <a href="https://discord.gg" target="_blank" rel="noreferrer" className="hover:text-zinc-400 transition-colors">
              Discord
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
