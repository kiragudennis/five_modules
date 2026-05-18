// components/notifications/notification-bell.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import {
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  getUserNotifications,
} from "@/lib/services/notification-helper";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Gift,
  Clock,
  Ticket,
  Megaphone,
  ShoppingBag,
  Coins,
  Crown,
  Package,
  CheckCircle,
  Trophy,
  Star,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";

const NOTIFICATION_ICONS: Record<string, any> = {
  draw_win: { icon: Gift, color: "text-yellow-500" },
  draw_runner_up: { icon: Trophy, color: "text-blue-500" },
  draw_reminder: { icon: Clock, color: "text-purple-500" },
  draw_entry_confirmed: { icon: Ticket, color: "text-green-500" },
  draw_consolation: { icon: Coins, color: "text-pink-500" },
  loyalty_points_earned: { icon: Star, color: "text-yellow-500" },
  loyalty_tier_upgrade: { icon: Crown, color: "text-purple-500" },
  order_confirmation: { icon: Package, color: "text-blue-500" },
  order_shipped: { icon: Package, color: "text-green-500" },
  order_delivered: { icon: CheckCircle, color: "text-green-500" },
  payment_received: { icon: Coins, color: "text-green-500" },
  payment_failed: { icon: AlertCircle, color: "text-red-500" },
  coupon_issued: { icon: Gift, color: "text-pink-500" },
  system_alert: { icon: Megaphone, color: "text-orange-500" },
};

export function NotificationBell() {
  const { supabase, profile } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!profile?.id) return;

    const [unread, notifs] = await Promise.all([
      getUnreadNotificationCount(supabase, profile.id),
      getUserNotifications(supabase, profile.id, 20, 0, true),
    ]);

    setUnreadCount(unread);
    setNotifications(notifs);
  }, [profile?.id, supabase]);

  useEffect(() => {
    loadData();

    // Subscribe to new notifications
    if (!profile?.id) return;

    const channel = supabase
      .channel(`notifications-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${profile.id}`,
        },
        () => {
          loadData();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${profile.id}`,
        },
        () => {
          loadData();
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [profile?.id, supabase, loadData]);

  const handleMarkAsRead = async (notificationId: string) => {
    await markNotificationRead(supabase, notificationId, profile!.id);
    loadData();
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsRead(supabase, profile!.id);
    loadData();
  };

  const getIcon = (type: string) => {
    const config = NOTIFICATION_ICONS[type] || NOTIFICATION_ICONS.system_alert;
    const Icon = config.icon;
    return <Icon className={`h-4 w-4 ${config.color}`} />;
  };

  if (!profile) return null;

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
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-muted/50 transition-colors cursor-pointer",
                    !notification.read && "bg-primary/5",
                  )}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(
                          new Date(notification.created_at),
                          { addSuffix: true },
                        )}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="flex-shrink-0">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="p-3 border-t">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href="/account/notifications">View all notifications</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
