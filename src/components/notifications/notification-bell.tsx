"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUnreadNotificationCount } from "@/app/actions/notifications";

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchCount = async () => {
    const res = await getUnreadNotificationCount();
    if (res.success && "data" in res && typeof res.data === "number") {
      setUnreadCount(res.data);
    }
  };

  useEffect(() => {
    fetchCount();
    
    // Poll every 30 seconds for new notifications
    const interval = setInterval(() => {
      fetchCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Link href="/dashboard/notifications" className="relative flex items-center justify-center">
      <Button 
        variant="ghost" 
        size="icon" 
        className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 rounded-full"
      >
        <Bell className="h-4.5 w-4.5" />
      </Button>
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white border border-zinc-900 leading-none">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
