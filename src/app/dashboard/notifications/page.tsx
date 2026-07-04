"use client";

import { useState } from "react";
import { Bell, CheckCircle2, AlertCircle, Sparkles, BookOpen, Clock, MailOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  type: "info" | "success" | "warning" | "achievement";
  time: string;
  read: boolean;
}

const initialNotifications: NotificationItem[] = [
  {
    id: "1",
    title: "Note Approved",
    description: "Your note 'Compiler Design Handouts' has been approved by the admin team.",
    type: "success",
    time: "3 hours ago",
    read: false
  },
  {
    id: "2",
    title: "New Note Uploaded",
    description: "You uploaded 'DBMS Midterm Review Sheets' for review.",
    type: "info",
    time: "5 hours ago",
    read: false
  },
  {
    id: "3",
    title: "Note Rejected",
    description: "Your note 'Physics II Lab Manuals' was rejected. Click to see rejection notes.",
    type: "warning",
    time: "2 days ago",
    read: true
  },
  {
    id: "4",
    title: "Community Badge Unlocked",
    description: "Congratulations! You have unlocked the 'First Contribution' community badge.",
    type: "achievement",
    time: "1 week ago",
    read: true
  }
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(initialNotifications);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      case "achievement":
        return <Sparkles className="h-4 w-4 text-amber-400" />;
      default:
        return <BookOpen className="h-4 w-4 text-indigo-400" />;
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-12">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent">
            Notifications
          </h1>
          <p className="text-zinc-400 text-sm">
            Stay updated with note reviews, achievements, and platform status.
          </p>
        </div>
        
        {notifications.some(n => !n.read) && (
          <Button 
            onClick={markAllAsRead}
            variant="outline" 
            className="border-zinc-800 text-zinc-300 hover:bg-zinc-800/30 text-xs py-4 px-5 rounded-xl gap-2 font-semibold"
          >
            <MailOpen className="h-4 w-4" /> Mark as Read
          </Button>
        )}
      </div>

      <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl">
        <CardHeader className="pb-3 border-b border-zinc-800/40">
          <CardTitle className="text-sm font-bold text-zinc-200">Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-zinc-800/40">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500 gap-3">
              <Bell className="h-8 w-8 text-zinc-600" />
              <p className="text-sm">You have no notifications at this time.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div 
                key={n.id} 
                className={`flex items-start gap-4 px-6 py-5 transition-colors duration-200 ${
                  n.read ? "bg-transparent" : "bg-indigo-500/5 hover:bg-indigo-500/10"
                }`}
              >
                <span className={`p-2 rounded-xl border border-zinc-800/80 bg-zinc-900/50 mt-0.5`}>
                  {getIcon(n.type)}
                </span>
                
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <h4 className={`text-sm font-bold ${n.read ? "text-zinc-300" : "text-zinc-150"}`}>
                      {n.title}
                    </h4>
                    <span className="text-[10px] text-zinc-500 font-semibold flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {n.time}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                    {n.description}
                  </p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
