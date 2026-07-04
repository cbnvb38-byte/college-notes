"use client";

import { useUser } from "@clerk/nextjs";
import { User, Mail, GraduationCap, Calendar, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="text-zinc-500 text-sm animate-pulse">Loading profile data...</span>
      </div>
    );
  }

  const role = user?.publicMetadata?.role as string || "student";

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent">
          Student Profile
        </h1>
        <p className="text-zinc-400 text-sm">
          View and manage your academic profile information.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left column: Avatar card */}
        <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl md:col-span-1 items-center text-center">
          <CardHeader className="items-center pb-4">
            <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 p-0.5 mb-2">
              {user?.imageUrl ? (
                <img 
                  src={user.imageUrl} 
                  alt="Profile Avatar" 
                  className="h-full w-full rounded-full border border-zinc-950 object-cover" 
                />
              ) : (
                <div className="h-full w-full rounded-full bg-zinc-950 flex items-center justify-center font-bold text-xl text-indigo-400">
                  {user?.firstName?.charAt(0).toUpperCase() || "S"}
                </div>
              )}
            </div>
            <CardTitle className="text-sm font-bold text-zinc-100">{user?.fullName || "Student Account"}</CardTitle>
            <CardDescription className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
              {role} account
            </CardDescription>
          </CardHeader>
          <CardContent className="border-t border-zinc-800/40 pt-4 flex flex-col gap-3 text-xs text-zinc-400 items-start">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-zinc-500" />
              <span>Joined {new Date(user?.createdAt || Date.now()).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-zinc-500" />
              <span>Status: Active</span>
            </div>
          </CardContent>
        </Card>

        {/* Right column: Details form */}
        <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl md:col-span-2">
          <CardHeader className="pb-3 border-b border-zinc-800/40">
            <CardTitle className="text-sm font-bold text-zinc-200">Account Details</CardTitle>
            <CardDescription className="text-xs text-zinc-500">Contact and college department parameters.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">First Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input 
                      disabled
                      value={user?.firstName || ""} 
                      className="pl-9 bg-zinc-900/50 border-zinc-800 text-zinc-300 rounded-xl"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Last Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input 
                      disabled
                      value={user?.lastName || ""} 
                      className="pl-9 bg-zinc-900/50 border-zinc-800 text-zinc-300 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <Input 
                    disabled
                    value={user?.primaryEmailAddress?.emailAddress || ""} 
                    className="pl-9 bg-zinc-900/50 border-zinc-800 text-zinc-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 border-t border-zinc-800/40 pt-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Academic Department</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <select
                      className="w-full pl-9 bg-zinc-900/50 border border-zinc-800 text-xs rounded-xl h-10 px-3 text-zinc-300 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none cursor-pointer"
                      defaultValue="cs"
                    >
                      <option value="cs">Computer Science & Engineering</option>
                      <option value="ee">Electrical Engineering</option>
                      <option value="me">Mechanical Engineering</option>
                      <option value="cv">Civil Engineering</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Target Semester</label>
                  <select
                    className="bg-zinc-900/50 border border-zinc-800 text-xs rounded-xl h-10 px-3 text-zinc-300 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none cursor-pointer"
                    defaultValue="5"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>
              </div>

              <Button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs py-5.5 font-semibold mt-2 shadow-lg shadow-indigo-500/10">
                Save Profile Changes
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
