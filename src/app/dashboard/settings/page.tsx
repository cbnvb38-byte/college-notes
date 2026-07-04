"use client";

import { useState } from "react";
import { Settings, Bell, Eye, Download, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [reviewAlerts, setReviewAlerts] = useState(true);
  const [autoOpenReader, setAutoOpenReader] = useState(true);

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-zinc-400 text-sm">
          Configure application preferences and notification channels.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Notifications Card */}
        <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl">
          <CardHeader className="pb-3 border-b border-zinc-800/40 flex-row items-center gap-3">
            <div className="bg-indigo-500/10 text-indigo-400 p-2.5 rounded-xl border border-indigo-500/20">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-zinc-200 font-sans">Notification Preferences</CardTitle>
              <CardDescription className="text-xs text-zinc-500">Decide how you want to be notified.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-6 flex flex-col gap-4 text-xs text-zinc-350">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-zinc-200">Email Notifications</span>
                <span className="text-[10px] text-zinc-500">Receive summaries and system announcements.</span>
              </div>
              <button 
                onClick={() => setEmailAlerts(!emailAlerts)}
                className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                  emailAlerts ? "bg-indigo-600 justify-end" : "bg-zinc-800 justify-start"
                }`}
              >
                <span className="h-4 w-4 bg-zinc-100 rounded-full" />
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-zinc-800/40 pt-4">
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-zinc-200">Note Status Alerts</span>
                <span className="text-[10px] text-zinc-500">Receive in-app alerts when uploads are approved or rejected.</span>
              </div>
              <button 
                onClick={() => setReviewAlerts(!reviewAlerts)}
                className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                  reviewAlerts ? "bg-indigo-600 justify-end" : "bg-zinc-800 justify-start"
                }`}
              >
                <span className="h-4 w-4 bg-zinc-100 rounded-full" />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Reader Preferences Card */}
        <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl">
          <CardHeader className="pb-3 border-b border-zinc-800/40 flex-row items-center gap-3">
            <div className="bg-violet-500/10 text-violet-400 p-2.5 rounded-xl border border-violet-500/20">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-zinc-200 font-sans">Document Reader Preferences</CardTitle>
              <CardDescription className="text-xs text-zinc-500">Customize how PDFs are displayed.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-6 flex flex-col gap-4 text-xs text-zinc-350">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-zinc-200">Auto-open PDF Reader</span>
                <span className="text-[10px] text-zinc-500">Instantly open documents in-app instead of displaying note detail cards.</span>
              </div>
              <button 
                onClick={() => setAutoOpenReader(!autoOpenReader)}
                className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                  autoOpenReader ? "bg-indigo-600 justify-end" : "bg-zinc-800 justify-start"
                }`}
              >
                <span className="h-4 w-4 bg-zinc-100 rounded-full" />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* System Theme Card */}
        <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl">
          <CardHeader className="pb-3 border-b border-zinc-800/40 flex-row items-center gap-3">
            <div className="bg-pink-500/10 text-pink-400 p-2.5 rounded-xl border border-pink-500/20">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-zinc-200 font-sans">Display Theme</CardTitle>
              <CardDescription className="text-xs text-zinc-500">Toggle light or dark modes.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-6 text-xs text-zinc-400 flex flex-col gap-3.5 leading-relaxed">
            <p>
              College Notes is currently optimized for a <strong>Dark Theme</strong> to protect students&apos; eyes during late-night study sessions. A custom theme switcher is planned for future platform updates.
            </p>
            <div className="flex items-center gap-2 text-zinc-500 border border-zinc-800/50 bg-zinc-900/20 p-3 rounded-xl">
              <Info className="h-4 w-4 shrink-0" />
              <span>Theme locked to system default (Dark Mode).</span>
            </div>
          </CardContent>
        </Card>

        {/* Save Settings Button */}
        <Button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs py-5.5 font-semibold shadow-lg shadow-indigo-500/10 self-start px-8">
          Save Settings
        </Button>
      </div>
    </div>
  );
}
