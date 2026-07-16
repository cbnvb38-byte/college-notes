"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, SignOutButton } from "@clerk/nextjs";
import {
  BookOpen,
  LayoutDashboard,
  UploadCloud,
  Search,
  Bookmark,
  User,
  Settings,
  ShieldAlert,
  Menu,
  X,
  Bell,
  LogOut,
  ChevronRight,
  GraduationCap,
  FileUp,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications/notification-bell";

interface DashboardShellProps {
  children: React.ReactNode;
  userRole?: string;
}

export function DashboardShell({ children, userRole = "student" }: DashboardShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useUser();

  const isAdminOrModerator = userRole === "admin" || userRole === "moderator";

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Upload Notes", href: "/dashboard/upload", icon: UploadCloud },
    { name: "My Uploads", href: "/dashboard/my-uploads", icon: FileUp },
    { name: "Study Copilot", href: "/dashboard/study-copilot", icon: Sparkles },
    { name: "Browse Notes", href: "/dashboard/browse", icon: Search },
    { name: "Bookmarks", href: "/dashboard/bookmarks", icon: Bookmark },
  ];

  const bottomNavigation = [
    { name: "Profile", href: "/dashboard/profile", icon: User },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
    ...(isAdminOrModerator ? [{ name: "Admin Panel", href: "/dashboard/admin", icon: ShieldAlert }] : []),
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex overflow-hidden font-sans select-none">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-zinc-800/40 bg-zinc-900/30 backdrop-blur-xl shrink-0 z-40">
        <div className="h-16 flex items-center px-6 border-b border-zinc-800/40">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-gradient-to-tr from-indigo-500 to-violet-500 p-1.5 rounded-lg text-white group-hover:scale-105 transition-transform duration-300">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-bold text-sm tracking-tight text-zinc-50">
              College Notes
            </span>
          </Link>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-8">
          <nav className="flex flex-col gap-1.5">
            <div className="text-xs font-semibold text-zinc-500 mb-2 px-2">Main Menu</div>
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-indigo-500/10 text-indigo-400" 
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                  )}
                >
                  <item.icon className={cn("h-4.5 w-4.5", isActive ? "text-indigo-400" : "text-zinc-400")} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <nav className="flex flex-col gap-1.5 mt-auto">
            <div className="text-xs font-semibold text-zinc-500 mb-2 px-2">Preferences</div>
            {bottomNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-indigo-500/10 text-indigo-400" 
                      : item.name === "Admin Panel" 
                        ? "text-amber-500/80 hover:text-amber-400 hover:bg-amber-500/10"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                  )}
                >
                  <item.icon className={cn("h-4.5 w-4.5", isActive ? "text-indigo-400" : "")} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-3/4 max-w-sm border-r border-zinc-800 bg-zinc-950 z-50 flex flex-col md:hidden"
            >
              <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-800/40">
                <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                  <div className="bg-gradient-to-tr from-indigo-500 to-violet-500 p-1.5 rounded-lg text-white">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <span className="font-bold text-sm tracking-tight">College Notes</span>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)} className="text-zinc-400">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-6">
                <nav className="flex flex-col gap-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
                          isActive ? "bg-indigo-500/10 text-indigo-400" : "text-zinc-400"
                        )}
                      >
                        <item.icon className="h-4.5 w-4.5" />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
                <nav className="flex flex-col gap-1 mt-auto">
                  {bottomNavigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
                          isActive ? "bg-indigo-500/10 text-indigo-400" : "text-zinc-400"
                        )}
                      >
                        <item.icon className="h-4.5 w-4.5" />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 shrink-0 border-b border-zinc-800/40 bg-zinc-900/20 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden text-zinc-400 hover:text-zinc-200"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            {/* Omni-search */}
            <div className="relative hidden sm:block w-64 md:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <Input 
                type="text"
                placeholder="Search notes, courses..." 
                className="pl-9 bg-zinc-900/50 border-zinc-800 text-xs h-9 focus:border-indigo-500/50 focus:ring-indigo-500/10 text-zinc-200 rounded-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <NotificationBell />

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 outline-none cursor-pointer rounded-full p-0.5 hover:bg-zinc-800/50 transition-colors">
                {user?.imageUrl ? (
                  <img 
                    src={user.imageUrl} 
                    alt="Avatar" 
                    className="h-8 w-8 rounded-full border border-zinc-700"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-xs">
                    {user?.firstName?.charAt(0).toUpperCase() || "S"}
                  </div>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-zinc-900 border-zinc-800 text-zinc-300 w-56" align="end">
                <DropdownMenuLabel className="text-zinc-100 flex flex-col gap-0.5">
                  <span className="text-xs font-bold">{user?.fullName || "Student"}</span>
                  <span className="text-[10px] text-zinc-500 font-medium">{user?.primaryEmailAddress?.emailAddress}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem className="p-0">
                  <Link href="/dashboard/profile" className="flex items-center gap-2.5 w-full px-2 py-1.5 hover:bg-zinc-800/50 text-xs cursor-pointer rounded-sm">
                    <User className="h-4 w-4" /> Profile Info
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="p-0">
                  <Link href="/dashboard/settings" className="flex items-center gap-2.5 w-full px-2 py-1.5 hover:bg-zinc-800/50 text-xs cursor-pointer rounded-sm">
                    <Settings className="h-4 w-4" /> Preferences
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem className="text-red-400 hover:bg-red-500/10 text-xs cursor-pointer flex gap-2.5 p-0">
                  <SignOutButton>
                    <div className="flex items-center gap-2.5 w-full px-2 py-1.5">
                      <LogOut className="h-4 w-4" /> Sign Out
                    </div>
                  </SignOutButton>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
