// components/NotificationBell.tsx
import { useState, useEffect } from "react";
import { Bell, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/lib/context/AuthContext";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  metadata: any;
}

export function NotificationBell() {
  const { supabase, profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchNotifications();

      // Subscribe to new notifications
      const subscription = supabase
        .channel("notifications")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${profile?.id}`,
          },
          (payload: any) => {
            setNotifications((prev) => [payload.new as Notification, ...prev]);
            setUnreadCount((prev) => prev + 1);
          },
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [profile, supabase]);

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", profile?.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.read).length);
    }
  };

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase.rpc("mark_notification_read", {
      p_notification_id: notificationId,
      p_user_id: profile?.id,
    });

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    const { error } = await supabase.rpc("mark_all_notifications_read", {
      p_user_id: profile?.id,
    });

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "loyalty_partial_redeem":
        return <div className="h-2 w-2 rounded-full bg-blue-500" />;
      case "loyalty_points_earned":
        return <div className="h-2 w-2 rounded-full bg-green-500" />;
      case "loyalty_tier_upgrade":
        return <div className="h-2 w-2 rounded-full bg-purple-500" />;
      default:
        return <div className="h-2 w-2 rounded-full bg-gray-500" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center">
              <Bell className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
                    !notification.read ? "bg-blue-50 dark:bg-blue-950/20" : ""
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium mb-1">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDistanceToNow(
                          new Date(notification.created_at),
                          {
                            addSuffix: true,
                          },
                        )}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
