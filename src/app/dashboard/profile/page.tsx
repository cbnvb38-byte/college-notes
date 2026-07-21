"use client";

import { useState, useEffect, useTransition } from "react";
import { useUser } from "@clerk/nextjs";
import { User, Mail, GraduationCap, Calendar, ShieldAlert, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getUserAIUsage, UserAIUsage } from "@/app/actions/ai-usage";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSupabase } from "@/hooks/useSupabase";
import { updateProfileSettings } from "@/app/actions/profile";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const supabase = useSupabase();
  const [role, setRole] = useState("student");
  const [isPending, startTransition] = useTransition();

  // Profile data state
  const [college, setCollege] = useState("");
  const [branch, setBranch] = useState("");
  const [bio, setBio] = useState("");

  // Privacy toggles
  const [isCollegePublic, setIsCollegePublic] = useState(true);
  const [isBranchPublic, setIsBranchPublic] = useState(true);
  const [isBioPublic, setIsBioPublic] = useState(true);
  const [isAvatarPublic, setIsAvatarPublic] = useState(true);

  // AI Usage state
  const [usageState, setUsageState] = useState<UserAIUsage | null>(null);

  useEffect(() => {
    if (user?.id) {
      supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setRole(data.role);
            setCollege(data.college || "");
            setBranch(data.branch || "");
            setBio(data.bio || "");
            setIsCollegePublic(data.is_college_public);
            setIsBranchPublic(data.is_branch_public);
            setIsBioPublic(data.is_bio_public);
            setIsAvatarPublic(data.is_avatar_public);
          }
        });
        
      getUserAIUsage().then((res) => {
        if (res.success && res.data) {
          setUsageState(res.data);
        }
      });
    }
  }, [user?.id, supabase]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="text-zinc-500 text-sm animate-pulse">Loading profile data...</span>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateProfileSettings({
        college: college.trim() || null,
        branch: branch.trim() || null,
        bio: bio.trim() || null,
        is_college_public: isCollegePublic,
        is_branch_public: isBranchPublic,
        is_bio_public: isBioPublic,
        is_avatar_public: isAvatarPublic,
      });

      if (result.success) {
        toast.success("Profile settings updated successfully");
      } else {
        const err = "error" in result ? result.error : null;
        toast.error((err as any)?.message || "Failed to update profile settings");
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent">
          Student Profile
        </h1>
        <p className="text-zinc-400 text-sm">
          View and manage your academic profile information and privacy settings.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left column: Avatar card */}
        <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl md:col-span-1 flex flex-col justify-between">
          <CardHeader className="items-center text-center pb-4">
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
          <CardContent className="border-t border-zinc-800/40 pt-4 flex flex-col gap-4 text-xs text-zinc-400 items-start w-full">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-zinc-500" />
              <span>Joined {new Date(user?.createdAt || Date.now()).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="h-4 w-4 text-zinc-500" />
              <span>Status: Active</span>
            </div>
            
            {/* Avatar Visibility Toggle */}
            <div className="flex items-center gap-2 pt-3 border-t border-zinc-800/40 w-full justify-between">
              <span className="font-semibold text-zinc-300">Public Avatar</span>
              <input
                type="checkbox"
                checked={isAvatarPublic}
                onChange={(e) => setIsAvatarPublic(e.target.checked)}
                className="h-4 w-4 rounded bg-zinc-950 border-zinc-800 text-indigo-600 focus:ring-indigo-500/50"
              />
            </div>
          </CardContent>
        </Card>

        {/* AI Usage Card */}
        {usageState && (
          <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl md:col-span-1">
            <CardHeader className="pb-3 border-b border-zinc-800/40">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-400" /> AI Subscription
                </CardTitle>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                  usageState.plan === "premium" 
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    : "bg-zinc-800 text-zinc-300 border-zinc-700"
                }`}>
                  {usageState.plan === "premium" ? "Premium" : "Free"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-zinc-400">Monthly AI Generations</span>
                  <span className={usageState.usedThisMonth >= usageState.monthlyLimit ? "text-red-400" : "text-zinc-200"}>
                    {usageState.usedThisMonth} / {usageState.monthlyLimit}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/50">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      usageState.usedThisMonth >= usageState.monthlyLimit 
                        ? "bg-red-500" 
                        : usageState.usedThisMonth >= (usageState.monthlyLimit * 0.8)
                          ? "bg-amber-500"
                          : "bg-indigo-500"
                    }`}
                    style={{ width: `${Math.min(100, (usageState.usedThisMonth / usageState.monthlyLimit) * 100)}%` }}
                  />
                </div>
                {usageState.plan === "free" && (
                  <Link href="/pricing" className="mt-3">
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-9 text-xs rounded-xl transition-all shadow-lg shadow-indigo-500/10">
                      Upgrade to Premium <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        {/* Right column: Details form */}
        <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl md:col-span-2">
          <CardHeader className="pb-3 border-b border-zinc-800/40">
            <CardTitle className="text-sm font-bold text-zinc-200">Account Details</CardTitle>
            <CardDescription className="text-xs text-zinc-500">Contact and college department parameters.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSave} className="flex flex-col gap-5">
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

              {/* Bio Section */}
              <div className="flex flex-col gap-2 border-t border-zinc-800/40 pt-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Bio</label>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span>Show publicly</span>
                    <input
                      type="checkbox"
                      checked={isBioPublic}
                      onChange={(e) => setIsBioPublic(e.target.checked)}
                      className="h-3.5 w-3.5 rounded bg-zinc-950 border-zinc-800 text-indigo-600 focus:ring-indigo-500/50"
                    />
                  </div>
                </div>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell other students about yourself..."
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none min-h-[80px] resize-none"
                />
              </div>

              {/* College & Branch */}
              <div className="grid sm:grid-cols-2 gap-4 border-t border-zinc-800/40 pt-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">College</label>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <span>Show publicly</span>
                      <input
                        type="checkbox"
                        checked={isCollegePublic}
                        onChange={(e) => setIsCollegePublic(e.target.checked)}
                        className="h-3.5 w-3.5 rounded bg-zinc-950 border-zinc-800 text-indigo-600 focus:ring-indigo-500/50"
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input 
                      value={college} 
                      onChange={(e) => setCollege(e.target.value)}
                      placeholder="e.g. Stanford University"
                      className="pl-9 bg-zinc-900/50 border-zinc-800 text-zinc-300 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Branch / Dept</label>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <span>Show publicly</span>
                      <input
                        type="checkbox"
                        checked={isBranchPublic}
                        onChange={(e) => setIsBranchPublic(e.target.checked)}
                        className="h-3.5 w-3.5 rounded bg-zinc-950 border-zinc-800 text-indigo-600 focus:ring-indigo-500/50"
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input 
                      value={branch} 
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="e.g. Computer Science"
                      className="pl-9 bg-zinc-900/50 border-zinc-800 text-zinc-300 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <Button disabled={isPending} type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs py-5.5 font-semibold mt-2 shadow-lg shadow-indigo-500/10">
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Profile Changes"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
