"use client";

import { ShieldCheck, Key, Laptop, Smartphone, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AccountSecurityPage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent">
          Account Security
        </h1>
        <p className="text-zinc-400 text-sm">
          Manage authentication methods, sessions, and keep your student profile safe.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Security Summary */}
        <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl col-span-2 flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-400" /> Security Checklist
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">Key metrics for user verification.</CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-zinc-400 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-zinc-800/50 pb-3">
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-zinc-200">Clerk Password Authentication</span>
                <span className="text-[10px] text-zinc-500">Secure single sign-on connected.</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-[9px] text-emerald-400 font-bold uppercase tracking-wider">
                Active
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-zinc-800/50 pb-3">
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-zinc-200">Multi-Factor Authentication (MFA)</span>
                <span className="text-[10px] text-zinc-500">Add an extra verification layer to your account.</span>
              </div>
              <Button size="sm" variant="outline" className="border-zinc-800 text-zinc-300 hover:bg-zinc-800/30 text-[10px] font-bold px-3.5 h-8 rounded-lg">
                Enable
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-zinc-200">Security Log Tracking</span>
                <span className="text-[10px] text-zinc-500">Log browser cookies and session states.</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-[9px] text-emerald-400 font-bold uppercase tracking-wider">
                Active
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Change Password Info */}
        <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Key className="h-5 w-5 text-violet-400" /> Clerk Security
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-zinc-400 leading-relaxed flex flex-col gap-4">
            <p>
              Your credentials are managed securely by <strong>Clerk Auth</strong>. To change your email address, update passwords, or set up MFA:
            </p>
            <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs py-5 font-semibold shadow-lg shadow-indigo-500/10">
              Manage Clerk Credentials
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Active Sessions */}
      <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl">
        <CardHeader className="pb-3 border-b border-zinc-800/40">
          <CardTitle className="text-sm font-bold text-zinc-200">Active Devices & Sessions</CardTitle>
          <CardDescription className="text-xs text-zinc-500">Devices currently logged into your student account.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-zinc-800/40">
          <div className="flex items-center justify-between px-6 py-4.5">
            <div className="flex items-center gap-4">
              <div className="bg-zinc-900/80 border border-zinc-800 text-zinc-400 p-2 rounded-xl shrink-0">
                <Laptop className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-zinc-200">Chrome on Windows 11</h4>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-[9px] text-indigo-400 font-bold uppercase tracking-wider">
                    Current Device
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-0.5">IP Address: 192.168.1.45 &bull; Last active: Just now</p>
              </div>
            </div>
            <Button size="sm" variant="ghost" className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 text-xs font-bold rounded-lg px-3">
              Revoke Session
            </Button>
          </div>

          <div className="flex items-center justify-between px-6 py-4.5">
            <div className="flex items-center gap-4">
              <div className="bg-zinc-900/80 border border-zinc-800 text-zinc-400 p-2 rounded-xl shrink-0">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-200">Safari on iPhone 15</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">IP Address: 103.45.21.90 &bull; Last active: 2 hours ago</p>
              </div>
            </div>
            <Button size="sm" variant="ghost" className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 text-xs font-bold rounded-lg px-3">
              Revoke Session
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
