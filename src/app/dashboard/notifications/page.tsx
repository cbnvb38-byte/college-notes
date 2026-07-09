"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCircle2, AlertCircle, Sparkles, BookOpen, Clock, MailOpen, Trash2, Loader2, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  getCurrentUserNotifications, 
  markAllNotificationsAsRead, 
  markNotificationAsRead, 
  deleteNotification 
} from "@/app/actions/notifications";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      const res = await getCurrentUserNotifications();
      if (res.success && "data" in res && res.data) {
        setNotifications(res.data as NotificationItem[]);
      } else {
        toast.error("Failed to load notifications.");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while loading notifications.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true);
    try {
      const res = await markAllNotificationsAsRead();
      if (res.success) {
        setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        toast.success("All notifications marked as read");
      } else {
        toast.error("Failed to mark notifications as read");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleNotificationClick = async (n: NotificationItem) => {
    // Optimistically mark as read locally
    if (!n.is_read) {
      setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, is_read: true } : item));
      await markNotificationAsRead(n.id);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // prevent triggering the click on the notification itself
    const previous = [...notifications];
    setNotifications(prev => prev.filter(n => n.id !== id));
    
    try {
      const res = await deleteNotification(id);
      if (res.success) {
        toast.success("Notification deleted");
      } else {
        setNotifications(previous);
        toast.error("Failed to delete notification");
      }
    } catch (error) {
      setNotifications(previous);
      toast.error("An error occurred");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "note_approved":
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case "note_rejected":
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      case "new_comment":
        return <Sparkles className="h-4 w-4 text-amber-400" />;
      default:
        return <BookOpen className="h-4 w-4 text-indigo-400" />;
    }
  };
  
  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    }).format(d);
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
        
        {notifications.some(n => !n.is_read) && (
          <Button 
            onClick={handleMarkAllAsRead}
            disabled={isMarkingAll || isLoading}
            variant="outline" 
            className="border-zinc-800 text-zinc-300 hover:bg-zinc-800/30 text-xs py-4 px-5 rounded-xl gap-2 font-semibold"
          >
            {isMarkingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailOpen className="h-4 w-4" />} 
            Mark as Read
          </Button>
        )}
      </div>

      <Card className="bg-zinc-900/30 border-zinc-800/60 backdrop-blur-sm shadow-xl">
        <CardHeader className="pb-3 border-b border-zinc-800/40">
          <CardTitle className="text-sm font-bold text-zinc-200">Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-zinc-800/40">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500 gap-3">
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
              <p className="text-sm">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500 gap-3">
              <Bell className="h-8 w-8 text-zinc-600" />
              <h3 className="font-bold text-zinc-300">No notifications yet</h3>
              <p className="text-sm">Updates about your notes and account will appear here.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div 
                key={n.id} 
                onClick={() => handleNotificationClick(n)}
                className={`flex items-start gap-4 px-6 py-5 transition-colors duration-200 group cursor-pointer ${
                  n.is_read ? "bg-transparent" : "bg-indigo-500/5 hover:bg-indigo-500/10"
                }`}
              >
                <span className={`p-2 rounded-xl border border-zinc-800/80 bg-zinc-900/50 mt-0.5 flex-shrink-0`}>
                  {getIcon(n.type)}
                </span>
                
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex flex-col min-w-0 flex-1">
                      <h4 className={`text-sm font-bold flex items-center gap-2 ${n.is_read ? "text-zinc-300" : "text-zinc-100"}`}>
                        <span className="truncate">{n.title}</span>
                      </h4>
                      <p className="text-xs text-zinc-400 leading-relaxed mt-1 break-words">
                        {n.message}
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className="text-[10px] text-zinc-500 font-semibold flex items-center gap-1 whitespace-nowrap">
                        <Clock className="h-3 w-3" /> {formatDate(n.created_at)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDelete(e, n.id)}
                        className="h-6 w-6 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
