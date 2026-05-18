// src/lib/services/notification-helper.ts
// This helper bridges the DrawsService with the existing notification system

import { SupabaseClient } from "@supabase/supabase-js";

export async function createDrawNotification(
  supabase: SupabaseClient,
  userId: string,
  type:
    | "draw_win"
    | "draw_runner_up"
    | "draw_reminder"
    | "draw_entry_confirmed"
    | "draw_consolation",
  title: string,
  message: string,
  metadata: any,
): Promise<void> {
  await supabase.rpc("create_notification", {
    p_user_id: userId,
    p_type: type,
    p_title: title,
    p_message: message,
    p_metadata: metadata,
  });
}

export async function getUnreadNotificationCount(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { data, error } = await supabase.rpc("get_unread_notification_count", {
    p_user_id: userId,
  });
  if (error) throw error;
  return data || 0;
}

export async function markNotificationRead(
  supabase: SupabaseClient,
  notificationId: string,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("mark_notification_read", {
    p_notification_id: notificationId,
    p_user_id: userId,
  });
  if (error) throw error;
  return data;
}

export async function markAllNotificationsRead(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { data, error } = await supabase.rpc("mark_all_notifications_read", {
    p_user_id: userId,
  });
  if (error) throw error;
  return data;
}

export async function getUserNotifications(
  supabase: SupabaseClient,
  userId: string,
  limit: number = 20,
  offset: number = 0,
  includeRead: boolean = true,
): Promise<any[]> {
  const { data, error } = await supabase.rpc("get_user_notifications", {
    p_user_id: userId,
    p_limit: limit,
    p_offset: offset,
    p_include_read: includeRead,
  });
  if (error) throw error;
  return data || [];
}
